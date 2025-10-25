const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  password: {
    type: String,
    required: true,
    select: true,
  },

  type: {
    type: String,
    enum: ['admin', 'professor', 'aluno'],
    required: true,
  }, // Tipo de usuário

  active: { type: Boolean, default: true }, // Usuário ativo ou inativo

  imagem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Picture',
  },

  roleData: {
    type: mongoose.Schema.Types.Mixed, // Permite armazenar dados específicos de cada tipo
    default: {}, // Inicializa como um objeto vazio
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware de pré-exclusão para limpeza de referências
userSchema.pre('remove', async function(next) {
  const user = this;
  const Turma = mongoose.model('Turma');
  const Frequencia = mongoose.model('Frequencia');

  try {
    if (user.type === 'aluno') {
      // Remover aluno de Turma.alunos
      await Turma.updateMany({ alunos: user._id }, { $pull: { alunos: user._id } });
      // Remover registros de frequência do aluno
      await Frequencia.deleteMany({ aluno: user._id });
    } else if (user.type === 'professor') {
      // Remover professor de Turma.professores
      await Turma.updateMany({ professores: user._id }, { $pull: { professores: user._id } });
    }
    next();
  } catch (error) {
    console.error('Erro no middleware de exclusão de usuário:', error);
    next(error);
  }
});

module.exports = mongoose.model("User", userSchema, "user");

