const UserAluno = require("../models/AlunoModel");


exports.getAlunos = async (req, res) => {

    try {

        const alunos = await UserAluno.find().populate('usuario').populate('turmas').populate('usuario.imagem');

        res.json(alunos);

    }
    catch (erro) {
        console.error("Erro ao procurar todos os profs!", erro.message);
    }


}