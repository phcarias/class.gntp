const express = require("express");
const professorController = require("../controllers/professorController");

const router = express.Router();

router.get("/getallprofs", professorController.getAllProfs);
router.get("/attturmaprof", professorController.attTurmaProf);

module.exports = router;