const express = require("express");
const userController = require("../controllers/userController");
const authMid = require("../middlewares/authMiddleware");


const router = express.Router();

// Define rotas de usuário
router.get("/public/:id", userController.getUserPublic);     // Rota pública
router.get("/private/:id", authMid.checkToken, userController.getUserPrivate); // Rota privada com autenticação
router.get("/findall", userController.getAllUsers); // rota para buscar todos usuarios


module.exports = router;