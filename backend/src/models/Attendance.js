// Modèle présence : enregistrement des présences / absences / retards
const { initDb } = require('../config/db');

async function getPool() {
  return initDb();
}

async function upsertAttendance({ user_id, group_id, date, status, arrival_time = null }) {
  const pool = await getPool();
  // On suppose une seule ligne par utilisateur/date
  const [result] = await pool.query(
    `INSERT INTO \`attendance\` (user_id, group_id, date, status, arrival_time)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), arrival_time = VALUES(arrival_time), group_id = VALUES(group_id)`,
    [user_id, group_id, date, status, arrival_time]
  );
  return result;
}

async function findByUser(user_id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT a.*, g.name AS group_name,
        c.id AS certificate_id,
        c.file_name AS certificate_file_name,
        c.review_status AS certificate_status,
        c.admin_comment AS certificate_admin_comment
     FROM \`attendance\` a
     LEFT JOIN \`groups\` g ON a.group_id = g.id
     LEFT JOIN \`absence_certificates\` c ON c.attendance_id = a.id
     WHERE a.user_id = ?
     ORDER BY a.date DESC`,
    [user_id]
  );
  return rows;
}

async function findById(id) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM `attendance` WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByGroupAndDate(group_id, date) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT a.*, u.first_name, u.last_name
     FROM \`attendance\` a
     JOIN \`users\` u ON a.user_id = u.id
     WHERE a.group_id = ? AND a.date = ?
     ORDER BY u.last_name, u.first_name`,
    [group_id, date]
  );
  return rows;
}

async function findAll(filters = {}) {
  const pool = await getPool();
  const conditions = [];
  const values = [];

  if (filters.user_id) {
    conditions.push('a.user_id = ?');
    values.push(filters.user_id);
  }
  if (filters.group_id) {
    conditions.push('a.group_id = ?');
    values.push(filters.group_id);
  }
  if (filters.date) {
    conditions.push('a.date = ?');
    values.push(filters.date);
  }
  if (filters.from) {
    conditions.push('a.date >= ?');
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push('a.date <= ?');
    values.push(filters.to);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT a.*, u.first_name, u.last_name, u.access_status, g.name AS group_name,
        c.review_status AS certificate_status
     FROM \`attendance\` a
     JOIN \`users\` u ON a.user_id = u.id
     LEFT JOIN \`groups\` g ON a.group_id = g.id
     LEFT JOIN \`absence_certificates\` c ON c.attendance_id = a.id
     ${where}
     ORDER BY a.date DESC, u.last_name, u.first_name`,
    values
  );
  return rows;
}

async function createCertificate({ attendance_id, user_id, file_name, mime_type, file_data }) {
  const pool = await getPool();
  const [result] = await pool.query(
    `INSERT INTO \`absence_certificates\` (attendance_id, user_id, file_name, mime_type, file_data)
     VALUES (?, ?, ?, ?, ?)`,
    [attendance_id, user_id, file_name, mime_type, file_data]
  );
  return { id: result.insertId, attendance_id, user_id, file_name, mime_type, review_status: 'PENDING' };
}

async function listCertificates(filters = {}) {
  const pool = await getPool();
  const conditions = [];
  const values = [];
  if (filters.review_status) {
    conditions.push('c.review_status = ?');
    values.push(filters.review_status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT c.*, a.date, a.status, u.first_name, u.last_name, g.name AS group_name
     FROM \`absence_certificates\` c
     JOIN \`attendance\` a ON c.attendance_id = a.id
     JOIN \`users\` u ON c.user_id = u.id
     LEFT JOIN \`groups\` g ON a.group_id = g.id
     ${where}
     ORDER BY c.created_at DESC`,
    values
  );
  return rows;
}

async function updateCertificateStatus(id, { review_status, admin_comment, reviewed_by }) {
  const pool = await getPool();
  await pool.query(
    `UPDATE \`absence_certificates\`
     SET review_status = ?, admin_comment = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [review_status, admin_comment || null, reviewed_by, id]
  );
  return true;
}

async function getStatsForUser(user_id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) AS presents,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) AS absences,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) AS lates,
        COUNT(*) AS total
     FROM \`attendance\`
     WHERE user_id = ?`,
    [user_id]
  );
  const row = rows[0] || { presents: 0, absences: 0, lates: 0, total: 0 };
  const attendance_rate = row.total ? Math.round((row.presents / row.total) * 100) : 0;
  return { ...row, attendance_rate };
}

async function getStatsGlobal(filters = {}) {
  const pool = await getPool();
  const conditions = ["u.role = 'TRAINEE'"];
  const values = [];
  if (filters.group_id) {
    conditions.push('u.group_id = ?');
    values.push(filters.group_id);
  }
  if (filters.from) {
    conditions.push('a.date >= ?');
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push('a.date <= ?');
    values.push(filters.to);
  }
  const [rows] = await pool.query(
    `SELECT
        u.id AS user_id,
        u.first_name,
        u.last_name,
        g.name AS group_name,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS presents,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absences,
        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS lates,
        COUNT(a.id) AS total
     FROM \`users\` u
     LEFT JOIN \`attendance\` a ON a.user_id = u.id
     LEFT JOIN \`groups\` g ON u.group_id = g.id
     WHERE ${conditions.join(' AND ')}
     GROUP BY u.id, u.first_name, u.last_name, g.name
     ORDER BY u.last_name, u.first_name`,
    values
  );

  return rows.map((row) => ({
    ...row,
    attendance_rate: row.total ? Math.round((row.presents / row.total) * 100) : 0
  }));
}

async function getStatsByGroup(filters = {}) {
  const pool = await getPool();
  const conditions = [];
  const values = [];
  if (filters.group_id) {
    conditions.push('g.id = ?');
    values.push(filters.group_id);
  }
  if (filters.from) {
    conditions.push('a.date >= ?');
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push('a.date <= ?');
    values.push(filters.to);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT
        g.id AS group_id,
        g.name AS group_name,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS presents,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absences,
        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS lates,
        COUNT(a.id) AS total
     FROM \`groups\` g
     LEFT JOIN \`attendance\` a ON a.group_id = g.id
     ${where}
     GROUP BY g.id, g.name
     ORDER BY g.name`,
    values
  );

  return rows.map((row) => ({
    ...row,
    attendance_rate: row.total ? Math.round((row.presents / row.total) * 100) : 0
  }));
}

async function getStatsByDate(filters = {}) {
  const pool = await getPool();
  const conditions = [];
  const values = [];
  if (filters.group_id) {
    conditions.push('a.group_id = ?');
    values.push(filters.group_id);
  }
  if (filters.from) {
    conditions.push('a.date >= ?');
    values.push(filters.from);
  }
  if (filters.to) {
    conditions.push('a.date <= ?');
    values.push(filters.to);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT
        a.date,
        SUM(CASE WHEN a.status = 'PRESENT' THEN 1 ELSE 0 END) AS presents,
        SUM(CASE WHEN a.status = 'ABSENT' THEN 1 ELSE 0 END) AS absences,
        SUM(CASE WHEN a.status = 'LATE' THEN 1 ELSE 0 END) AS lates,
        COUNT(a.id) AS total
     FROM \`attendance\` a
     ${where}
     GROUP BY a.date
     ORDER BY a.date DESC`,
    values
  );

  return rows.map((row) => ({
    ...row,
    attendance_rate: row.total ? Math.round((row.presents / row.total) * 100) : 0
  }));
}

module.exports = {
  upsertAttendance,
  findById,
  findByUser,
  findByGroupAndDate,
  findAll,
  getStatsForUser,
  getStatsGlobal,
  getStatsByGroup,
  getStatsByDate,
  createCertificate,
  listCertificates,
  updateCertificateStatus
};
