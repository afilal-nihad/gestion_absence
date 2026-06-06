// Modèle groupe : gestion des groupes de stagiaires
const { initDb } = require('../config/db');

async function getPool() {
  return initDb();
}

async function findAllGroups() {
  const pool = await getPool();
  const [rows] = await pool.query(
    'SELECT g.*, COUNT(u.id) AS trainee_count FROM `groups` g LEFT JOIN `users` u ON u.group_id = g.id AND u.role = "TRAINEE" GROUP BY g.id ORDER BY g.name'
  );
  
  // Fetch trainers for each group
  const [trainerRows] = await pool.query('SELECT group_id, trainer_id FROM trainer_groups');
  const trainersByGroup = {};
  for (const row of trainerRows) {
    if (!trainersByGroup[row.group_id]) trainersByGroup[row.group_id] = [];
    trainersByGroup[row.group_id].push(row.trainer_id);
  }

  return rows.map(g => ({
    ...g,
    trainer_ids: trainersByGroup[g.id] || []
  }));
}

async function findGroupsForTrainer(trainer_id) {
  const pool = await getPool();
  const [rows] = await pool.query(
    `SELECT g.*, COUNT(u.id) AS trainee_count 
     FROM \`groups\` g 
     JOIN \`trainer_groups\` tg ON tg.group_id = g.id 
     LEFT JOIN \`users\` u ON u.group_id = g.id AND u.role = 'TRAINEE'
     WHERE tg.trainer_id = ? 
     GROUP BY g.id ORDER BY g.name`,
    [trainer_id]
  );
  return rows.map(g => ({ ...g, trainer_ids: [trainer_id] }));
}

async function findById(id) {
  const pool = await getPool();
  const [rows] = await pool.query('SELECT * FROM `groups` WHERE id = ?', [id]);
  if (!rows[0]) return null;

  const [trainerRows] = await pool.query('SELECT trainer_id FROM trainer_groups WHERE group_id = ?', [id]);
  rows[0].trainer_ids = trainerRows.map(r => r.trainer_id);
  
  return rows[0];
}

async function createGroup(group) {
  const pool = await getPool();
  const { name, description = null, trainer_ids = [] } = group;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'INSERT INTO `groups` (name, description) VALUES (?, ?)',
      [name, description]
    );
    const groupId = result.insertId;
    
    if (trainer_ids && trainer_ids.length > 0) {
      const values = trainer_ids.map(t_id => [t_id, groupId]);
      await connection.query('INSERT INTO trainer_groups (trainer_id, group_id) VALUES ?', [values]);
    }
    await connection.commit();
    return { id: groupId, ...group };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    if (updates.length > 0) {
      values.push(id);
      await connection.query(`UPDATE \`groups\` SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (fields.trainer_ids !== undefined) {
      await connection.query('DELETE FROM trainer_groups WHERE group_id = ?', [id]);
      if (fields.trainer_ids.length > 0) {
        const tValues = fields.trainer_ids.map(t_id => [t_id, id]);
        await connection.query('INSERT INTO trainer_groups (trainer_id, group_id) VALUES ?', [tValues]);
      }
    }
    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

async function deleteGroup(id) {
  const pool = await getPool();
  await pool.query('DELETE FROM `groups` WHERE id = ?', [id]);
  return true;
}

module.exports = {
  findAllGroups,
  findGroupsForTrainer,
  findById,
  createGroup,
  updateGroup,
  deleteGroup
};

