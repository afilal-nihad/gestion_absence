# Gestion des Absences – Centre de Formation

## 1️⃣ Présentation du projet
**Objectif :**
Cette application web a pour but de gérer de manière centralisée les présences, absences et retards des stagiaires au sein d'un centre de formation. Elle permet un suivi rigoureux et automatisé.

**Contexte d’utilisation :**
Application à usage interne destinée à l'administration, aux formateurs, et aux stagiaires du centre de formation.

**Technologies utilisées :**
*   **Frontend :** React (React Router, hooks, Recharts pour les statistiques) - Interface moderne et responsive.
*   **Backend :** Node.js avec Express (API REST, JWT, bcrypt).
*   **Base de données :** MySQL.

---

## 2️⃣ Rôles & Permissions

L'application distingue trois rôles principaux avec des droits spécifiques :

### 🛡️ Admin (Administrateur)
*   **Droits :** Contrôle total sur l'application. Gestion des utilisateurs (création, modification, suppression), gestion des groupes, validation/rejet des inscriptions des nouveaux stagiaires, validation/rejet des justificatifs d'absence.
*   **Restrictions :** Aucune.

### 👨‍🏫 Formateur
*   **Droits :** Consultation de la liste des stagiaires et des groupes. Sélection de son groupe, appel et enregistrement des présences/absences/retards pour ses sessions. Accès aux statistiques de présence de ses groupes.
*   **Restrictions :** Ne peut pas créer, modifier ou supprimer des utilisateurs ou des groupes (lecture seule sur les écrans CRUD). Ne valide pas les justificatifs d'absence.

### 🎓 Stagiaire
*   **Droits :** Inscription sur la plateforme, consultation de son profil personnel, accès à son historique de présences/absences/retards, soumission de justificatifs (certificats) en cas d'absence.
*   **Restrictions :** Accès limité à ses propres données uniquement.

---

## 3️⃣ Workflow de validation des comptes

Pour des raisons de sécurité, l'accès à la plateforme est contrôlé :
1.  **Création de compte :** Le stagiaire (ou utilisateur) s'inscrit via la page d'inscription.
2.  **Statut initial :** Après inscription, le compte est en attente de validation (`PENDING` ou `SUSPENDED`).
3.  **Validation obligatoire :** Un **Administrateur** doit examiner et valider (approuver) le compte.
4.  **Attribution du rôle :** L'administrateur peut assigner le rôle adéquat (`TRAINEE` par défaut, modifiable en `TRAINER` ou `ADMIN`) et l'affecter à un groupe.

---

## 4️⃣ Logique de gestion des présences

Le processus d'appel et de suivi des présences est structuré ainsi :
1.  **Sélection du groupe :** Le formateur sélectionne le groupe de stagiaires dont il a la charge pour la session.
2.  **Enregistrement des présences :** **Uniquement le formateur** a le droit d'enregistrer les statuts (Présent, Absent, En retard) pour la date et le groupe donnés.
3.  **Gestion des absences justifiées :** Si un stagiaire est marqué absent, il peut soumettre un justificatif (certificat médical, etc.) via son espace.
4.  **Validation des certificats :** Les justificatifs soumis sont examinés par l'**Administrateur**, qui peut les valider (absence justifiée) ou les refuser.

---

## 5️⃣ Prérequis pour exécuter le projet

Avant de commencer, assurez-vous de disposer des éléments suivants :

*   **Node.js :** Version 18 ou supérieure recommandée.
*   **Gestionnaire de paquets :** `npm` (inclus avec Node.js) ou `yarn`.
*   **Base de données :** MySQL version 8 ou supérieure.
*   **Outils recommandés :** Git pour le clonage, VS Code (ou tout autre éditeur de code moderne).

---

## 6️⃣ Installation & Lancement du projet

Suivez ces étapes pour installer et lancer l'application en local.

### Étape 1 : Clonage du projet
```bash
git clone <URL_DU_DEPOT>
cd prj-gst-absc
```

### Étape 2 : Configuration de la base de données
1. Démarrez votre serveur MySQL.
2. Importez le fichier SQL pour créer la base et les tables :
```bash
mysql -u root -p < database.sql
```

### Étape 3 : Installation et configuration du Backend
1. Accédez au dossier backend :
```bash
cd backend
npm install
```
2. Configurez les variables d'environnement. Copiez le fichier `.env.example` et nommez-le `.env` :
```bash
cp .env.example .env
```
*(Sous Windows PowerShell, utilisez `Copy-Item .env.example .env` ou renommez-le manuellement).*

3. Modifiez le fichier `.env` avec vos identifiants de base de données (`DB_USER`, `DB_PASSWORD`, etc.).

4. Lancez le serveur backend :
```bash
npm run dev
```
Le backend sera accessible sur `http://localhost:4000`.

### Étape 4 : Installation et lancement du Frontend
Ouvrez un nouveau terminal et exécutez les commandes suivantes :
```bash
cd frontend
npm install
npm run dev
```
Le frontend sera accessible sur l'URL fournie par Vite (généralement `http://localhost:5173`).

---

## 7️⃣ Comptes de test

Un compte administrateur est créé par défaut lors de l'importation de la base de données (`database.sql`). Vous pouvez l'utiliser pour configurer d'autres comptes.

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@example.com` | `Admin123!` |

*Pour tester les autres rôles (Formateur, Stagiaire), vous pouvez créer de nouveaux comptes via la page d'inscription, puis les valider et leur attribuer les bons rôles depuis l'interface Administrateur.*
