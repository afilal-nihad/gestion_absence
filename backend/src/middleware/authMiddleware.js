// Middleware d'authentification et de gestion des rôles
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Vérifie la présence et la validité du token JWT
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }
    req.user = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      group_id: user.group_id
    };
    next();
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: 'Token invalide' });
  }
}

// Vérifie que l'utilisateur a un des rôles demandés
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  authorizeRoles
};

