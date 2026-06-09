// Contrôleur des groupes
const Group = require('../models/Group');

// GET /api/groups/public
async function listPublicGroups(req, res) {
  try {
    const groups = await Group.findAllGroups();
    res.json(groups.map(g => ({ id: g.id, name: g.name })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// GET /api/groups
async function listGroups(req, res) {
  try {
    if (req.user.role === 'TRAINER') {
      const ownGroups = await Group.findGroupsForTrainer(req.user.id);
      return res.json(ownGroups);
    }
    const groups = await Group.findAllGroups();
    res.json(groups);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// POST /api/groups
async function createGroup(req, res) {
  const { name, description, trainer_ids } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Le nom du groupe est requis' });
  }
  try {
    const created = await Group.createGroup({ name, description, trainer_ids });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

// PUT /api/groups/:id
async function updateGroup(req, res) {
  const { id } = req.params;
  const { name, description, trainer_ids } = req.body;
  try {
    await Group.updateGroup(id, { name, description, trainer_ids });
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
  listPublicGroups,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup
};

