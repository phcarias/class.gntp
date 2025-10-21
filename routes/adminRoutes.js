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

router.get("/buscaraluno", checkToken, checkAdmin, adminController.getAlunosByName);

module.exports = router;