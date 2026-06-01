// Contrôleur d'authentification : login + infos profil connecté
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
require('dotenv').config();

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
async function register(req, res) {
  const { first_name, last_name, email, password } = req.body;
  if (!first_name || !last_name || !email || !password) {
    return res.status(400).json({ message: 'Champs obligatoires manquants' });
  }

  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email deja utilise' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const created = await User.createUser({
      first_name,
      last_name,
      email,
      password_hash,
      role: 'TRAINEE',
      account_status: 'SUSPENDED',
      group_id: null
    });

    return res.status(201).json({
      message: 'Compte créé avec succès, en attente de validation par un administrateur.',
      user: {
        id: created.id,
        first_name: created.first_name,
        last_name: created.last_name,
        email: created.email,
        role: created.role,
        account_status: created.account_status
      }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    if (user.account_status === 'SUSPENDED' || user.account_status === 'PENDING') {
      return res.status(403).json({ message: 'Votre compte est en attente de validation par un administrateur.' });
    }
    if (user.account_status === 'REJECTED') {
      return res.status(403).json({ message: 'Votre demande de compte a été rejetée.' });
    }

    const token = generateToken(user);
    const stats = await Attendance.getStatsForUser(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        group_id: user.group_id,
        access_status: user.access_status
      },
      stats
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }
    const stats = await Attendance.getStatsForUser(user.id);
    return res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        group_id: user.group_id,
        access_status: user.access_status
      },
      stats
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  register,
  login,
  getMe
};
