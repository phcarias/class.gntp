const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Relatórios JSON (com suporte a período via query: ?startDate=2023-10-01&endDate=2023-10-31)
router.get('/frequencia/turma/:turmaId', authMiddleware, reportController.getRelatorioFrequenciaTurma);
router.get('/frequencia/aluno/:alunoId', authMiddleware, reportController.getRelatorioFrequenciaAluno);
router.get('/desempenho/turma/:turmaId', authMiddleware, reportController.getRelatorioDesempenhoTurma);
router.get('/desempenho/aluno/:alunoId', authMiddleware, reportController.getRelatorioDesempenhoAluno);
router.get('/dados-gerais', authMiddleware, reportController.getRelatorioDadosGerais);

// Exportações PDF (com suporte a período)
router.get('/export/pdf/frequencia/turma/:turmaId', authMiddleware, reportController.exportRelatorioFrequenciaTurmaPDF);
router.get('/export/pdf/frequencia/aluno/:alunoId', authMiddleware, reportController.exportRelatorioFrequenciaAlunoPDF);
router.get('/export/pdf/notas/:alunoId', authMiddleware, reportController.exportRelatorioNotasPDF);
router.get('/export/pdf/desempenho', authMiddleware, reportController.exportRelatorioDesempenhoPDF);
router.get('/export/pdf/desempenho/turma/:turmaId', authMiddleware, reportController.exportRelatorioDesempenhoTurmaPDF);
router.get('/export/pdf/desempenho/aluno/:alunoId', authMiddleware, reportController.exportRelatorioDesempenhoAlunoPDF);
router.get('/export/pdf/dados-gerais', authMiddleware, reportController.exportRelatorioDadosGeraisPDF);

// Rota para exportar relatório de desempenho geral como PDF
router.get('/export/desempenho/pdf', authMiddleware, reportController.exportRelatorioDesempenhoPDF);
router.get('/export/pdf/desempenhofrequencia/aluno/:alunoId', authMiddleware, reportController.exportRelatorioDesempenhoFrequenciaAlunoPDF);

module.exports = router;