const UserProfessor = require("../models/ProfessorModel");

exports.getAllProfs = async (req, res) => {

    try {
        const professor = await UserProfessor.find().populate('usuario').populate('usuario.imagem').populate('turmas')
        res.json(professor)
    }
    catch (erro) {
        console.error("Erro ao procurar todos os profs!", erro.message);
    }

}

exports.attTurmaProf = async (req, res) => {

    const { professor_id, turma_id } = req.body;

    if (!id || !professor_id || !turma_id) {
        return res.status(400).json({ erro: "Professor e turma são necessarios!" })
    }

    try {
        const turmaAtualizada = await turminha.findByIdAndUpdate(turma_id,
            { professor_id, turma_id },
            { new: true, runValidators: true }).populate('professor');

        if (!turmaAtualizada) {
            return res.status(404).json({ erro: "produto não encontrada" });
        }
    }
    catch (error) 
    {
        res.status(500).json({ erro: "Erro ao criar turma", error });
    }

}
