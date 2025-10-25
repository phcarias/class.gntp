const express = require("express");
const router = express.Router();
const { checkToken, checkAdmin } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const turmaController = require("../controllers/turmaController"); // Adicione aqui


router.get("/alunosstats", checkToken, checkAdmin, adminController.getAlunosStats);
router.get("/professoresstats", checkToken, checkAdmin, adminController.getProfessoresStats);
router.get("/turmasativas", checkToken, checkAdmin, adminController.getTurmasStats);
router.get("/frequenciamedia", checkToken, checkAdmin, adminController.getFrequenciaMedia);
router.post("/buscaraluno", checkToken, checkAdmin, adminController.getAlunosByName);
router.get("/getalunos", checkToken, checkAdmin, adminController.getAlunos);
router.put("/attaluno", checkToken, checkAdmin, adminController.updateAluno);
router.get("/getprofessores", checkToken, checkAdmin, adminController.getProfessores);
router.post("/buscarprofessor", checkToken, checkAdmin, adminController.getProfessoresByName);
router.put("/attprofessor", checkToken, checkAdmin, adminController.updateProfessor);
router.delete("/userremove/:id", checkToken, checkAdmin, adminController.deleteUser); // Deletar aluno ou professor
router.delete("/turmaremove/:id", checkToken, checkAdmin, adminController.deleteTurma); // Deletar turma
router.delete("/adminremove/:id", checkToken, checkAdmin, adminController.deleteAdmin); // Deletar admin (opcional)
router.get("/getturmas", checkToken, checkAdmin, turmaController.getTurmas); // Use diretamente
router.put("/updateturma/:id", checkToken, checkAdmin, turmaController.updateTurma); // Atualizar turma


module.exports = router;