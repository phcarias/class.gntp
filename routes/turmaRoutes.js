const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/UserModel"); // Modelo de Usuário
const Turma = require("../models/TurmaModel"); // Modelo de Turma

// Rota para listar professores
router.get("/professores", async (req, res) => {
    try {
        const professores = await User.find({ type: "professor" }, "_id name email"); // Filtra usuários do tipo professor
        res.status(200).json(professores);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar professores", detalhes: error.message });
    }
});

// Rota para listar alunos
router.get("/alunos", async (req, res) => {
    try {
        const alunos = await User.find({ type: "aluno" }, "_id name email"); // Filtra usuários do tipo aluno
        res.status(200).json(alunos);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar alunos", detalhes: error.message });
    }
});

// Rota para listar turmas
router.get("/listar", async (req, res) => {
    try {
        const turmas = await Turma.find();
        console.log("Turmas encontradas no banco de dados:", turmas); // Verifica os dados no terminal
        res.status(200).json(turmas);
    } catch (error) {
        console.error("Erro ao listar turmas:", error); // Verifica erros no terminal
        res.status(500).json({ erro: "Erro ao listar turmas", detalhes: error.message });
    }
});

module.exports = router;

