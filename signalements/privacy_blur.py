"""
Service de vision par ordinateur pour l'anonymisation automatique des photos.
Conforme aux exigences de confidentialité de l'INPDP (Instance Nationale de Protection des Données Personnelles).
- Détection et floutage fort (GaussianBlur) des visages et plaques d'immatriculation.
- Suppression intégrale des métadonnées EXIF (géolocalisation GPS, appareil, horodatage matériel).
"""

import os
import io
import logging
import urllib.request
import cv2
import numpy as np
from PIL import Image
from django.core.files.base import ContentFile

logger = logging.getLogger(__name__)

# Dossier local de stockage des cascades Haar pré-entraînés
CASCADES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cascades')

FACE_CASCADE_NAME = 'haarcascade_frontalface_default.xml'
PLATE_CASCADE_NAME = 'haarcascade_russian_plate_number.xml'

OPENCV_CASCADE_URLS = {
    FACE_CASCADE_NAME: f'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/{FACE_CASCADE_NAME}',
    PLATE_CASCADE_NAME: f'https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/{PLATE_CASCADE_NAME}',
}


def _resolve_cascade_path(cascade_filename: str) -> str:
    """
    Localise un fichier cascade Haar sur le disque, ou le télécharge dynamiquement
    depuis le dépôt officiel OpenCV en cas d'absence.
    """
    # 1. Vérification dans signalements/cascades/
    local_path = os.path.join(CASCADES_DIR, cascade_filename)
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        return local_path

    # 2. Vérification dans cv2.data.haarcascades (standard OpenCV)
    if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
        cv_builtin = os.path.join(cv2.data.haarcascades, cascade_filename)
        if os.path.exists(cv_builtin) and os.path.getsize(cv_builtin) > 0:
            return cv_builtin

    # 3. Téléchargement dynamique depuis le dépôt officiel OpenCV
    if cascade_filename in OPENCV_CASCADE_URLS:
        try:
            os.makedirs(CASCADES_DIR, exist_ok=True)
            url = OPENCV_CASCADE_URLS[cascade_filename]
            logger.info("Téléchargement du cascade OpenCV %s...", cascade_filename)
            urllib.request.urlretrieve(url, local_path)
            if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
                return local_path
        except Exception as exc:
            logger.warning("Échec du téléchargement dynamique de %s : %s", cascade_filename, exc)

    return ""


def _load_cascade(cascade_filename: str):
    """Charge un classifieur CascadeClassifier OpenCV en gérant les exceptions proprement."""
    try:
        path = _resolve_cascade_path(cascade_filename)
        if path and os.path.exists(path):
            classifier = cv2.CascadeClassifier(path)
            if not classifier.empty():
                return classifier
    except Exception as exc:
        logger.warning("Impossible d'initialiser le cascade %s : %s", cascade_filename, exc)
    return None


def _detect_plate_contours(gray_img: np.ndarray, img_w: int, img_h: int):
    """
    Détection de contour rectangulaire pour les plaques d'immatriculation (format standard urbain/tunisien).
    Recherche les contours à 4 sommets avec un ratio largeur/hauteur caractéristique.
    """
    candidates = []
    try:
        blurred = cv2.bilateralFilter(gray_img, 11, 17, 17)
        edged = cv2.Canny(blurred, 30, 200)

        contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
        contours = sorted(contours, key=cv2.contourArea, reverse=True)[:25]

        img_area = img_w * img_h
        for c in contours:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = w / float(h) if h > 0 else 0
                area = w * h
                # Les plaques ont un ratio largeur/hauteur typique (1.8 à 5.8) et une surface relative
                if 1.8 <= aspect_ratio <= 5.8 and (0.0005 * img_area) <= area <= (0.12 * img_area):
                    candidates.append((x, y, w, h))
    except Exception as exc:
        logger.debug("Erreur analyse contours plaques : %s", exc)
    return candidates


def _merge_overlapping_boxes(boxes, overlap_threshold=0.3):
    """Fusionne les zones englobantes se chevauchant pour éviter les floutages redondants."""
    if not boxes:
        return []

    boxes = sorted(boxes, key=lambda b: b[2] * b[3], reverse=True)
    merged = []

    for box in boxes:
        x, y, w, h = box
        matched = False
        for i, mbox in enumerate(merged):
            mx, my, mw, mh = mbox
            # Intersection
            xi1 = max(x, mx)
            yi1 = max(y, my)
            xi2 = min(x + w, mx + mw)
            yi2 = min(y + h, my + mh)
            inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
            min_area = min(w * h, mw * mh)
            if min_area > 0 and (inter_area / float(min_area)) > overlap_threshold:
                # Fusion des deux boîtes
                nx = min(x, mx)
                ny = min(y, my)
                nw = max(x + w, mx + mw) - nx
                nh = max(y + h, my + mh) - ny
                merged[i] = (nx, ny, nw, nh)
                matched = True
                break
        if not matched:
            merged.append((x, y, w, h))

    return merged


def anonymize_image(image_file):
    """
    Anonymise une image envoyée par un citoyen :
    1. Détecte les visages (Haar Cascade frontalface).
    2. Détecte les plaques d'immatriculation (Haar Cascade + Contours rectangulaires).
    3. Applique un GaussianBlur puissant (noyau jusqu'à (51, 51)) sur chaque zone identifiée.
    4. Supprime toutes les métadonnées EXIF (conformité INPDP).
    5. Retourne un tuple : (processed_file, num_faces_plates_detected, success_boolean)

    :param image_file: Fichier image en RAM (UploadedFile, BytesIO, FieldFile, ou bytes)
    :return: (ContentFile, int, bool)
    """
    if not image_file:
        return image_file, 0, False

    try:
        # 1. Extraction des octets bruts de l'image
        if hasattr(image_file, 'read'):
            if hasattr(image_file, 'seek'):
                image_file.seek(0)
            file_bytes = image_file.read()
            if hasattr(image_file, 'seek'):
                image_file.seek(0)
        elif isinstance(image_file, (bytes, bytearray)):
            file_bytes = bytes(image_file)
        elif isinstance(image_file, str) and os.path.exists(image_file):
            with open(image_file, 'rb') as f:
                file_bytes = f.read()
        else:
            logger.error("Format de fichier non pris en charge pour l'anonymisation : %s", type(image_file))
            return image_file, 0, False

        if not file_bytes:
            return image_file, 0, False

        # Nom original du fichier
        original_name = getattr(image_file, 'name', 'photo.jpg')
        filename = os.path.basename(original_name) or 'photo.jpg'
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = '.jpg'
            filename += ext

        # 2. Chargement via Pillow pour normalisation et purge EXIF
        pil_img = Image.open(io.BytesIO(file_bytes))

        # Gestion de la transparence éventuelle
        if pil_img.mode in ('RGBA', 'LA') or (pil_img.mode == 'P' and 'transparency' in pil_img.info):
            if ext == '.png':
                pil_img = pil_img.convert('RGBA')
            else:
                bg = Image.new('RGB', pil_img.size, (255, 255, 255))
                alpha = pil_img.convert('RGBA').split()[3]
                bg.paste(pil_img, mask=alpha)
                pil_img = bg
        elif pil_img.mode != 'RGB':
            pil_img = pil_img.convert('RGB')

        img_np = np.array(pil_img)

        # Conversion en BGR pour OpenCV
        if pil_img.mode == 'RGBA':
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
        else:
            img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

        img_h, img_w = img_bgr.shape[:2]
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        detected_zones = []

        # 3. Détection des visages (Haar Cascade)
        face_cascade = _load_cascade(FACE_CASCADE_NAME)
        if face_cascade:
            faces = face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=5,
                minSize=(30, 30),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            for (x, y, w, h) in faces:
                detected_zones.append((int(x), int(y), int(w), int(h)))

        # 4. Détection des plaques d'immatriculation (Haar Cascade)
        plate_cascade = _load_cascade(PLATE_CASCADE_NAME)
        if plate_cascade:
            plates = plate_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(30, 15),
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            for (x, y, w, h) in plates:
                detected_zones.append((int(x), int(y), int(w), int(h)))

        # Détection complémentaire par contours rectangulaires
        contour_plates = _detect_plate_contours(gray, img_w, img_h)
        detected_zones.extend(contour_plates)

        # Fusion des boîtes superposées
        unique_zones = _merge_overlapping_boxes(detected_zones)

        # 5. Application du GaussianBlur puissant sur chaque zone
        for (x, y, w, h) in unique_zones:
            x = max(0, x)
            y = max(0, y)
            w = min(w, img_w - x)
            h = min(h, img_h - y)
            if w <= 4 or h <= 4:
                continue

            # Noyau impair, idéalement (51, 51) ou ajusté à la taille de la zone
            kx = min(51, w if w % 2 == 1 else w - 1)
            ky = min(51, h if h % 2 == 1 else h - 1)
            kx = max(3, kx)
            ky = max(3, ky)

            roi = img_bgr[y:y+h, x:x+w]
            blurred_roi = cv2.GaussianBlur(roi, (kx, ky), sigmaX=30, sigmaY=30)
            img_bgr[y:y+h, x:x+w] = blurred_roi

        # 6. Reconversion vers Pillow pour purge totale EXIF et encodage propre
        out_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
        clean_pil = Image.fromarray(out_rgb)

        output_io = io.BytesIO()
        if ext == '.png':
            clean_pil.save(output_io, format='PNG', optimize=True)
        else:
            clean_pil.save(output_io, format='JPEG', quality=90, optimize=True)
        output_io.seek(0)

        # Emballage en ContentFile Django
        processed_file = ContentFile(output_io.getvalue(), name=filename)
        return processed_file, len(unique_zones), True

    except Exception as exc:
        logger.exception("Échec du processus d'anonymisation d'image : %s", exc)
        return image_file, 0, False
