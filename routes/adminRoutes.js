const express = require("express");
const router = express.Router();
const { checkToken, checkAdmin } = require("../middlewares/authMiddleware");
const adminController = require("../controllers/adminController");
const turmaController = require("../controllers/turmaController"); // Adicione aqui


router.get("/alunosstats", checkToken, checkAdmin, adminController.getAlunosStats);
router.get("/professoresstats", checkToken, checkAdmin, adminController.getProfessoresStats);
router.get("/turmasativas", checkToken, checkAdmin, adminController.getTurmasStats);
router.get("/frequenciamedia", checkToken, checkAdmin, adminController.getFrequenciaMedia);
router.get("/getalunos", checkToken, checkAdmin, adminController.getAlunos);
router.get("/getprofessores", checkToken, checkAdmin, adminController.getProfessores);
router.get("/getturmas", checkToken, checkAdmin, turmaController.getTurmas); // Use diretamente
router.get("/getusers", checkToken, checkAdmin, adminController.getUsers); // Novo endpoint para todos os usuários

router.post("/buscaraluno", checkToken, checkAdmin, adminController.getAlunosByName);
router.post("/buscarprofessor", checkToken, checkAdmin, adminController.getProfessoresByName);
router.post("/getusersbyname", checkToken, checkAdmin, adminController.getUsersByName); // Novo endpoint para buscar usuários por nome


router.put("/attaluno", checkToken, checkAdmin, adminController.updateAluno);
router.put("/attprofessor", checkToken, checkAdmin, adminController.updateProfessor);
router.put("/updateturma/:id", checkToken, checkAdmin, turmaController.updateTurma); // Atualizar turma
router.put("/updateadmin", checkToken, checkAdmin, adminController.updateAdmin); // Atualizar admin (opcional)
router.put("/updateuser", checkToken, checkAdmin, adminController.updateUser);

router.delete("/userremove/:id", checkToken, checkAdmin, adminController.deleteUser); // Deletar aluno ou professor
router.delete("/turmaremove/:id", checkToken, checkAdmin, adminController.deleteTurma); // Deletar turma
router.delete("/adminremove/:id", checkToken, checkAdmin, adminController.deleteAdmin); // Deletar admin (opcional)


module.exports = router;