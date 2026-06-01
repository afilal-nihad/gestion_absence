/**
 * Crée ou met à jour les comptes démo : Admin, Formateur, Stagiaire.
 * Mot de passe commun : Admin123!
 * À lancer depuis le dossier backend : node scripts/seed-admin-password.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { initDb } = require('../src/config/db');

const DEMO_PASSWORD = 'Admin123!';

const DEMO_ACCOUNTS = [
  { first_name: 'Admin', last_name: 'Principal', email: 'admin@example.com', role: 'ADMIN' },
  { first_name: 'Formateur', last_name: 'Démo', email: 'formateur@example.com', role: 'TRAINER' },
  { first_name: 'Stagiaire', last_name: 'Démo', email: 'stagiaire@example.com', role: 'TRAINEE' }
];

async function seedDemoAccounts() {
  try {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const pool = await initDb();

    // Créer un groupe démo si besoin (pour le stagiaire)
    const [existingGroup] = await pool.query('SELECT id FROM `groups` WHERE name = ? LIMIT 1', ['Groupe Démo']);
    let groupId = existingGroup && existingGroup[0] ? existingGroup[0].id : null;
    if (!groupId) {
      const [insertGroup] = await pool.query(
        'INSERT INTO `groups` (name, description) VALUES (?, ?)',
        ['Groupe Démo', 'Groupe de démonstration']
      );
      groupId = insertGroup.insertId;
    }

    for (const acc of DEMO_ACCOUNTS) {
      const isTrainee = acc.role === 'TRAINEE';
      const [result] = await pool.query(
        `INSERT INTO \`users\` (first_name, last_name, email, password_hash, role, group_id)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         password_hash = VALUES(password_hash),
         first_name = VALUES(first_name),
         last_name = VALUES(last_name),
         role = VALUES(role),
         group_id = VALUES(group_id)`,
        [acc.first_name, acc.last_name, acc.email, hash, acc.role, isTrainee ? groupId : null]
      );
      const action = result.affectedRows === 1 && result.insertId ? 'Créé' : 'Mis à jour';
      console.log(`${action} : ${acc.email} (${acc.role})`);
    }

    console.log('\nMot de passe commun pour tous les comptes :', DEMO_PASSWORD);
    console.log('\nComptes démo :');
    console.log('  Admin     : admin@example.com');
    console.log('  Formateur : formateur@example.com');
    console.log('  Stagiaire : stagiaire@example.com');
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

seedDemoAccounts();
