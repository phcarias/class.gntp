const turmaSchema = require("../models/TurmaModel"); // Certifique-se de que o modelo está correto
const User = require("../models/UserModel");


//criação de turma feita, cria a turma e atualiza os professores para incluir a turma criada

exports.createTurma = async (req, res) => {
    const { codigo, disciplinas, professores, alunos, horarios, cargaHoraria, periodoLetivo, limiteFaltas, ativo } = req.body;

    // Validação de campos obrigatórios
    if (!codigo || !disciplinas || !professores || !cargaHoraria) {
        return res.status(400).json({ erro: "Código, disciplinas, professores e carga horária são obrigatórios" });
    }

    try {
        // Criação de uma nova turma
        const novaTurma = new turmaSchema({
            codigo,
            disciplinas: Array.isArray(disciplinas) ? disciplinas : [disciplinas],
            professores: Array.isArray(professores) ? professores : [professores],
            alunos: Array.isArray(alunos) ? alunos : [],
            horarios: Array.isArray(horarios) ? horarios : [],
            cargaHoraria: Number(cargaHoraria),
            periodoLetivo,
            limiteFaltas: limiteFaltas !== undefined ? Number(limiteFaltas) : 25,
            ativo: ativo !== undefined ? ativo : true
        });

        // Salvando a turma no banco de dados
        const turmaSalva = await novaTurma.save();

        // Atualizar cada professor para incluir a turma criada
        await User.updateMany(
            { _id: { $in: turmaSalva.professores }, type: "professor" },
            { $push: { "roleData.turmas": { turma: turmaSalva._id } } }
        );

        // Atualizar cada aluno para incluir a turma criada
        await User.updateMany(
            { _id: { $in: turmaSalva.alunos }, type: "aluno" },
            { $push: { "roleData.turmas": { turma: turmaSalva._id } } }
        );

        res.status(201).json(turmaSalva);

    } catch (error) {
        console.error("Erro ao criar turma:", error);
        res.status(500).json({ erro: "Erro ao criar turma", detalhes: error.message });
    }
};


exports.getTurmas = async (req, res) => {
    try {
        // Busca de todas as turmas com populações específicas
        const turmas = await turmaSchema.find();
        res.status(200).json(turmas);

    } catch (error) {
        console.error("Erro ao buscar turmas:", error); // Log para depuração
        res.status(500).json({ erro: "Erro ao buscar turmas", detalhes: error.message });
    }
};