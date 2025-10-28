// ...existing code...
const Turma = require("../models/TurmaModel");
const Frequencia = require("../models/FrequenciaModel"); // cria abaixo se não existir
const User = require("../models/UserModel");

exports.createFrequencia = async (req, res) => {
  try {
    const { turmaId, registros, data } = req.body || {};
    if (!turmaId || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ msg: "turmaId e registros (array) são obrigatórios." });
    }

    const turma = await Turma.findById(turmaId);
    if (!turma) return res.status(404).json({ msg: "Turma não encontrada." });

    // opcional: professor vindo do auth middleware (req.user)
    const professorId = req.user ? req.user._id : undefined;
    const dia = data ? new Date(data) : new Date();

    const docs = registros.map(r => ({
      turma: turmaId,
      aluno: r.alunoId,
      status: r.status, // 'presente' | 'falta'
      data: dia,
      professor: professorId
    }));

    const inserted = await Frequencia.insertMany(docs);
    return res.status(201).json({ msg: "Frequências registradas.", inserted: inserted.length });
  } catch (err) {
    console.error("createFrequencia erro:", err && err.stack ? err.stack : err);
    return res.status(500).json({ msg: "Erro ao salvar frequências.", erro: err.message || err });
  }
};
// ...existing code...

// Listar frequências (com filtros opcionais por aluno, turma ou data)
exports.getFrequencias = async (req, res) => {
  const { aluno, turma, data } = req.query;

  try {
    const filtro = {};
    if (aluno) filtro.aluno = aluno;
    if (turma) filtro.turma = turma;
    if (data) filtro.data = new Date(data);

    const frequencias = await Frequencia.find(filtro).populate('aluno', 'name email').populate('turma', 'codigo');
    res.status(200).json(frequencias);
  } catch (error) {
    console.error('Erro ao buscar frequências:', error);
    res.status(500).json({ msg: 'Erro interno do servidor.' });
  }
};

// Atualizar uma frequência por ID
exports.updateFrequencia = async (req, res) => {
  const { id } = req.params;
  const { presente, justificativa, justificado } = req.body;

  try {
    const frequencia = await Frequencia.findByIdAndUpdate(
      id,
      { presente, justificativa, justificado },
      { new: true }
    );
    if (!frequencia) {
      return res.status(404).json({ msg: 'Frequência não encontrada.' });
    }
    res.status(200).json({ msg: 'Frequência atualizada com sucesso!', frequencia });
  } catch (error) {
    console.error('Erro ao atualizar frequência:', error);
    res.status(500).json({ msg: 'Erro interno do servidor.' });
  }
};

// Deletar uma frequência por ID
exports.deleteFrequencia = async (req, res) => {
  const { id } = req.params;

  try {
    const frequencia = await Frequencia.findByIdAndDelete(id);
    if (!frequencia) {
      return res.status(404).json({ msg: 'Frequência não encontrada.' });
    }
    res.status(200).json({ msg: 'Frequência deletada com sucesso!' });
  } catch (error) {
    console.error('Erro ao deletar frequência:', error);
    res.status(500).json({ msg: 'Erro interno do servidor.' });
  }
};