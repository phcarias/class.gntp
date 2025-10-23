const createTransporter = require("../config/email");
const usuarios = [];
const Turma = require("../models/TurmaModel");
const user = require("../models/UserModel");

exports.registrar = async (req, res) => {
  const { nome, email } = req.body;
  // ...existing code...
  if (!nome || !email) {
    return res.status(400).json({ msg: "Nome e e-mail são obrigatórios." });
  }
  if (usuarios.find((u) => u.email === email)) {
    return res.status(400).json({ msg: "E-mail já cadastrado." });
  }
  usuarios.push({ nome, email });

  try {
    const transportador = createTransporter();
    await transportador.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Bem-vindo!",
      text: `Olá ${nome}, obrigado por se registrar!!!!!!`,
      html: `<h2>Olá ${nome},</h2><p>Obrigado por se registrar!!!!!!</p>`,
    });
  } catch (erro) {
    console.error("Erro ao enviar e-mail de boas-vindas:", erro.message);
  }

  res.status(201).json({ msg: "Usuário registrado e e-mail enviado!" });
};

exports.enviarEmail = async (req, res) => {
  const { para, assunto, texto, html } = req.body;
  // ...existing code...
  if (!para || !assunto || (!texto && !html)) {
    return res
      .status(400)
      .json({ msg: "Campos obrigatórios: para, assunto e texto ou html." });
  }
  try {
    const transportador = createTransporter();
    const info = await transportador.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: para,
      subject: assunto,
      text: texto,
      html,
    });
    res.status(200).json({ msg: "E-mail enviado com sucesso!", info });
  } catch (erro) {
    res.status(500).json({ msg: "Erro ao enviar e-mail", erro: erro.message });
  }
};







exports.enviarAviso = async (req, res) => {
  console.log("entrada enviarAviso - body:", req.body, "headers:", req.headers && {
    authorization: req.headers.authorization
  });

  const { turmaId, subject, message, tipo } = req.body || {};
  if (!turmaId || !subject || !message) {
    console.warn("enviarAviso - payload inválido", { turmaId, subject, hasMessage: !!message });
    return res.status(400).json({ msg: "turmaId, subject e message são obrigatórios." });
  }

  try {
    const turma = await Turma.findById(turmaId).populate("alunos", "email name");
    if (!turma) {
      console.warn("enviarAviso - turma não encontrada:", turmaId);
      return res.status(404).json({ msg: "Turma não encontrada." });
    }

    const destinatarios = (turma.alunos || [])
      .map(a => a.email && a.email.trim())
      .filter(Boolean);

    if (destinatarios.length === 0) {
      console.warn("enviarAviso - nenhum email válido na turma:", turmaId);
      return res.status(400).json({ msg: "Nenhum e-mail de aluno disponível nesta turma." });
    }

    const transportador = createTransporter();
    if (!transportador) {
      console.error("enviarAviso - transporter não criado. verifique config/email e variáveis de ambiente.");
      return res.status(500).json({ msg: "Configuração de e-mail inválida no servidor." });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: destinatarios.join(","),
      subject,
      text: message,
      html: `<p>${message}</p>`
    };

    try {
      const info = await transportador.sendMail(mailOptions);
      console.log("enviarAviso - e-mail enviado:", info);
      res.status(200).json({ msg: "E-mail de aviso enviado com sucesso!", info });
    } catch (err) {
      console.error("enviarAviso - erro:", err && err.stack ? err.stack : err);
      res.status(500).json({ msg: "Erro ao enviar e-mail de aviso.", erro: err.message || err });
    }
  } catch (err) {
    console.error("enviarAviso - erro inesperado:", err && err.stack ? err.stack : err);
    res.status(500).json({ msg: "Erro interno ao processar aviso.", erro: err.message || err });
  }   
}