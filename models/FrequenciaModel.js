const mongoose = require("mongoose");

const frequenciaSchema = new mongoose.Schema({
    aluno: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Aluno', 
      required: true 
    }, // Aluno referente
    turma: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Turma', 
      required: true 
    }, // Turma referente
    data: { type: Date, required: true },        // Data da aula
    presente: { type: Boolean, default: false }, // Status de presença
    justificativa: String,      // Motivo da falta (se houver)
    justificado: { type: Boolean, default: false }, // Se falta foi justificada
    dataRegistro: { type: Date, default: Date.now } // Quando foi registrada
  });

module.exports = mongoose.model("Frequencia", frequenciaSchema, "frequencia");