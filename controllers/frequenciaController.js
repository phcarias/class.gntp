const Frequencia = require('../models/FrequenciaModel');
const User = require('../models/UserModel');
const Turma = require('../models/TurmaModel');

// Criar um novo registro de frequência
exports.createFrequencia = async (req, res) => {
  const { aluno, turma, data, presente, justificativa, justificado } = req.body;

  // Validações básicas
  if (!aluno || !turma || !data) {
    return res.status(400).json({ msg: 'Campos obrigatórios: aluno, turma e data.' });
  }

  try {
    // Verificar se aluno e turma existem
    const alunoExists = await User.findById(aluno);
    const turmaExists = await Turma.findById(turma);
    if (!alunoExists || !turmaExists) {
      return res.status(404).json({ msg: 'Aluno ou turma não encontrados.' });
    }

    const novaFrequencia = new Frequencia({
      aluno,
      turma,
      data,
      presente,
      justificativa,
      justificado
    });

    await novaFrequencia.save();
    res.status(201).json({ msg: 'Frequência registrada com sucesso!', frequencia: novaFrequencia });
  } catch (error) {
    console.error('Erro ao criar frequência:', error);
    res.status(500).json({ msg: 'Erro interno do servidor.' });
  }
};

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