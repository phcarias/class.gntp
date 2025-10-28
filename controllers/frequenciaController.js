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
  try {
    const { frequenciaId } = req.params;
    const { status, data } = req.body;

    if (!frequenciaId) {
      return res.status(400).json({ msg: "O ID da frequência é obrigatório." });
    }

    const updated = await Frequencia.findByIdAndUpdate(
      frequenciaId,
      { status, data },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ msg: "Frequência não encontrada." });
    }

    return res.status(200).json({ msg: "Frequência atualizada com sucesso.", updated });
  } catch (error) {
    console.error("Erro ao atualizar frequência:", error);
    return res.status(500).json({ msg: "Erro ao atualizar frequência.", error });
  }
};

// Deletar uma frequência por ID
exports.deleteFrequencia = async (req, res) => {
  try {
    const { frequenciaId } = req.params;

    if (!frequenciaId) {
      return res.status(400).json({ msg: "O ID da frequência é obrigatório." });
    }

    const deleted = await Frequencia.findByIdAndDelete(frequenciaId);

    if (!deleted) {
      return res.status(404).json({ msg: "Frequência não encontrada." });
    }

    return res.status(200).json({ msg: "Frequência deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar frequência:", error);
    return res.status(500).json({ msg: "Erro ao deletar frequência.", error });
  }
};

exports.getFrequenciasByTurma = async (req, res) => {
  try {
    const { turmaId } = req.params;

    if (!turmaId) {
      return res.status(400).json({ msg: "O ID da turma é obrigatório." });
    }

    const frequencias = await Frequencia.find({ turma: turmaId })
      .populate("aluno", "nome email") // Popula os dados do aluno
      .populate("professor", "nome email") // Popula os dados do professor
      .sort({ data: -1 }); // Ordena pela data (mais recente primeiro)

    return res.status(200).json(frequencias);
  } catch (error) {
    console.error("Erro ao buscar frequências por turma:", error);
    return res.status(500).json({ msg: "Erro ao buscar frequências por turma.", error });
  }
};