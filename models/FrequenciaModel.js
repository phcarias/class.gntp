// ...existing code...
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FrequenciaSchema = new Schema({
  turma: { type: Schema.Types.ObjectId, ref: "Turma", required: true },
  aluno: { type: Schema.Types.ObjectId, ref: "User", required: true },
  professor: { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["presente", "falta"], required: true },
  data: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Frequencia", FrequenciaSchema);
// ...existing code...