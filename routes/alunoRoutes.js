// language: javascript
// filepath: /routes/alunoRoutes.js
// ...existing code...
{
    const express = require('express');
    const router = express.Router();
    const User = require('../models/UserModel'); // <-- modelo do aluno
    const Turma = require('../models/TurmaModel'); // adiciona o modelo Turma para popular
    const authMiddleware = require('../middlewares/authMiddleware'); // <-- protege rota
    
    // GET /aluno/me -> retorna dados do aluno autenticado
    router.get('/me', authMiddleware, async (req, res) => {
      try {
        // usar req.user.id provido pelo middleware de autenticação
        const id = (req.user && (req.user.id || req.user._id)) || req.userId;
        if (!id) return res.status(401).json({ error: 'Usuário não autenticado' });
    
        // selecionar campos úteis e popular turmas em roleData (como no adminController)
        const aluno = await User.findById(id)
          .select('-senha -__v')
          .populate({
            path: 'roleData.turmas.turma',
            model: 'Turma'
          });
    
        if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });
    
        return res.json(aluno);
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    });
    
    module.exports = router;
    }
    // ...existing code...