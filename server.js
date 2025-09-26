const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const app = express();

const emailRoutes = require("./routes/emailRoutes");
const pictureRouter = require("./routes/pictureRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const alunoRoutes = require("./routes/alunoRoutes");
const professorRoutes = require("./routes/professorRoutes")
const turmaRoutes = require("./routes/turmaRoutes")


dotenv.config();
require("./config/db");


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos

app.use("/", emailRoutes);
app.use("/pictures", pictureRouter);
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes); 
app.use("/user", userRoutes); 
app.use("/aluno", alunoRoutes);
app.use("/professor", professorRoutes);
app.use("/turma", turmaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} 👌`);
});