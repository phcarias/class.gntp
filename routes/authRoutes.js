const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

// Define rotas de autenticação
router.post("/register", authController.register); // Rota de registro
router.post("/login", authController.login);       // Rota de login

module.exports = router;