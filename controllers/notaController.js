const Nota = require('../models/NotaModel');
const User = require('../models/UserModel');
const Turma = require('../models/TurmaModel');

exports.createNota = async (req, res) => {
  const { aluno, turma, disciplina, nota, tipoAvaliacao } = req.body;
  if (!aluno || !turma || !disciplina || nota === undefined) {
    return res.status(400).json({ msg: 'Campos obrigatórios: aluno, turma, disciplina e nota.' });
  }
  try {
    const alunoExists = await User.findById(aluno);
    const turmaExists = await Turma.findById(turma);
    if (!alunoExists || !turmaExists) {
      return res.status(404).json({ msg: 'Aluno ou turma não encontrados.' });
    }
    const novaNota = new Nota({ aluno, turma, disciplina, nota, tipoAvaliacao });
    await novaNota.save();
    res.status(201).json({ msg: 'Nota registrada com sucesso!', nota: novaNota });
  } catch (error) {
    res.status(500).json({ msg: 'Erro interno.', error });
  }
};

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