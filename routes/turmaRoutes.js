const express = require("express");
const router = express('router')
const turmaController = require("../controllers/turmaController")

router.post("/criarturma", turmaController.createTurma);
router.get("/getturmas", turmaController.getTurmas);

module.exports = router;

