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

// Middleware de pré-exclusão para limpeza de referências
turmaSchema.pre('remove', async function(next) {
  const turma = this;
  const User = mongoose.model('User');
  const Frequencia = mongoose.model('Frequencia');

  try {
    // Remover referências de User.roleData.turmas para alunos e professores
    await User.updateMany(
      { 'roleData.turmas.turma': turma._id },
      { $pull: { 'roleData.turmas': { turma: turma._id } } }
    );
    // Remover registros de frequência da turma
    await Frequencia.deleteMany({ turma: turma._id });
    next();
  } catch (error) {
    console.error('Erro no middleware de exclusão de turma:', error);
    next(error);
  }
});

module.exports = mongoose.model("Turma", turmaSchema, "turma");