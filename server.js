const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require('path');
const app = express();
const cron = require('node-cron');
const reportController = require('./controllers/reportController');


const emailRoutes = require("./routes/emailRoutes");
const pictureRouter = require("./routes/pictureRoutes");
const authRoutes = require("./routes/authRoutes");
const turmaRoutes = require("./routes/turmaRoutes")
const adminRoutes = require("./routes/adminRoutes")
const alunoRoutes = require('./routes/alunoRoutes');
const frequenciaRoutes = require('./routes/frequenciaRoutes');
const notaRoutes = require('./routes/notaRoutes');
const reportRoutes = require('./routes/reportRoutes');

dotenv.config();
require("./config/db");


app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Arquivos estáticos


app.use("/email", emailRoutes);
app.use("/pictures", pictureRouter);
app.use("/uploads", express.static("uploads"));
app.use("/auth", authRoutes); 
app.use("/turma", turmaRoutes);
app.use("/administrador", adminRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/aluno', alunoRoutes);
app.use('/frequencia', frequenciaRoutes);
app.use('/nota', notaRoutes);
app.use('/relatorios', reportRoutes);


app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "login.html"));
});

app.get("/admin", (req,res) => {
    res.sendFile(path.join(__dirname, "public", "views", "administrador.html"));
});

app.get("/alunohtml", (req,res) => {
  res.sendFile(path.join(__dirname, "public", "views", "aluno_main.html"));
});

app.get("/professorhtml", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "views", "professor_main.html"));
});


cron.schedule('37 2 * * *', async () => {
    console.log('[CRON] Iniciando verificação automática de frequência e notas...');
    try {
        // Simular req e res para o método do controller
        const req = { body: {} }; // Sem parâmetros adicionais
        const res = {
            status: (code) => ({
                json: (data) => {
                    console.log(`[CRON] Resposta (${code}):`, data);
                }
            })
        };
        await reportController.verificarFrequenciaENotasEEnviarAvisos(req, res);
        console.log('[CRON] Verificação concluída com sucesso.');
    } catch (error) {
        console.error('[CRON] Erro na verificação:', error);
    }
}, {
    timezone: "America/Sao_Paulo" // Ajuste para seu fuso horário (ex.: UTC-3)
});


const porta = process.env.PORT || 9090;
app.listen(porta, () => {
  console.log(`Servidor rodando na porta ${porta} 👌`);
});