// ...existing code...
const nodemailer = require("nodemailer");

function createTransporter() {
  const host = (process.env.SMTP_HOST || "").trim();
  const port = Number(process.env.SMTP_PORT || 0);
  const user = (process.env.SMTP_USER || "").trim();
  const pass = (process.env.SMTP_PASS || "").trim();
  const secure = port === 465; // true para 465

  if (!host || !port) {
    console.error("email config: SMTP_HOST ou SMTP_PORT não configurado.");
    return null;
  }

  if (!user || !pass) {
    console.error("email config: SMTP_USER ou SMTP_PASS ausente. Não será possível enviar e-mails.");
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: { rejectUnauthorized: false } // opcional para evitar erros em alguns ambientes
  });

  // verifica transportador na inicialização (opcional)
  transporter.verify().then(() => {
    console.log("Transportador SMTP verificado.");
  }).catch(err => {
    console.error("Falha ao verificar transportador SMTP:", err && err.message ? err.message : err);
  });

  return transporter;
}

module.exports = createTransporter;
// ...existing code...


