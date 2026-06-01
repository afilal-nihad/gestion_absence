// Modèle groupe : gestion des groupes de stagiaires
const { initDb } = require('../config/db');

async function getPool() {
  return initDb();
}

async function findAllGroups() {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT g.*, COUNT(u.id) AS trainee_count FROM `groups` g LEFT JOIN `users` u ON u.group_id = g.id GROUP BY g.id ORDER BY g.name'
  );
  return rows;
}

async function findById(id) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM `groups` WHERE id = ?', [id]);
  return rows[0] || null;
}

async function createGroup(group) {
  const pool = await getPool();
  const { name, description = null } = group;
  const [result] = await pool.query(
    'INSERT INTO `groups` (name, description) VALUES (?, ?)',
    [name, description]
  );
  return { id: result.insertId, ...group };
}

async function updateGroup(id, fields) {
  const pool = await getPool();
  const allowed = ['name', 'description'];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) return false;
  values.push(id);

  await pool.query(`UPDATE \`groups\` SET ${updates.join(', ')} WHERE id = ?`, values);
  return true;
}

async function deleteGroup(id) {
  const pool = await getPool();
  await pool.query('DELETE FROM `groups` WHERE id = ?', [id]);
  return true;
}

module.exports = {
  findAllGroups,
  findById,
  createGroup,
  updateGroup,
  deleteGroup
};

