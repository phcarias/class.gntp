const express = require('express');
const router = express.Router();
const notaController = require('../controllers/notaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post("/criar", authMiddleware, notaController.createNota);
router.get("/listar", authMiddleware, async (req, res) => {
  try {
    const Nota = require("../models/NotaModel");
    const query = {};
    if (req.query.turma) query.turma = req.query.turma;
    if (req.query.aluno) query.aluno = req.query.aluno;
    if (req.query.disciplina) query.disciplina = req.query.disciplina;
    const notas = await Nota.find(query).populate("aluno", "name nome email").populate("turma", "codigo disciplina nome");
    return res.json(notas);
  } catch (err) {
    console.error("listar notas erro:", err);
    return res.status(500).json({ msg: "Erro ao listar notas.", erro: err.message || err });
  }
});
router.put('/atualizarnota/:id', authMiddleware, notaController.updateNota);
router.delete('/deletarnota/:id', authMiddleware, notaController.deleteNota);

module.exports = router;