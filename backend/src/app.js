// Application Express principale
const express = require('express');
const cors = require('cors');
const { initDb } = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// Middlewares globaux
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '8mb' }));

// Pré-initialise la connexion DB (log en cas d’échec)
initDb()
  .then(() => console.log('✅ Connexion MySQL initialisée'))
  .catch((err) => console.error('❌ Erreur de connexion MySQL', err));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Gestion basique des 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route non trouvée' });
});

module.exports = app;
