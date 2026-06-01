// Contrôleur des statistiques globales
const Attendance = require('../models/Attendance');
const PDFDocument = require('pdfkit');

function buildCsv(stats) {
  const lines = [];
  lines.push('Section,Nom,Presence(%),Presents,Absences,Retards,Total,Date');
  for (const t of stats.byTrainee) {
    lines.push(
      ['Stagiaire', `"${t.last_name} ${t.first_name}"`, t.attendance_rate, t.presents, t.absences, t.lates, t.total, ''].join(',')
    );
  }
  for (const g of stats.byGroup) {
    lines.push(
      ['Groupe', `"${g.group_name || ''}"`, g.attendance_rate, g.presents, g.absences, g.lates, g.total, ''].join(',')
    );
  }
  for (const d of stats.byDate) {
    lines.push(
      ['Date', '', d.attendance_rate, d.presents, d.absences, d.lates, d.total, d.date].join(',')
    );
  }
  return lines.join('\n');
}

// GET /api/stats/global
async function getGlobalStats(req, res) {
  try {
    const filters = {
      group_id: req.query.group_id || undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined
    };
    if (req.user.role === 'TRAINER') {
      if (!req.user.group_id) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      filters.group_id = req.user.group_id;
    }
    const byTrainee = await Attendance.getStatsGlobal(filters);
    const byGroup = await Attendance.getStatsByGroup(filters);
    const byDate = await Attendance.getStatsByDate(filters);
    res.json({ byTrainee, byGroup, byDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/stats/global/export
async function exportGlobalStatsCsv(req, res) {
  try {
    const filters = {
      group_id: req.query.group_id || undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined
    };
    if (req.user.role === 'TRAINER') {
      if (!req.user.group_id) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      filters.group_id = req.user.group_id;
    }
    const byTrainee = await Attendance.getStatsGlobal(filters);
    const byGroup = await Attendance.getStatsByGroup(filters);
    const byDate = await Attendance.getStatsByDate(filters);
    const csv = buildCsv({ byTrainee, byGroup, byDate });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="stats-globales.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/stats/global/export-pdf
async function exportGlobalStatsPdf(req, res) {
  try {
    const filters = {
      group_id: req.query.group_id || undefined,
      from: req.query.from || undefined,
      to: req.query.to || undefined
    };
    if (req.user.role === 'TRAINER') {
      if (!req.user.group_id) {
        return res.status(403).json({ message: 'Aucun groupe assigne au formateur' });
      }
      filters.group_id = req.user.group_id;
    }

    const byTrainee = await Attendance.getStatsGlobal(filters);
    const byGroup = await Attendance.getStatsByGroup(filters);
    const byDate = await Attendance.getStatsByDate(filters);

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stats-globales.pdf"');
    doc.pipe(res);

    doc.fontSize(18).text('Statistiques globales des absences');
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Filtres - groupe: ${filters.group_id || 'tous'} | du: ${filters.from || '-'} | au: ${filters.to || '-'}`);
    doc.moveDown();

    doc.fontSize(14).text('Par groupe');
    byGroup.forEach((g) => {
      doc.fontSize(10).text(`- ${g.group_name || 'Sans groupe'} : ${g.attendance_rate}% (P:${g.presents} A:${g.absences} R:${g.lates})`);
    });
    doc.moveDown();

    doc.fontSize(14).text('Par stagiaire');
    byTrainee.forEach((t) => {
      doc.fontSize(10).text(`- ${t.last_name} ${t.first_name} : ${t.attendance_rate}% (P:${t.presents} A:${t.absences} R:${t.lates})`);
    });
    doc.moveDown();

    doc.fontSize(14).text('Par date');
    byDate.forEach((d) => {
      doc.fontSize(10).text(`- ${d.date} : ${d.attendance_rate}% (P:${d.presents} A:${d.absences} R:${d.lates})`);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  getGlobalStats,
  exportGlobalStatsCsv,
  exportGlobalStatsPdf
};

