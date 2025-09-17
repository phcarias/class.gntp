const mongoose = require('mongoose');

const professorSchema = new mongoose.Schema({
    usuario: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }, // Link com User
    matricula: { type: String, required: true, unique: true }, // Matrícula única
    disciplinas: [{ type: String }], // Lista de disciplinas que pode lecionar
    turmas: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Turma' 
    }] // Turmas que leciona
  });

 module.exports = mongoose.model("UserProfessor", professorSchema, "userProfessor");