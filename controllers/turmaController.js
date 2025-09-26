const turmaSchema = require("../models/TurmaModel");


exports.createTurma = async (req, res) => {
    const { codigo, disciplina, professor, alunos, horarios, cargaHoraria, periodoLetivo, limiteFaltas } = req.body;

    if (!codigo || !disciplina || !professor || !cargaHoraria) {
        return res.status(400).json({ erro: "Código, disciplina, professor e carga horária são obrigatórios" });
    }

    try {
        const novaTurma = new turmaSchema({
            codigo,
            disciplina,
            professor,
            alunos: alunos || [],
            horarios: horarios || [],
            cargaHoraria: Number(cargaHoraria),
            periodoLetivo: periodoLetivo || "",
            limiteFaltas: Number(limiteFaltas) || 25
        });

        await novaTurma.save();        
        
        if (novaTurma)
        {
            const attprof = exports.attTurmaProf()

        }

        res.status(201).json(novaTurma);

    } catch (error) {
        res.status(500).json({ erro: "Erro ao criar turma", error });
    }
};