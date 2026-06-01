# Gestion des absences – Application complète

Application web de gestion des présences / absences / retards des stagiaires, avec un **backend Node.js + Express + MySQL** et un **frontend React moderne et responsive**.

## 1. Structure du projet

- `backend/` : API REST Node.js + Express (JWT, bcrypt, MySQL)
- `frontend/` : SPA React (React Router, hooks, graphiques Recharts)
- `database.sql` : script SQL de création de la base et des tables

## 2. Prérequis

- Node.js 18+
- MySQL 8+

## 3. Installation

### 3.1. Base de données

1. Démarrez MySQL.
2. Importez le fichier SQL :

```bash
mysql -u root -p < database.sql
```

3. Dans `database.sql`, une ligne crée un utilisateur admin avec un hash de mot de passe :

```sql
INSERT INTO users (..., password_hash, role) VALUES (..., '$2b$10$REPLACE_ME_WITH_REAL_HASH', 'ADMIN');
```

Remplacez `REPLACE_ME_WITH_REAL_HASH` par un hash bcrypt réel (par exemple généré avec un petit script Node) ou créez l’admin via l’API.

### 3.2. Backend

```bash
cd backend
npm install
```

1. Copiez le fichier `.env.example` en `.env` :

```bash
cp .env.example .env   # sous Windows PowerShell, utilisez Copy-Item
```

2. Adaptez les variables (`DB_USER`, `DB_PASSWORD`, etc.).

3. Lancez le serveur :

```bash
npm run dev
```

Le backend est disponible sur `http://localhost:4000`.

### 3.3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Le frontend est disponible sur l’URL indiquée par Vite (par défaut `http://localhost:5173`).

## 4. Fonctionnalités principales

### 4.1. Stagiaire

- Connexion par email/mot de passe.
- Consultation du profil.
- Consultation de son historique de présences/absences/retards.
- Statistiques personnelles : nombre de présences, absences, retards, taux de présence.

### 4.2. Formateur / Admin

- Authentification sécurisée via JWT.
- Gestion des stagiaires (CRUD).
- Gestion des groupes (CRUD).
- Association des stagiaires à un groupe.
- Enregistrement des présences par date et par groupe (statuts : Présent, Absent, Retard).
- Consultation des présences.
- Statistiques globales par stagiaire, par groupe et par date (avec graphiques).

## 5. Endpoints principaux (backend)

- `POST /api/auth/register` : inscription stagiaire, retourne `{ token, user, stats }`.
- `POST /api/auth/login` : connexion, retourne `{ token, user, stats }`.
- `GET /api/auth/me` : infos du profil connecté + stats.
- `GET /api/users/me/attendance` : présences de l'utilisateur connecté.
- `GET /api/users/trainees` : liste des stagiaires (ADMIN / TRAINER).
- `POST /api/users/trainees` : créer un stagiaire (ADMIN).
- `PUT /api/users/trainees/:id` : modifier un stagiaire (ADMIN).
- `DELETE /api/users/trainees/:id` : supprimer un stagiaire (ADMIN).
- `GET /api/users/trainees/:id/attendance` : présences d’un stagiaire.
- `GET /api/groups` (ADMIN / TRAINER) ; `POST/PUT/DELETE /api/groups` (ADMIN)
- `POST /api/attendance/bulk` : enregistrement des présences pour une date et un groupe.
- `GET /api/attendance` : liste filtrable des présences (`user_id`, `group_id`, `date`, `from`, `to`).
- `GET /api/attendance/export` : export CSV des présences selon filtres.
- `GET /api/stats/global` : statistiques globales (stagiaire, groupe, date) avec filtres (`group_id`, `from`, `to`).
- `GET /api/stats/global/export` : export CSV des statistiques globales.
- `GET /api/stats/global/export-pdf` : export PDF des statistiques globales.

Toutes les routes (sauf `/api/auth/login` et `/api/auth/register`) sont protégées par JWT.

## 6. UI & navigation (frontend)

- **Login** : page d’authentification.
- **Register** : page d’inscription stagiaire.
- **Tableau de bord** :
  - Stagiaire : stats personnelles.
  - Admin/Formateur : stats globales rapides.
- **Stagiaire** :
  - `/stagiaire/profil` : informations personnelles.
  - `/stagiaire/presences` : historique des présences.
- **Admin / Formateur** :
  - `Admin` : `/admin/stagiaires`, `/admin/groupes`, `/admin/presences`, `/admin/statistiques`.
  - `Formateur` : `/formateur/stagiaires`, `/formateur/groupes`, `/formateur/presences`, `/formateur/statistiques`.
  - Le formateur est en lecture seule sur les écrans CRUD (modification réservée à l'admin).

## 7. Sécurité

- Hash de mot de passe via **bcrypt**.
- Authentification via **JWT**, middleware de protection des routes.
- Filtrage des actions selon le rôle (`ADMIN`, `TRAINER`, `TRAINEE`).

## 8. Personnalisation

- Vous pouvez adapter les rôles, le design (fichier `frontend/src/styles/global.css`) et ajouter d’autres champs (par ex. numéro de téléphone, type de session, etc.).

