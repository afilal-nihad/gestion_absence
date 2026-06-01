// Contrôleur des groupes
const Group = require('../models/Group');

// GET /api/groups
async function listGroups(req, res) {
  try {
    const groups = await Group.findAllGroups();
    if (req.user.role === 'TRAINER') {
      const ownGroups = groups.filter((g) => String(g.id) === String(req.user.group_id));
      return res.json(ownGroups);
    }
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST /api/groups
async function createGroup(req, res) {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Le nom du groupe est requis' });
  }
  try {
    const created = await Group.createGroup({ name, description });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /api/groups/:id
async function updateGroup(req, res) {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await Group.updateGroup(id, { name, description });
    const updated = await Group.findById(id);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// DELETE /api/groups/:id
async function deleteGroup(req, res) {
  const { id } = req.params;
  try {
    await Group.deleteGroup(id);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup
};

