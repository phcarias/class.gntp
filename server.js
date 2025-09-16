const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const app = express();


dotenv.config();
require("./config/db");


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos



const porta = process.env.PORT || 3000;
app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} 👌`);
});