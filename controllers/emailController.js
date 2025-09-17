const createTransporter = require("../config/email");
const usuarios = [];

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

