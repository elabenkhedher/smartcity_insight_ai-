import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

def entrainer_modele_risk_map():
    """
    Entraîne un modèle Random Forest pour prédire le niveau de risque routier (0 à 100%)
    en fonction du trafic, de la météo, des travaux et des incidents récents.
    """
    # 1. Jeu de données simulé (en attendant 4 à 8 semaines de données réelles)
    data = {
        'trafic_index': [1.2, 2.5, 3.8, 1.1, 4.2, 2.0, 3.5, 1.0, 4.5, 2.8],
        'presence_travaux': [0, 1, 1, 0, 1, 0, 1, 0, 1, 1],
        'meteo_pluie': [0, 0, 1, 0, 1, 1, 0, 0, 1, 0],
        'incidents_recents': [1, 3, 5, 0, 6, 2, 4, 0, 7, 3],
        'risque_eleve': [0, 1, 1, 0, 1, 0, 1, 0, 1, 1] # 1 = Risque élevé (Rouge), 0 = Faible/Moyen
    }
    
    df = pd.DataFrame(data)
    
    X = df[['trafic_index', 'presence_travaux', 'meteo_pluie', 'incidents_recents']]
    y = df['risque_eleve']
    
    # 2. Séparation apprentissage / test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 3. Entraînement du modèle Random Forest
    modele = RandomForestClassifier(n_estimators=50, random_state=42)
    modele.fit(X_train, y_train)
    
    return modele

def prediger_risque_zone(trafic, travaux, pluie, incidents_recents):
    """
    Calcule le score de risque (0 à 100%) pour une zone donnée et extrait les facteurs clés.
    """
    modele = entrainer_modele_risk_map()
    
    # Données de la zone à analyser avec les noms de colonnes attendus par le modèle
    features = pd.DataFrame(
        [[trafic, travaux, pluie, incidents_recents]],
        columns=['trafic_index', 'presence_travaux', 'meteo_pluie', 'incidents_recents']
    )
    
    # Probabilité de risque élevé (classe 1)
    probabilite = modele.predict_proba(features)[0][1]
    score_pourcentage = round(probabilite * 100, 2)
    
    # Détermination du niveau de couleur (Risk Map)
    if score_pourcentage >= 70:
        niveau = "ELEVE (ROUGE)" 
    elif score_pourcentage >= 40:
        niveau = "MOYEN (ORANGE)" 
    else:
        niveau = "FAIBLE (VERT)" 
        
    # Extraction des facteurs explicatifs principaux
    facteurs = []
    if trafic > 3.0: facteurs.append("Trafic très dense") 
    if travaux == 1: facteurs.append("Présence de chantiers actifs") 
    if pluie == 1: facteurs.append("Conditions météorologiques défavorables (Pluie)") 
    if incidents_recents > 3: facteurs.append("Forte concentration d'incidents récents") 
    
    if not facteurs:
        facteurs.append("Conditions normales de circulation") 

    return {
        "score_risque_pourcentage": score_pourcentage,
        "niveau_risk_map": niveau,
        "facteurs_explicatifs": facteurs
    }
