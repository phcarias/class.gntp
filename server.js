const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const app = express();

const emailRoutes = require("./routes/emailRoutes");
const pictureRouter = require("./routes/pictureRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");



dotenv.config();
require("./config/db");


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos

app.use("/", emailRoutes);
app.use("/pictures", pictureRouter);
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes);    // Rotas de autenticação
app.use("/user", userRoutes);    // Rotas de usuário
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} 👌`);
});