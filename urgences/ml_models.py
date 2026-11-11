import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

# Modèle singleton mis en cache pour performances optimales
_MODELE_CACHE = None

def entrainer_modele_risk_map():
    """
    Entraîne un modèle Random Forest pour évaluer le risque routier (score 0 à 100%)
    en combinant :
    - L'historique d'accidents (fréquence et gravité)
    - La géométrie des tronçons (complexité, échangeur, bretelle, carrefour)
    - Le trafic en direct (indice de congestion)
    - Les chantiers et la météo
    """
    global _MODELE_CACHE
    if _MODELE_CACHE is not None:
        return _MODELE_CACHE

    # Jeu de données d'apprentissage enrichi modélisant le comportement métropolitain de Tunis
    data = {
        'trafic_index': [1.1, 1.4, 2.0, 2.5, 3.2, 3.8, 4.2, 4.8, 1.8, 2.9, 3.5, 4.5, 1.2, 2.2, 3.9, 4.6, 2.7, 4.9],
        'complexite_geometrique': [0, 0, 1, 1, 2, 3, 3, 3, 1, 2, 2, 3, 0, 1, 2, 3, 2, 3], # 0: droit, 1: virage, 2: carrefour, 3: échangeur
        'historique_accidents': [0, 1, 1, 2, 4, 6, 7, 9, 2, 3, 5, 8, 0, 2, 6, 8, 3, 10],
        'presence_travaux': [0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1],
        'meteo_pluie': [0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1],
        # 0: Risque Faible (Vert), 1: Risque Modéré (Orange), 2: Risque Élevé (Rouge)
        'classe_risque': [0, 0, 0, 1, 1, 2, 2, 2, 0, 1, 1, 2, 0, 0, 2, 2, 1, 2]
    }

    df = pd.DataFrame(data)
    X = df[['trafic_index', 'complexite_geometrique', 'historique_accidents', 'presence_travaux', 'meteo_pluie']]
    y = df['classe_risque']

    modele = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=5)
    modele.fit(X, y)
    _MODELE_CACHE = modele
    return _MODELE_CACHE


def prediger_risque_zone(
    trafic_index: float,
    presence_travaux: int = 0,
    meteo_pluie: int = 0,
    incidents_recents: int = 1,
    complexite_geometrique: int = 1
):
    """
    Calcule le score de risque continu de 0 à 100% pour une zone ou un tronçon
    et extrait les facteurs explicatifs principaux.
    """
    modele = entrainer_modele_risk_map()

    features = pd.DataFrame(
        [[float(trafic_index), int(complexite_geometrique), int(incidents_recents), int(presence_travaux), int(meteo_pluie)]],
        columns=['trafic_index', 'complexite_geometrique', 'historique_accidents', 'presence_travaux', 'meteo_pluie']
    )

    # Probabilités pour chaque classe [P(Vert), P(Orange), P(Rouge)]
    probas = modele.predict_proba(features)[0]
    classes = list(modele.classes_)

    p_vert = probas[classes.index(0)] if 0 in classes else 0.0
    p_orange = probas[classes.index(1)] if 1 in classes else 0.0
    p_rouge = probas[classes.index(2)] if 2 in classes else 0.0

    # Score pondéré continu de 0 à 100%
    score_continu = (p_vert * 15.0) + (p_orange * 55.0) + (p_rouge * 92.0)
    score_pourcentage = round(float(np.clip(score_continu, 5.0, 98.0)), 1)

    # Détermination de la couleur Risk Map exigée : vert, orange, rouge
    if score_pourcentage >= 68.0:
        niveau = "ROUGE"
        label_niveau = "ÉLEVÉ / CRITIQUE (ROUGE)"
    elif score_pourcentage >= 38.0:
        niveau = "ORANGE"
        label_niveau = "MODÉRÉ / VIGILANCE (ORANGE)"
    else:
        niveau = "VERT"
        label_niveau = "FAIBLE (VERT)"

    # Extraction des facteurs explicatifs clés
    facteurs = []
    if trafic_index >= 3.5:
        facteurs.append(f"Trafic très dense en direct (Indice {round(trafic_index, 1)}/5)")
    elif trafic_index >= 2.5:
        facteurs.append(f"Flux de circulation soutenu (Indice {round(trafic_index, 1)}/5)")

    if complexite_geometrique >= 3:
        facteurs.append("Géométrie critique du tronçon : Échangeur autoroutier à flux croisés multiples")
    elif complexite_geometrique == 2:
        facteurs.append("Géométrie sensible : Carrefour dense à fort taux d'insertions latérales")
    elif complexite_geometrique == 1:
        facteurs.append("Géométrie de voirie : Courbure prononcée et visibilité réduite")

    if incidents_recents >= 4:
        facteurs.append(f"Historique lourd : {incidents_recents} accidents recensés ces 30 derniers jours")
    elif incidents_recents >= 2:
        facteurs.append(f"Historique modéré : {incidents_recents} incidents récents sur ce secteur")

    if presence_travaux == 1:
        facteurs.append("Chantier actif : Réduction de voies et présence d'obstacles de voirie")

    if meteo_pluie == 1:
        facteurs.append("Conditions météo défavorables : Chaussée mouillée, distance de freinage allongée")

    if not facteurs:
        facteurs.append("Conditions de circulation fluides et chaussée dégagée")

    return {
        "score_risque_pourcentage": score_pourcentage,
        "niveau_risk_map": niveau,
        "label_niveau": label_niveau,
        "facteurs_explicatifs": facteurs,
        "details_probabilites": {
            "faible_vert": round(float(p_vert) * 100, 1),
            "modere_orange": round(float(p_orange) * 100, 1),
            "eleve_rouge": round(float(p_rouge) * 100, 1),
        }
    }


# Secteurs sensibles métropolitains du Grand Tunis préconfigurés
SECTEURS_GRAND_TUNIS = [
    {
        "id": "sec-bab-alioua",
        "nom": "Échangeur Bab Alioua (Sortie Sud)",
        "arrondissement": "Sidi El Béchir / Entrée Sud Tunis",
        "latitude": 36.7865,
        "longitude": 10.1832,
        "rayon_metres": 550,
        "complexite_geometrique": 3,
        "trafic_index": 4.6,
        "presence_travaux": 1,
        "meteo_pluie": 0,
        "incidents_recents": 8,
        "points_polygone": [
            [36.7890, 10.1810],
            [36.7892, 10.1860],
            [36.7845, 10.1870],
            [36.7840, 10.1815]
        ]
    },
    {
        "id": "sec-route-x-bardo",
        "nom": "Route X — Rond-Point du Bardo",
        "arrondissement": "Le Bardo / Axe Rapide Ouest",
        "latitude": 36.8115,
        "longitude": 10.1384,
        "rayon_metres": 500,
        "complexite_geometrique": 2,
        "trafic_index": 3.7,
        "presence_travaux": 1,
        "meteo_pluie": 0,
        "incidents_recents": 5,
        "points_polygone": [
            [36.8140, 10.1350],
            [36.8145, 10.1415],
            [36.8088, 10.1420],
            [36.8085, 10.1360]
        ]
    },
    {
        "id": "sec-gp8-ariana",
        "nom": "Route de Bizerte (GP8) — Ariana Ouest",
        "arrondissement": "Ariana Ville / Échangeur GP8",
        "latitude": 36.8600,
        "longitude": 10.1650,
        "rayon_metres": 600,
        "complexite_geometrique": 3,
        "trafic_index": 4.4,
        "presence_travaux": 1,
        "meteo_pluie": 1,
        "incidents_recents": 7,
        "points_polygone": [
            [36.8635, 10.1610],
            [36.8640, 10.1690],
            [36.8560, 10.1695],
            [36.8555, 10.1620]
        ]
    },
    {
        "id": "sec-rn9-ain-zaghouan",
        "nom": "Route de La Marsa (RN9) — Ain Zaghouan",
        "arrondissement": "La Marsa / Banlieue Nord",
        "latitude": 36.8524,
        "longitude": 10.2785,
        "rayon_metres": 500,
        "complexite_geometrique": 2,
        "trafic_index": 3.4,
        "presence_travaux": 0,
        "meteo_pluie": 0,
        "incidents_recents": 3,
        "points_polygone": [
            [36.8550, 10.2740],
            [36.8560, 10.2830],
            [36.8495, 10.2825],
            [36.8490, 10.2745]
        ]
    },
    {
        "id": "sec-bab-saadoun",
        "nom": "Place Bab Saadoun & Sortie Médina",
        "arrondissement": "Bab Souika / El Omrane",
        "latitude": 36.8095,
        "longitude": 10.1582,
        "rayon_metres": 450,
        "complexite_geometrique": 2,
        "trafic_index": 3.2,
        "presence_travaux": 0,
        "meteo_pluie": 0,
        "incidents_recents": 3,
        "points_polygone": [
            [36.8120, 10.1550],
            [36.8125, 10.1615],
            [36.8068, 10.1610],
            [36.8065, 10.1555]
        ]
    },
    {
        "id": "sec-bourguiba-centre",
        "nom": "Avenue Habib Bourguiba (Tunis Centre)",
        "arrondissement": "Bab Bhar / Tunis Centre",
        "latitude": 36.8002,
        "longitude": 10.1865,
        "rayon_metres": 400,
        "complexite_geometrique": 1,
        "trafic_index": 2.2,
        "presence_travaux": 0,
        "meteo_pluie": 0,
        "incidents_recents": 1,
        "points_polygone": [
            [36.8020, 10.1820],
            [36.8025, 10.1910],
            [36.7980, 10.1905],
            [36.7975, 10.1825]
        ]
    },
    {
        "id": "sec-mohamed-v",
        "nom": "Avenue Mohamed V (Cité de la Culture)",
        "arrondissement": "Bab Bhar / Lafayette",
        "latitude": 36.8142,
        "longitude": 10.1824,
        "rayon_metres": 400,
        "complexite_geometrique": 1,
        "trafic_index": 2.6,
        "presence_travaux": 0,
        "meteo_pluie": 0,
        "incidents_recents": 2,
        "points_polygone": [
            [36.8170, 10.1795],
            [36.8175, 10.1855],
            [36.8110, 10.1850],
            [36.8105, 10.1790]
        ]
    },
    {
        "id": "sec-lac-1",
        "nom": "Berges du Lac 1 — Rue du Lac Windermere",
        "arrondissement": "Les Berges du Lac / Tunis",
        "latitude": 36.8340,
        "longitude": 10.2330,
        "rayon_metres": 450,
        "complexite_geometrique": 0,
        "trafic_index": 1.9,
        "presence_travaux": 0,
        "meteo_pluie": 0,
        "incidents_recents": 1,
        "points_polygone": [
            [36.8365, 10.2290],
            [36.8370, 10.2370],
            [36.8310, 10.2365],
            [36.8305, 10.2295]
        ]
    },
    {
        "id": "sec-goulette-port",
        "nom": "Port de La Goulette & Avenue Franklin Roosevelt",
        "arrondissement": "La Goulette / Banlieue Nord",
        "latitude": 36.8182,
        "longitude": 10.3045,
        "rayon_metres": 450,
        "complexite_geometrique": 1,
        "trafic_index": 2.1,
        "presence_travaux": 0,
        "meteo_pluie": 0,
        "incidents_recents": 1,
        "points_polygone": [
            [36.8210, 10.3000],
            [36.8215, 10.3090],
            [36.8150, 10.3085],
            [36.8145, 10.3005]
        ]
    },
    {
        "id": "sec-z4-aeroport",
        "nom": "Voie Rapide Z4 — Échangeur Aéroport Carthage",
        "arrondissement": "Carthage / El Khadra",
        "latitude": 36.8450,
        "longitude": 10.2150,
        "rayon_metres": 550,
        "complexite_geometrique": 3,
        "trafic_index": 4.5,
        "presence_travaux": 1,
        "meteo_pluie": 0,
        "incidents_recents": 6,
        "points_polygone": [
            [36.8485, 10.2100],
            [36.8490, 10.2200],
            [36.8415, 10.2195],
            [36.8410, 10.2105]
        ]
    }
]


def obtenir_tous_secteurs_evalues():
    """
    Retourne l'ensemble des secteurs métropolitains du Grand Tunis
    avec calcul dynamique du score de risque Random Forest et facteurs explicatifs.
    """
    secteurs_evalues = []
    for s in SECTEURS_GRAND_TUNIS:
        evaluation = prediger_risque_zone(
            trafic_index=s["trafic_index"],
            presence_travaux=s["presence_travaux"],
            meteo_pluie=s["meteo_pluie"],
            incidents_recents=s["incidents_recents"],
            complexite_geometrique=s["complexite_geometrique"]
        )
        secteurs_evalues.append({
            **s,
            **evaluation
        })
    return secteurs_evalues
