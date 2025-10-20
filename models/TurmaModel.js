const mongoose = require("mongoose");

const turmaSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true }, // Código único da turma
  disciplina: { type: String, required: true },           // Nome da disciplina
  professor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Professor', 
    required: true 
  }, // Professor responsável
  alunos: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Aluno' 
  }], // Alunos matriculados
  horarios: [{
    diaSemana: { 
    type: String, 
    enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] 
    }, // Dia da semana
    horarioInicio: String, // Formato "HH:MM"
    horarioFim: String     // Formato "HH:MM"
  }],
  cargaHoraria: { type: Number, required: true }, // Carga horária total
  periodoLetivo: String,   // Ex: "2024.1", "2024/1"
  limiteFaltas: { type: Number, default: 25 }, // % máximo de faltas permitidas
  ative: { type: Boolean, default: true } // Indica se a turma está ativa
  });

module.exports = mongoose.model("Turma", turmaSchema, "turma");