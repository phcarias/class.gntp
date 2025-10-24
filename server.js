const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const app = express();

const emailRoutes = require("./routes/emailRoutes");
const pictureRouter = require("./routes/pictureRoutes");
const authRoutes = require("./routes/authRoutes");
const turmaRoutes = require("./routes/turmaRoutes")
const adminRoutes = require("./routes/adminRoutes")
const alunoRoutes = require('./routes/alunoRoutes');

dotenv.config();
require("./config/db");


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos
app.use("/turma", turmaRoutes);


app.use("/email", emailRoutes);
app.use("/pictures", pictureRouter);
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes); 
app.use("/turma", turmaRoutes);
app.use("/administrador", adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/aluno', alunoRoutes);


app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "login.html"));
});

app.get("/admin", (req,res) => {
    res.sendFile(path.join(__dirname, "public", "views", "administrador.html"));
});

app.get("/alunohtml", (req,res) => {
  res.sendFile(path.join(__dirname, "public", "views", "aluno_main.html"));
});



const porta = process.env.PORT || 9090;
app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} 👌`);
});