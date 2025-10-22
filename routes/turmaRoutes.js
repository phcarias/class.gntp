const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const User = require("../models/UserModel"); // Modelo de Usuário
const Turma = require("../models/TurmaModel"); // Modelo de Turma
const turmaController = require("../controllers/turmaController");

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
    const { diaSemana } = req.query;

    try {
        let turmas;
        if (diaSemana) {
            // Filtra as turmas pelo dia da semana
            turmas = await Turma.find({ "horarios.diaSemana": diaSemana });
        } else {
            // Retorna todas as turmas se o dia da semana não for fornecido
            turmas = await Turma.find();
        }

        res.status(200).json(turmas);
    } catch (error) {
        console.error("Erro ao listar turmas:", error);
        res.status(500).json({ erro: "Erro ao listar turmas", detalhes: error.message });
    }
});

router.get("/detalhes/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const turma = await Turma.findById(id)
            .populate("professores", "name email") // Popula os professores com nome e email
            .populate("alunos", "name email"); // Popula os alunos com nome e email

        if (!turma) {
            return res.status(404).json({ erro: "Turma não encontrada" });
        }

        res.status(200).json(turma);
    } catch (error) {
        console.error("Erro ao buscar detalhes da turma:", error);
        res.status(500).json({ erro: "Erro ao buscar detalhes da turma", detalhes: error.message });
    }
});



router.post("/salvar-frequencia", async (req, res) => {
    const { turmaId, frequencia } = req.body;

    if (!turmaId || !frequencia) {
        return res.status(400).json({ erro: "Turma e frequência são obrigatórios." });
    }

    try {
        const turma = await Turma.findById(turmaId);
        if (!turma) {
            return res.status(404).json({ erro: "Turma não encontrada." });
        }

        // Atualiza a frequência dos alunos (exemplo: salva no MongoDB)
        frequencia.forEach(({ alunoId, status }) => {
            const aluno = turma.alunos.find(a => a._id.toString() === alunoId);
            if (aluno) {
                aluno.frequencia = status; // Adiciona o status de frequência
            }
        });

        await turma.save();
        res.status(200).json({ mensagem: "Frequência salva com sucesso." });
    } catch (error) {
        console.error("Erro ao salvar frequência:", error);
        res.status(500).json({ erro: "Erro ao salvar frequência.", detalhes: error.message });
    }
});

module.exports = router;

router.post("/criarturma", turmaController.createTurma);
router.get("/getturmas", turmaController.getTurmas);


