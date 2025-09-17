const mongoose = require("mongoose");

const alunoSchema = new mongoose.Schema({
    usuario: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, // Link com User
    matricula: { type: String, required: true, unique: true }, // Matrícula única
    turmas: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Turma' 
    }], // Turmas em que está matriculado
    dadosAcademicos: {
      curso: String,    // Ex: "Engenharia", "Administração"
      periodo: Number   // Ex: 1, 2, 3...
    }
  });

  module.exports = mongoose.model("UserAluno", alunoSchema, "userAluno"); 
