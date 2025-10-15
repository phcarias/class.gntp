const express = require("express");
const router = express.Router();
const { checkToken, checkAdmin } = require("../middlewares/authMiddleware");
const { getAllUsers } = require("../controllers/userController");

// Rota protegida para administradores
//router.get("/admin/users", checkToken, checkAdmin, getAllUsers);

// Rota protegida para qualquer usuário autenticado
//router.get("/profile", checkToken, (req, res) => {
//res.json({ msg: "Bem-vindo à área protegida!", user: req.user });
//});

module.exports = router;