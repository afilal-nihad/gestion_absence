// Contrôleur des présences
const Attendance = require('../models/Attendance');
const User = require('../models/User');

function buildAttendanceCsv(records) {
  const lines = ['Date,Groupe,Stagiaire,Statut,Heure_arrivee'];
  for (const r of records) {
    const trainee = `${r.last_name || ''} ${r.first_name || ''}`.trim();
    lines.push([r.date, `"${r.group_name || ''}"`, `"${trainee}"`, r.status, r.arrival_time || ''].join(','));
  }
  return lines.join('\n');
}

async function validateTraineesForGroup(records, groupId) {
  const traineeIds = [...new Set(records.map((record) => Number(record.user_id)).filter(Boolean))];
  if (traineeIds.length !== records.length) {
    return false;
  }

  const trainees = await User.findAllTrainees();
  const traineesById = new Map(trainees.map((trainee) => [Number(trainee.id), trainee]));

  return traineeIds.every((id) => {
    const trainee = traineesById.get(id);
    return trainee && Number(trainee.group_id) === Number(groupId) && trainee.access_status !== 'BLOCKED';
  });
}

// POST /api/attendance/bulk
// Enregistre les présences d'un groupe pour une date donnée
// Body attendu : { group_id, date, records: [{ user_id, status, arrival_time }] }
async function bulkUpsertAttendance(req, res) {
  let { group_id, date, records } = req.body;
  if (!group_id || !date || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Paramètres invalides' });
  }

  try {
    if (req.user.role === 'TRAINER') {
      if (!req.user.group_id) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      if (Number(group_id) !== Number(req.user.group_id)) {
        return res.status(403).json({ message: 'Acces refuse pour ce groupe' });
      }
      group_id = req.user.group_id;
    }

    const recordsBelongToGroup = await validateTraineesForGroup(records, group_id);
    if (!recordsBelongToGroup) {
      return res.status(403).json({ message: 'Acces refuse pour un ou plusieurs stagiaires' });
    }

    const promises = records.map((r) =>
      Attendance.upsertAttendance({
        user_id: r.user_id,
        group_id,
        date,
        status: r.status,
        arrival_time: r.arrival_time || null
      })
    );
    await Promise.all(promises);
    res.status(200).json({ message: 'Présences enregistrées' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/attendance
// Filtres possibles : ?user_id= &group_id= &date=
async function listAttendance(req, res) {
  const { user_id, date, from, to } = req.query;
  let { group_id } = req.query;
  try {
    if (req.user.role === 'TRAINER') {
      if (!req.user.group_id) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      group_id = req.user.group_id;
    }
    const records = await Attendance.findAll({ user_id, group_id, date, from, to });
    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  bulkUpsertAttendance,
  listAttendance,
  exportAttendanceCsv
};

// GET /api/attendance/export
async function exportAttendanceCsv(req, res) {
  const { user_id, date, from, to } = req.query;
  let { group_id } = req.query;
  try {
    if (req.user.role === 'TRAINER') {
      if (!req.user.group_id) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      group_id = req.user.group_id;
    }
    const records = await Attendance.findAll({ user_id, group_id, date, from, to });
    const csv = buildAttendanceCsv(records);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="presences.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
