// Modèle utilisateur : accès aux données MySQL pour les utilisateurs/stagiaires
const { initDb } = require('../config/db');

// Retourne un pool de connexion
async function getPool() {
  return initDb();
}

async function findByEmail(email) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM `users` WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM `users` WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findAllTrainees() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.*, g.name AS group_name
     FROM \`users\` u
     LEFT JOIN \`groups\` g ON u.group_id = g.id
     WHERE u.role = 'TRAINEE'
     ORDER BY u.last_name, u.first_name`
  );
  return rows;
}

async function findPendingUsers() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT * FROM \`users\` WHERE account_status IN ('SUSPENDED', 'PENDING') ORDER BY created_at DESC`
  );
  return rows;
}

async function createUser(user) {
  const pool = await getPool();
  const {
    first_name,
    last_name,
    email,
    password_hash,
    role = 'TRAINEE',
    account_status = 'PENDING',
    access_status = 'ALLOWED',
    group_id = null
  } = user;

  const [result] = await pool.query(
    `INSERT INTO \`users\` (first_name, last_name, email, password_hash, role, account_status, access_status, group_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, password_hash, role, account_status, access_status, group_id]
  );

  return { id: result.insertId, ...user, account_status };
}

async function updateUser(id, fields) {
  const pool = await getPool();

  // Construction dynamique de la requête UPDATE
  const allowedFields = ['first_name', 'last_name', 'email', 'password_hash', 'role', 'account_status', 'access_status', 'group_id'];
  const updates = [];
  const values = [];

  for (const key of allowedFields) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) return false;

  values.push(id);

  await pool.query(`UPDATE \`users\` SET ${updates.join(', ')} WHERE id = ?`, values);
  return true;
}

async function deleteUser(id) {
  const pool = await getPool();
  await pool.query('DELETE FROM `users` WHERE id = ?', [id]);
  return true;
}

async function findAllTrainers() {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT u.* FROM \`users\` u WHERE u.role = 'TRAINER' ORDER BY u.last_name, u.first_name`
  );
  return rows;
}

module.exports = {
  findByEmail,
  findById,
  findAllTrainees,
  findAllTrainers,
  findPendingUsers,
  createUser,
  updateUser,
  deleteUser
};
