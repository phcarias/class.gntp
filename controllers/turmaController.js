const turmaSchema = require("../models/TurmaModel"); // Certifique-se de que o modelo está correto

exports.createTurma = async (req, res) => {
    const { codigo, disciplina, professor, alunos, horarios, cargaHoraria, periodoLetivo, limiteFaltas, ativo } = req.body;

    // Validação de campos obrigatórios
    if (!codigo || !disciplina || !professor || !cargaHoraria) {
        return res.status(400).json({ erro: "Código, disciplina, professor e carga horária são obrigatórios" });
    }

    try {
        // Criação de uma nova turma
        const novaTurma = new turmaSchema({
            codigo,
            disciplina,
            professor,
            alunos: Array.isArray(alunos) ? alunos : [], // Garante que alunos seja um array
            horarios: Array.isArray(horarios) ? horarios : [], // Garante que horários seja um array
            cargaHoraria: Number(cargaHoraria),
            periodoLetivo: periodoLetivo || "", // Valor padrão para período letivo
            limiteFaltas: limiteFaltas !== undefined ? Number(limiteFaltas) : 25, // Valor padrão para limite de faltas
            ativo: ativo !== undefined ? ativo : true // Valor padrão para ativo
        });

        // Salvando a turma no banco de dados
        const turmaSalva = await novaTurma.save();

        res.status(201).json(turmaSalva);

    } catch (error) {
        console.error("Erro ao criar turma:", error); // Log para depuração
        res.status(500).json({ erro: "Erro ao criar turma", detalhes: error.message });
    }
};

exports.getTurmas = async (_, res) => {
    try {
        // Busca de todas as turmas com populações específicas
        const turmas = await turmaSchema.find()
            .populate('professor', 'nome email') // Popula professor com os campos nome e email
            .populate('alunos', 'nome matricula') // Popula alunos com os campos nome e matrícula
            .select('-__v'); // Exclui o campo __v da resposta

        res.status(200).json(turmas);

    } catch (error) {
        console.error("Erro ao buscar turmas:", error); // Log para depuração
        res.status(500).json({ erro: "Erro ao buscar turmas", detalhes: error.message });
    }
};