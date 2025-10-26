const express = require('express');
const router = express.Router();
const frequenciaController = require('../controllers/frequenciaController');
const authMiddleware = require('../middlewares/authMiddleware');

// Criar uma nova frequência (POST /frequencia)
router.post('/createfrequencia', authMiddleware, frequenciaController.createFrequencia);

// Listar frequências com filtros opcionais (GET /frequencia?aluno=id&turma=id&data=2023-10-01)
router.get('/listarfrequencias', authMiddleware, frequenciaController.getFrequencias);

// Atualizar uma frequência por ID (PUT /frequencia/:id)
router.put('/atualizarfrequencia/:id', authMiddleware, frequenciaController.updateFrequencia);

// Deletar uma frequência por ID (DELETE /frequencia/:id)
router.delete('/deletarfrequencia/:id', authMiddleware, frequenciaController.deleteFrequencia);

module.exports = router;