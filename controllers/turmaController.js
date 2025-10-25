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
        const turmas = await turmaSchema.find()
            .populate('professores', 'name')  // Popula nomes dos professores
            .populate('alunos', 'name');     // Popula nomes dos alunos (para contar)
        res.status(200).json(turmas);

    } catch (error) {
        console.error("Erro ao buscar turmas:", error); // Log para depuração
        res.status(500).json({ erro: "Erro ao buscar turmas", detalhes: error.message });
    }
};


exports.updateTurma = async (req, res) => {
    const { id } = req.params;
    const { codigo, disciplinas, professores, alunos, horarios, cargaHoraria, periodoLetivo, limiteFaltas, ativo } = req.body;

    // Validação de campos obrigatórios
    if (!codigo || !disciplinas || !professores || !cargaHoraria) {
        return res.status(400).json({ erro: "Código, disciplinas, professores e carga horária são obrigatórios" });
    }

    try {
        // Buscar a turma atual
        const turmaAtual = await turmaSchema.findById(id);
        if (!turmaAtual) {
            return res.status(404).json({ erro: "Turma não encontrada" });
        }

        // Preparar novos valores
        const novosProfessores = Array.isArray(professores) ? professores : [professores];
        const novosAlunos = Array.isArray(alunos) ? alunos : [];

        // Encontrar diferenças para professores
        const professoresAtuais = turmaAtual.professores.map(p => p.toString());
        const professoresAdicionados = novosProfessores.filter(p => !professoresAtuais.includes(p));
        const professoresRemovidos = professoresAtuais.filter(p => !novosProfessores.includes(p));

        // Encontrar diferenças para alunos
        const alunosAtuais = turmaAtual.alunos.map(a => a.toString());
        const alunosAdicionados = novosAlunos.filter(a => !alunosAtuais.includes(a));
        const alunosRemovidos = alunosAtuais.filter(a => !novosAlunos.includes(a));

        // Atualizar a turma
        turmaAtual.codigo = codigo;
        turmaAtual.disciplinas = Array.isArray(disciplinas) ? disciplinas : [disciplinas];
        turmaAtual.professores = novosProfessores;
        turmaAtual.alunos = novosAlunos;
        turmaAtual.horarios = Array.isArray(horarios) ? horarios : [];
        turmaAtual.cargaHoraria = Number(cargaHoraria);
        turmaAtual.periodoLetivo = periodoLetivo; // Deve ser {dataInicio, dataFim}
        turmaAtual.limiteFaltas = limiteFaltas !== undefined ? Number(limiteFaltas) : 25;
        turmaAtual.ativo = ativo !== undefined ? ativo : true;

        await turmaAtual.save();

        // Sincronizar professores: remover da lista antiga e adicionar à nova
        if (professoresRemovidos.length > 0) {
            await User.updateMany(
                { _id: { $in: professoresRemovidos }, type: "professor" },
                { $pull: { "roleData.turmas": { turma: turmaAtual._id } } }
            );
        }
        if (professoresAdicionados.length > 0) {
            await User.updateMany(
                { _id: { $in: professoresAdicionados }, type: "professor" },
                { $push: { "roleData.turmas": { turma: turmaAtual._id } } }
            );
        }

        // Sincronizar alunos: remover da lista antiga e adicionar à nova
        if (alunosRemovidos.length > 0) {
            await User.updateMany(
                { _id: { $in: alunosRemovidos }, type: "aluno" },
                { $pull: { "roleData.turmas": { turma: turmaAtual._id } } }
            );
        }
        if (alunosAdicionados.length > 0) {
            await User.updateMany(
                { _id: { $in: alunosAdicionados }, type: "aluno" },
                { $push: { "roleData.turmas": { turma: turmaAtual._id } } }
            );
        }

        res.status(200).json({ msg: "Turma atualizada com sucesso!", turma: turmaAtual });

    } catch (error) {
        console.error("Erro ao atualizar turma:", error);
        res.status(500).json({ erro: "Erro ao atualizar turma", detalhes: error.message });
    }
};

