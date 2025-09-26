const express = require("express");
const alunoController = require("../controllers/alunoController");

const router = express.Router();


router.get("/getalunos", alunoController.getAlunos);

module.exports = router