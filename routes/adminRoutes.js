const express = require("express");
const router = express.Router();
const { checkToken, checkAdmin } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");

// Rota protegida para administradores
//router.get("/admin/users", checkToken, checkAdmin, getAllUsers);

router.get("/alunosstats", checkToken, checkAdmin, adminController.getAlunosStats);
router.get("/professoresstats", checkToken, checkAdmin, adminController.getProfessoresStats);
router.get("/turmasativas", checkToken, checkAdmin, adminController.getTurmasStats);
router.get("/frequenciamedia", checkToken, checkAdmin, adminController.getFrequenciaMedia);
router.post("/buscaraluno", checkToken, checkAdmin, adminController.getAlunosByName);
router.get("/getalunos", checkToken, checkAdmin, adminController.getAlunos);
router.put("/attaluno", checkToken, checkAdmin, adminController.updateAluno);
router.get("/getprofessores", checkToken, checkAdmin, adminController.getProfessores);
router.post("/buscarprofessor", checkToken, checkAdmin, adminController.getProfessoresByName);
// Alterado: receber id no body
router.put("/attprofessor", checkToken, checkAdmin, adminController.updateProfessor);

module.exports = router;