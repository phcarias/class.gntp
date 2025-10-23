const express = require("express");
const router = express.Router();
const emailController = require("../controllers/emailController");

// ...existing code...

// Registrar rotas explícitas (mantém compatibilidade)
router.post("/registrar", emailController.registrar);
router.post("/enviar-aviso", emailController.enviarAviso);

// Único endpoint público /enviar-email — delega conforme payload
router.post("/enviar-email", async (req, res, next) => {
  console.log("POST /email/enviar-email - headers:", req.headers);
  console.log("POST /email/enviar-email - body:", req.body);

  try {
    const body = req.body || {};

    // Se o frontend enviar turmaId -> encaminha para enviarAviso (aviso para turma)
    if (body.turmaId) {
      return emailController.enviarAviso(req, res, next);
    }

    // Caso contrário, encaminha para o handler genérico enviarEmail
    return emailController.enviarEmail(req, res, next);
  } catch (err) {
    console.error("Erro na rota /email/enviar-email:", err);
    return res.status(500).json({ error: "Erro interno na rota de e-mail." });
  }
});

module.exports = router;