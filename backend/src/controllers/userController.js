// Contrôleur des utilisateurs / stagiaires (CRUD réservé aux admins)
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

// GET /api/users/trainees
async function listTrainees(req, res) {
  try {
    let trainees = await User.findAllTrainees();
    if (req.user.role === 'TRAINER') {
      trainees = trainees.filter((t) => String(t.group_id) === String(req.user.group_id));
    }
    res.json(trainees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST /api/users/trainees
async function createTrainee(req, res) {
  const { first_name, last_name, email, password, group_id } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Champs obligatoires manquants' });
  }
  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email déjà utilisé' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const created = await User.createUser({
      first_name,
      last_name,
      email,
      password_hash,
      role: 'TRAINEE',
      account_status: 'SUSPENDED',
      access_status: 'ALLOWED',
      group_id: group_id || null
    });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /api/users/trainees/:id
async function updateTrainee(req, res) {
  const { id } = req.params;
  const { first_name, last_name, email, password, group_id, access_status } = req.body;

  try {
    const fields = { first_name, last_name, email, group_id, access_status };
    if (password) {
      fields.password_hash = await bcrypt.hash(password, 10);
    }
    await User.updateUser(id, fields);
    const updated = await User.findById(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// DELETE /api/users/trainees/:id
async function deleteTrainee(req, res) {
  const { id } = req.params;
  try {
    await User.deleteUser(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/users/trainees/:id/attendance
async function getTraineeAttendance(req, res) {
  const { id } = req.params;
  try {
    if (req.user.role === 'TRAINER') {
      const trainee = await User.findById(id);
      if (!trainee || String(trainee.group_id) !== String(req.user.group_id)) {
        return res.status(403).json({ message: 'Acces refuse' });
      }
    }
    const records = await Attendance.findByUser(id);
    const stats = await Attendance.getStatsForUser(id);
    res.json({ records, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/users/me/attendance
async function getMyAttendance(req, res) {
  try {
    const userId = req.user.id;
    const records = await Attendance.findByUser(userId);
    const stats = await Attendance.getStatsForUser(userId);
    res.json({ records, stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/users/pending
async function listPendingUsers(req, res) {
  try {
    const pendingUsers = await User.findPendingUsers();
    res.json(pendingUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /api/users/:id/status
async function updateUserStatus(req, res) {
  const { id } = req.params;
  const { account_status, role, group_id, access_status } = req.body;

  if (!account_status && !role && group_id === undefined && !access_status) {
    return res.status(400).json({ message: 'Aucune mise a jour demandee' });
  }

  try {
    const fieldsToUpdate = {};
    if (account_status) fieldsToUpdate.account_status = account_status;
    if (role) {
      fieldsToUpdate.role = role;
    }
    if (group_id !== undefined) fieldsToUpdate.group_id = group_id || null;
    if (access_status) fieldsToUpdate.access_status = access_status;
    await User.updateUser(id, fieldsToUpdate);
    const updated = await User.findById(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST /api/users/me/attendance/:attendanceId/certificate
async function uploadMyCertificate(req, res) {
  const { attendanceId } = req.params;
  const { file_name, mime_type, file_data } = req.body;

  if (!file_name || !mime_type || !file_data) {
    return res.status(400).json({ message: 'Certificat invalide' });
  }

  try {
    const attendance = await Attendance.findById(attendanceId);
    if (!attendance || Number(attendance.user_id) !== Number(req.user.id)) {
      return res.status(403).json({ message: 'Acces refuse' });
    }
    if (attendance.status !== 'ABSENT') {
      return res.status(400).json({ message: 'Un justificatif est accepte uniquement pour une absence' });
    }

    const certificate = await Attendance.createCertificate({
      attendance_id: attendance.id,
      user_id: req.user.id,
      file_name,
      mime_type,
      file_data
    });
    res.status(201).json(certificate);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/users/certificates
async function listCertificates(req, res) {
  try {
    const certificates = await Attendance.listCertificates({
      review_status: req.query.review_status || undefined
    });
    res.json(certificates);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /api/users/certificates/:id/status
async function reviewCertificate(req, res) {
  const { id } = req.params;
  const { review_status, admin_comment } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(review_status)) {
    return res.status(400).json({ message: 'Statut de validation invalide' });
  }

  try {
    await Attendance.updateCertificateStatus(id, {
      review_status,
      admin_comment,
      reviewed_by: req.user.id
    });
    res.json({ id: Number(id), review_status, admin_comment: admin_comment || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  listTrainees,
  createTrainee,
  updateTrainee,
  deleteTrainee,
  getTraineeAttendance,
  getMyAttendance,
  listPendingUsers,
  updateUserStatus,
  uploadMyCertificate,
  listCertificates,
  reviewCertificate
};
