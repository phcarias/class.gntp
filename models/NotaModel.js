const mongoose = require('mongoose');

const notaSchema = new mongoose.Schema({
  aluno: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Aluno
  turma: { type: mongoose.Schema.Types.ObjectId, ref: 'Turma', required: true }, // Turma
  disciplina: { type: String, required: true }, // Ex.: "Matemática", "Português"
  nota: { type: Number, required: true, min: 0, max: 10 }, // Nota de 0 a 10
  tipoAvaliacao: { type: String, enum: ['prova', 'trabalho', 'atividade'], default: 'prova' }, // Tipo opcional
  data: { type: Date, default: Date.now }, // Data da avaliação
  dataRegistro: { type: Date, default: Date.now } // Quando foi registrada
});

module.exports = mongoose.model('Nota', notaSchema, 'notas');