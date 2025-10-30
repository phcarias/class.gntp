// ...existing code...
const Turma = require("../models/TurmaModel");
const User = require("../models/UserModel");
const Nota = require("../models/NotaModel");
const emailController = require("./emailController");

exports.createNota = async (req, res) => {
  try {
    console.log("createNota - body:", req.body, "user:", req.user && req.user._id);

    const professorId = req.user ? req.user._id : null;
    const { turmaId, alunoId, disciplina, nota, tipoAvaliacao, data } = req.body || {};

    if (!turmaId || !alunoId || typeof disciplina === "undefined" || typeof nota === "undefined") {
      return res.status(400).json({ msg: "turmaId, alunoId, disciplina e nota são obrigatórios." });
    }

    const valor = Number(nota);
    if (Number.isNaN(valor) || valor < 0 || valor > 10) {
      return res.status(400).json({ msg: "nota inválida. Deve ser número entre 0 e 10." });
    }

    const turma = await Turma.findById(turmaId);
    if (!turma) return res.status(404).json({ msg: "Turma não encontrada." });

    // valida se aluno pertence à turma (se turma.alunos existir)
    if (Array.isArray(turma.alunos) && turma.alunos.length) {
      const pertence = turma.alunos.some(a => {
        if (!a) return false;
        if (typeof a === "string") return String(a) === String(alunoId);
        if (typeof a === "object") return String(a._id || a.id) === String(alunoId);
        return false;
      });
      if (!pertence) {
        return res.status(400).json({ msg: "Aluno não pertence à turma informada." });
      }
    }

    const doc = await Nota.create({
      turma: turmaId,
      aluno: alunoId,
      disciplina: String(disciplina),
      nota: valor,
      tipoAvaliacao: tipoAvaliacao || "prova",
      data: data ? new Date(data) : new Date(),
      dataRegistro: new Date()
    });

    // Após criar a nota, popular dados para o e-mail
    const populatedNota = await Nota.findById(doc._id).populate('aluno', 'name email roleData').populate('turma', 'codigo');
    const aluno = populatedNota.aluno;

    // Enviar e-mail de notificação (não bloquear se falhar)
    try {
      await emailController.sendNotaNotification({
        username: 'Sistema',
        nota: populatedNota,
        aluno: aluno,
        responsavelEmail: aluno.roleData?.responsavelEmail
      });
    } catch (emailError) {
      console.error('Erro ao enviar e-mail de notificação de nota:', emailError);
      // Não retorna erro para o usuário, apenas loga
    }


    return res.status(201).json({ msg: "Nota registrada.", nota: doc });
  } catch (err) {
    console.error("createNota erro:", err && err.stack ? err.stack : err);
    return res.status(500).json({ msg: "Erro ao salvar nota.", erro: err.message || err });
  }
};
// ...existing code...

exports.getNotas = async (req, res) => {
  const { aluno, turma, disciplina } = req.query;
  try {
    const filtro = {};
    if (aluno) filtro.aluno = aluno;
    if (turma) filtro.turma = turma;
    if (disciplina) filtro.disciplina = disciplina;
    const notas = await Nota.find(filtro).populate('aluno', 'name').populate('turma', 'codigo');
    res.status(200).json(notas);
  } catch (error) {
    res.status(500).json({ msg: 'Erro interno.', error });
  }
};

// Adicione updateNota e deleteNota similares aos de frequência
exports.updateNota = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    const nota = await Nota.findByIdAndUpdate(id, updates, { new: true });
    if (!nota) return res.status(404).json({ msg: 'Nota não encontrada.' });
    res.status(200).json({ msg: 'Nota atualizada!', nota });
  } catch (error) {
    res.status(500).json({ msg: 'Erro interno.', error });
  }
};

exports.deleteNota = async (req, res) => {
  const { id } = req.params;
  try {
    const nota = await Nota.findByIdAndDelete(id);
    if (!nota) return res.status(404).json({ msg: 'Nota não encontrada.' });
    res.status(200).json({ msg: 'Nota deletada!' });
  } catch (error) {
    res.status(500).json({ msg: 'Erro interno.', error });
  }
};