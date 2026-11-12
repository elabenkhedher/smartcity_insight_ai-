import React, { useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Loader2,
  MapPin,
  Send,
  Shield,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { createSignalement } from '../services/api';
import {
  CategorieSignalement,
  GraviteSignalement,
  Signalement,
} from '../types';

const CATEGORIES: {
  value: CategorieSignalement;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    value: 'NID_DE_POULE',
    label: 'Nid-de-poule',
    icon: '🕳️',
    desc: 'Chaussée dégradée, trou sur la route',
  },
  {
    value: 'DECHETS',
    label: 'Déchets / Voirie',
    icon: '🗑️',
    desc: 'Dépôt sauvage, poubelle débordante',
  },
  {
    value: 'ACCIDENT',
    label: 'Accident',
    icon: '💥',
    desc: 'Collision, obstacle routier urgent',
  },
  {
    value: 'ECLAIRAGE',
    label: 'Éclairage public',
    icon: '💡',
    desc: 'Lampadaire éteint ou clignotant',
  },
  {
    value: 'SIGNALISATION',
    label: 'Signalisation',
    icon: '🛑',
    desc: 'Panneau abîmé, feu tricolore en panne',
  },
  {
    value: 'AUTRE',
    label: 'Autre incident',
    icon: '⚠️',
    desc: 'Tout autre problème sur la voie publique',
  },
];

const GRAVITES: {
  value: GraviteSignalement;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: 'FAIBLE',
    label: 'Faible',
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  {
    value: 'MOYENNE',
    label: 'Moyenne',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  {
    value: 'ELEVEE',
    label: 'Élevée',
    color: '#f97316',
    bg: 'rgba(249, 115, 22, 0.15)',
  },
  {
    value: 'CRITIQUE',
    label: 'Critique',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
  },
];

const QUARTIERS_TUNIS = [
  'Centre-Ville Tunis',
  'Bab El Khadra',
  'Bab Saadoun',
  'Montplaisir',
  'La Goulette',
  'Lafayette',
  'Ariana Centre',
  'Le Bardo',
  'El Menzah',
  'El Manar',
];

export const CitizenReportForm: React.FC = () => {
  const [categorie, setCategorie] = useState<CategorieSignalement>('NID_DE_POULE');
  const [gravite, setGravite] = useState<GraviteSignalement>('MOYENNE');
  const [description, setDescription] = useState('');
  const [adresseTexte, setAdresseTexte] = useState('');
  const [quartier, setQuartier] = useState('Centre-Ville Tunis');
  const [latitude, setLatitude] = useState<number>(36.8005);
  const [longitude, setLongitude] = useState<number>(10.18);
  const [isGeolocating, setIsGeolocating] = useState(false);

  // Gestion de la photo
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // États du formulaire
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<Signalement | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Géolocalisation via l'API navigateur
  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        setIsGeolocating(false);
      },
      (err) => {
        console.warn('Erreur géolocalisation:', err);
        // Fallback Centre-ville Tunis
        setLatitude(36.8005);
        setLongitude(10.18);
        setIsGeolocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Sélection et preview de la photo
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoPreview(null);
  };

  // Soumission du signalement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setIsRateLimited(false);

    try {
      const formData = new FormData();
      formData.append('categorie', categorie);
      formData.append('gravite', gravite);
      formData.append('description', description);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('adresse_texte', adresseTexte || quartier);
      formData.append('quartier', quartier);

      if (photoFile) {
        formData.append('photo_floutee', photoFile);
      }

      const result = await createSignalement(formData);
      setSuccessResult(result);
      // Réinitialisation du formulaire
      setDescription('');
      setAdresseTexte('');
      handleRemovePhoto();
    } catch (err: any) {
      console.error('Erreur soumission signalement:', err);
      if (err.response?.status === 429) {
        setIsRateLimited(true);
        setErrorMessage(
          '⚠️ Limite anti-spam atteinte : vous ne pouvez soumettre que 5 signalements par heure depuis votre adresse IP pour protéger la plateforme contre les faux signalements.'
        );
      } else {
        const detail =
          err.response?.data?.detail ||
          err.response?.data?.error ||
          err.message ||
          'Une erreur est survenue lors de la transmission du signalement.';
        setErrorMessage(`❌ Échec de la transmission : ${detail}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '24px 16px' }}>
      {/* En-tête */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 20,
            background: 'rgba(59, 130, 246, 0.12)',
            color: '#60a5fa',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 12,
          }}
        >
          <Zap size={15} /> Portail Citoyen SmartCity Tunis
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
          Signaler une anomalie urbaine
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 600, margin: '0 auto' }}>
          Contribuez à l'amélioration de votre ville. Vos signalements sont transmis en direct aux
          services municipaux avec garantie de confidentialité.
        </p>
      </div>

      {/* Message de confirmation de succès */}
      {successResult && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <CheckCircle2 size={24} color="#10b981" />
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                Signalement enregistré avec succès !
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Identifiant : <code style={{ color: '#38bdf8' }}>{successResult.id}</code>
              </p>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              background: 'rgba(0, 0, 0, 0.25)',
              padding: 12,
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Catégorie : </span>
              <strong>{successResult.categorie}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Quartier : </span>
              <strong>{successResult.quartier}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Statut : </span>
              <span
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontSize: 12,
                }}
              >
                {successResult.statut}
              </span>
            </div>
            {successResult.visages_plaques_floutes && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981' }}>
                <Shield size={14} />
                <span>
                  Floutage IA INPDP appliqué ({successResult.nb_zones_floutees} zone(s) anonymisée(s))
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setSuccessResult(null)}
            style={{
              marginTop: 14,
              background: 'transparent',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              padding: '6px 14px',
              borderRadius: 6,
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Nouveau signalement
          </button>
        </div>
      )}

      {/* Message d'erreur / Rate Limiting */}
      {errorMessage && (
        <div
          style={{
            background: isRateLimited ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${isRateLimited ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          {isRateLimited ? (
            <Clock size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
          ) : (
            <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          )}
          <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5, color: 'var(--text-main)' }}>
            {errorMessage}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Formulaire principal */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* 1. Sélection de la catégorie */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-main)' }}>
            1. Type d'anomalie <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 10,
            }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = categorie === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategorie(cat.value)}
                  style={{
                    background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-dark)',
                    border: `2px solid ${isSelected ? '#3b82f6' : 'var(--border-color)'}`,
                    borderRadius: 10,
                    padding: '12px 8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 24 }}>{cat.icon}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isSelected ? '#60a5fa' : 'var(--text-main)',
                    }}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Sélection de la gravité */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-main)' }}>
            2. Niveau de gravité estimé
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {GRAVITES.map((g) => {
              const isSelected = gravite === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGravite(g.value)}
                  style={{
                    background: isSelected ? g.bg : 'var(--bg-dark)',
                    border: `1.5px solid ${isSelected ? g.color : 'var(--border-color)'}`,
                    color: isSelected ? g.color : 'var(--text-muted)',
                    borderRadius: 8,
                    padding: '10px 4px',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Description textuelle */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
              3. Description des faits <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              {description.length} / 1000
            </span>
          </div>
          <textarea
            required
            maxLength={1000}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez précisément l'anomalie constatée (ex: gros trou sur la voie droite, déchets encombrants le trottoir...)"
            style={{
              width: '100%',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: 12,
              color: 'var(--text-main)',
              fontSize: 14,
              resize: 'vertical',
              outline: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 4. Localisation & Quartier */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 10, color: 'var(--text-main)' }}>
            4. Localisation
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Quartier
              </span>
              <select
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: 'var(--text-main)',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {QUARTIERS_TUNIS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                Adresse approximative
              </span>
              <input
                type="text"
                value={adresseTexte}
                onChange={(e) => setAdresseTexte(e.target.value)}
                placeholder="Ex: Avenue Habib Bourguiba"
                style={{
                  width: '100%',
                  background: 'var(--bg-dark)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: 'var(--text-main)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' }}>
              <MapPin size={16} color="#38bdf8" />
              <span>
                Coordonnées GPS :{' '}
                <strong style={{ color: 'var(--text-main)' }}>
                  {latitude}, {longitude}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleGeolocate}
              disabled={isGeolocating}
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {isGeolocating ? <Loader2 size={13} className="animate-spin" /> : <MapPin size={13} />}
              {isGeolocating ? 'Recherche...' : 'Me géolocaliser'}
            </button>
          </div>
        </div>

        {/* 5. Téléversement de photo & Information INPDP */}
        <div style={{ marginBottom: 28 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-main)' }}>
            5. Photographie du problème (optionnel)
          </label>

          {/* Bandeau d'information Confidentialité INPDP */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              fontSize: 12.5,
              color: '#34d399',
              marginBottom: 12,
            }}
          >
            <Shield size={18} style={{ flexShrink: 0 }} />
            <span>
              <strong>Garantie INPDP :</strong> Les visages et plaques d'immatriculation seront
              automatiquement floutés par IA, et les données personnelles EXIF/GPS de votre appareil
              seront purgées avant enregistrement.
            </span>
          </div>

          {!photoPreview ? (
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'var(--bg-dark)',
                border: '2px dashed var(--border-color)',
                borderRadius: 12,
                padding: '24px 16px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                transition: 'border-color 0.2s',
              }}
            >
              <Camera size={28} color="#60a5fa" />
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>
                Cliquez pour ajouter une photo ou glissez-déposez ici
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                Formats acceptés : JPG, JPEG, PNG (max 10 Mo)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </label>
          ) : (
            <div
              style={{
                position: 'relative',
                background: 'var(--bg-dark)',
                border: '1px solid var(--border-color)',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <img
                src={photoPreview}
                alt="Aperçu avant floutage"
                style={{
                  width: 90,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                }}
              />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', marginBottom: 4 }}>
                  {photoFile?.name}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {photoFile ? (photoFile.size / 1024 / 1024).toFixed(2) : 0} Mo • Prêt pour floutage IA
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  borderRadius: 6,
                  padding: 8,
                  cursor: 'pointer',
                }}
                title="Supprimer la photo"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Bouton de soumission */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            background: isSubmitting ? 'var(--border-color)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            border: 'none',
            borderRadius: 10,
            padding: '14px 20px',
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: '0 4px 15px rgba(37, 99, 235, 0.35)',
            transition: 'opacity 0.2s',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Anonymisation IA & Transmission...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Envoyer le signalement</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
