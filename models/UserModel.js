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

module.exports = mongoose.model("User", userSchema, "user");

