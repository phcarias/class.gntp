const express = require("express");
const router = express('router')
const turmaController = require("../controllers/turmaController")

router.post("/criarturma", turmaController.createTurma);

module.exports = router;

