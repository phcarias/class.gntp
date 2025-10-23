// javascript
const express = require('express');
const router = express.Router();
const User = require('../models/UserModel'); // <-- modelo do aluno
const authMiddleware = require('../middlewares/authMiddleware'); // <-- protege rota

// GET /aluno/me -> retorna dados do aluno autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const id = req.userId || (req.user && req.user._id) || req.user && req.user.id;
    if (!id) return res.status(401).json({ error: 'Usuário não autenticado' });

    const aluno = await User.findById(id).select('-senha -__v'); // remove senha
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    return res.json(aluno);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;