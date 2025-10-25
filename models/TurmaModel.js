const mongoose = require("mongoose");

const turmaSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true }, // Código único da turma
  disciplinas: [{ type: String, required: true }],        // Lista de nomes das disciplinas
  professores: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', // Referencia o modelo User
    required: true 
  }], // Professores responsáveis (type: 'professor' no modelo User)
  alunos: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' // Referencia o modelo User
  }], // Alunos matriculados (type: 'aluno' no modelo User)
  horarios: [{
    diaSemana: { 
      type: String, 
      enum: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'] 
    }, // Dia da semana
    horarioInicio: String, // Formato "HH:MM"
    horarioFim: String     // Formato "HH:MM"
  }],
  cargaHoraria: { type: Number, required: true }, // Carga horária total
  periodoLetivo: { 
    dataInicio: { type: Date, required: true }, // Data de início do período letivo
    dataFim: { type: Date, required: true }     // Data de término do período letivo
  },
  limiteFaltas: { type: Number, default: 25 }, // % máximo de faltas permitidas
  ativo: { type: Boolean, default: true } // Indica se a turma está ativa
});

module.exports = mongoose.model("Turma", turmaSchema, "turma");