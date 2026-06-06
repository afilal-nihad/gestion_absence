# Gestion des Absences – Centre de Formation

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18-339933.svg?logo=node.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED.svg?logo=docker)

## 📖 Présentation du projet

Cette application web "Full-Stack" est conçue pour gérer de manière centralisée les présences, absences et retards des stagiaires au sein d'un centre de formation. Elle permet un suivi rigoureux, automatisé et offre un espace dédié pour l'administration, les formateurs et les stagiaires.

### ✨ Fonctionnalités principales
*   **Authentification sécurisée** (JWT, bcrypt).
*   **Contrôle d'accès basé sur les rôles (RBAC)** (Admin, Formateur, Stagiaire).
*   **Validation des comptes** (statut `PENDING`) par l'administration.
*   **Interface moderne et dynamique** avec mode clair/sombre et internationalisation (FR/EN/ES).
*   **Gestion des justificatifs d'absence** (téléchargement de fichiers PDF uniquement).
*   **Tableau de bord statistique** exportable.

---

## 🏗️ Architecture et Technologies

Le projet est divisé en deux parties distinctes orchestrées via **Docker Compose** :

*   **Frontend :** React + Vite (React Router, Recharts, i18n, Context API).
*   **Backend :** Node.js avec Express (API REST, JWT, MySQL).
*   **Base de données :** MySQL 8.0.
*   **Reverse Proxy :** Nginx (pour router les requêtes frontend et backend de manière unifiée).

---

## 👥 Rôles & Permissions

L'application distingue trois rôles principaux avec des droits spécifiques :

### 🛡️ Administrateur
*   **Droits :** Contrôle total. Gestion des utilisateurs, groupes, validation des inscriptions et des justificatifs d'absence, vue globale des statistiques.
*   **Restrictions :** Aucune.

### 👨‍🏫 Formateur
*   **Droits :** Consultation de ses groupes assignés. Un formateur peut être assigné à de multiples groupes. Enregistrement des présences/absences/retards pour ses sessions. Accès aux statistiques de ses groupes.
*   **Restrictions :** Ne peut voir que les groupes auxquels il est assigné. Ne peut pas créer/modifier/supprimer des utilisateurs ou valider les justificatifs d'absence.

### 🎓 Stagiaire
*   **Droits :** Consultation de son historique de présences. Soumission de justificatifs (au format PDF exclusif) en cas d'absence.
*   **Restrictions :** Accès limité à ses propres données.

---

## 🚀 Installation & Lancement via Docker (Recommandé)

Le projet est entièrement "Dockerisé" pour une installation en une seule commande.

### Prérequis
*   [Docker](https://docs.docker.com/get-docker/) et [Docker Compose](https://docs.docker.com/compose/install/) installés.
*   Ports `80`, `4000` et `3306` libres sur votre machine.

### Étapes
1. Clonez le dépôt :
   ```bash
   git clone <URL_DU_DEPOT>
   cd prj-gst-absc
   ```

2. Lancez l'application avec Docker Compose :
   ```bash
   docker-compose up -d --build
   ```

3. L'application est maintenant accessible !
   *   **Application Web (Nginx) :** `http://localhost`
   *   **API Backend (Nginx proxy) :** `http://localhost/api`
   *   **Base de données MySQL :** `localhost:3306`

*La base de données est automatiquement initialisée via le fichier `database.sql`.*

---

## 💻 Installation & Lancement Manuel (Développement)

Si vous souhaitez modifier le code et exécuter le projet sans Docker :

### 1. Base de données
*   Démarrez MySQL et importez le schéma : `mysql -u root -p < database.sql`

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env # Configurez vos identifiants MySQL dans le .env
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🔑 Comptes de test

Un compte administrateur est créé par défaut lors de l'initialisation de la base de données :

| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Administrateur** | `admin@example.com` | `Admin123!` |

*Pour tester les rôles **Formateur** ou **Stagiaire**, veuillez créer un nouveau compte via la page d'inscription de l'application, puis valider et assigner le rôle correspondant depuis le panneau Administrateur.*

---

## 📈 Processus Métier (Business Logic)

1. **Création de compte :** Le statut initial est en attente (`PENDING`).
2. **Validation obligatoire :** L'Admin doit valider le compte manuellement. S'il s'agit d'un stagiaire, l'Admin doit obligatoirement lui assigner un groupe.
3. **Assignation Formateur :** L'Admin peut assigner un ou plusieurs formateurs à chaque groupe (relation multi-groupes).
4. **Appel :** Le Formateur sélectionne l'un de ses groupes assignés et enregistre les présences de la journée.
5. **Justificatif :** En cas d'absence, le stagiaire soumet un certificat PDF. L'Admin l'examine et approuve (justifiée) ou rejette (injustifiée).
