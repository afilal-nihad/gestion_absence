// Contrôleur des présences
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const Group = require('../models/Group');

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
// Body attendu : { group_id, date, time_slots: [], records: [{ user_id, status, arrival_time }] }
async function bulkUpsertAttendance(req, res) {
  let { group_id, date, time_slots, records } = req.body;
  if (!group_id || !date || !Array.isArray(time_slots) || time_slots.length === 0 || !Array.isArray(records)) {
    return res.status(400).json({ message: 'Paramètres invalides' });
  }

  try {
    if (req.user.role === 'TRAINER') {
      const ownGroups = await Group.findGroupsForTrainer(req.user.id);
      const ownGroupIds = ownGroups.map(g => String(g.id));
      if (ownGroupIds.length === 0) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      if (!ownGroupIds.includes(String(group_id))) {
        return res.status(403).json({ message: 'Acces refuse pour ce groupe' });
      }
    }

    const recordsBelongToGroup = await validateTraineesForGroup(records, group_id);
    if (!recordsBelongToGroup) {
      return res.status(403).json({ message: 'Acces refuse pour un ou plusieurs stagiaires' });
    }

    const promises = [];
    for (const r of records) {
      for (const ts of time_slots) {
        promises.push(
          Attendance.upsertAttendance({
            user_id: r.user_id,
            group_id,
            date,
            time_slot: ts,
            status: r.status,
            arrival_time: r.arrival_time || null
          })
        );
      }
    }
    await Promise.all(promises);
    res.status(200).json({ message: 'Présences enregistrées' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/attendance
// Filtres possibles : ?user_id= &group_id= &date= &time_slot=
async function listAttendance(req, res) {
  const { user_id, date, time_slot, from, to } = req.query;
  let { group_id } = req.query;
  try {
    if (req.user.role === 'TRAINER') {
      const ownGroups = await Group.findGroupsForTrainer(req.user.id);
      const ownGroupIds = ownGroups.map(g => String(g.id));
      if (ownGroupIds.length === 0) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      if (group_id && !ownGroupIds.includes(String(group_id))) {
        return res.status(403).json({ message: 'Acces refuse pour ce groupe' });
      } else if (!group_id) {
        // If trainer doesn't filter by group_id, fetch all their groups.
        // As a shortcut we can return all their allowed records if the frontend
        // provides group_id. The frontend always does provide group_id for trainers.
        // But let's handle if it doesn't just in case (we can just error or leave group_id undefined and filter later).
        // Since we didn't change Attendance.findAll to accept array, let's enforce group_id for trainers.
        return res.status(400).json({ message: 'Le paramètre group_id est requis pour le formateur' });
      }
    }
    const records = await Attendance.findAll({ user_id, group_id, date, time_slot, from, to });
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
  const { user_id, date, time_slot, from, to } = req.query;
  let { group_id } = req.query;
  try {
    if (req.user.role === 'TRAINER') {
      const ownGroups = await Group.findGroupsForTrainer(req.user.id);
      const ownGroupIds = ownGroups.map(g => String(g.id));
      if (ownGroupIds.length === 0) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      if (group_id && !ownGroupIds.includes(String(group_id))) {
        return res.status(403).json({ message: 'Acces refuse pour ce groupe' });
      } else if (!group_id) {
        return res.status(400).json({ message: 'Le paramètre group_id est requis pour le formateur' });
      }
    }
    const records = await Attendance.findAll({ user_id, group_id, date, time_slot, from, to });
    const csv = buildAttendanceCsv(records);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="presences.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
