const express = require('express');
const router = express.Router();
const notaController = require('../controllers/notaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/createnota', authMiddleware, notaController.createNota);
router.get('/listarnotas', authMiddleware, notaController.getNotas);
router.put('/atualizarnota/:id', authMiddleware, notaController.updateNota);
router.delete('/deletarnota/:id', authMiddleware, notaController.deleteNota);

module.exports = router;