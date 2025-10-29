const createTransporter = require("../config/email");
const usuarios = [];
const Turma = require("../models/TurmaModel");
const user = require("../models/UserModel");
const fs = require('fs');
const path = require('path');

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

exports.sendWarn = async (req, res) => {
  const { username, para, assunto, texto, html } = req.body;
  // ...existing code...
  if (!para || !assunto || (!texto && !html)) {
    return res
      .status(400)
      .json({ msg: "Campos obrigatórios: para, assunto e texto ou html." });
  }

  // Ajuste para aceitar múltiplos destinatários: se 'para' for uma string, converte para array; se já for array, usa diretamente
  const destinatarios = Array.isArray(para) ? para : [para];
  const emailsValidos = destinatarios.filter(email => email && email.trim()).join(",");

  if (!emailsValidos) {
    return res.status(400).json({ msg: "Nenhum e-mail válido fornecido." });
  }
  try {
    const transportador = createTransporter();
    const imagePath = path.join(__dirname, '../public/img/logo_v2.jpeg');
    let attachments = [];
    if (fs.existsSync(imagePath)) {
      attachments.push({
        filename: 'logo_v2.jpeg',
        path: imagePath,
        cid: 'logo@cid'
      });
    }
    let emailHtml = html;
    if (emailHtml) {
      const name = req.body.username;
      emailHtml += `<div style="margin-top: 20px; text-align: center;"><img src="cid:logo@cid" alt="sistemlogo" style="height: 50px; vertical-align: middle;"> <span style="vertical-align: middle;">Enviado por: ${name}</span></div>`;
    }
    const info = await transportador.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emailsValidos,
      subject: assunto,
      text: texto,
      html: emailHtml,
      attachments: attachments
    });

    console.log(info);
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

exports.enviarParaDestinatarios = async (req, res) => {
  const { destinatarios, assunto, texto, html } = req.body;

  if (!destinatarios || !assunto || (!texto && !html)) {
    return res.status(400).json({
      msg: "Campos obrigatórios: destinatarios, assunto e texto ou html.",
    });
  }

  const emails = destinatarios
    .filter((email) => email && email.trim())
    .join(",");

  if (!emails) {
    return res.status(400).json({ msg: "Nenhum e-mail válido fornecido." });
  }

  try {
    const transportador = createTransporter();
    if (!transportador) {
      console.error("enviarParaDestinatarios - transporter não criado.");
      return res.status(500).json({ msg: "Configuração de e-mail inválida." });
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: emails,
      subject: assunto,
      text: texto,
      html,
    };

    const info = await transportador.sendMail(mailOptions);
    res.status(200).json({ msg: "E-mails enviados com sucesso!", info });
  } catch (erro) {
    console.error("enviarParaDestinatarios - erro:", erro.message);
    res.status(500).json({ msg: "Erro ao enviar e-mails.", erro: erro.message });
  }
};

exports.sendWelcomeEmail = async (email, name, type, password) => {
    if (!email || !name || !type || !password) {
        throw new Error("E-mail, nome, tipo e senha são obrigatórios!");
    }

    const subject = "Bem-vindo ao Sistema Class.GNTP!";

    // Personalizar texto baseado no tipo
    let customGreeting = '';
    let customDescription = '';
    let customSteps = '';
    let customIcon = '';

    if (type === 'aluno') {
        customGreeting = 'Bem-vindo(a) à nossa comunidade de estudantes!';
        customDescription = 'Parabéns! Sua conta foi criada com sucesso como <strong style="color: #007bff;">aluno</strong> na plataforma <strong>Class.GNTP</strong>, o sistema de frequência escolar que facilita o acompanhamento de aulas, notas e comunicações.';
        customSteps = `
            <ul style="font-size: 16px; line-height: 1.8;">
                <li><strong>Faça Login:</strong> Acesse <a href="localhost:9090/login" style="color: #007bff; text-decoration: none;">nosso portal</a> com seu e-mail e senha.</li>
                <li><strong>Altere Sua Senha:</strong> Vá para as configurações da conta após o login.</li>
                <li><strong>Explore o Sistema:</strong> Como aluno, você pode acompanhar frequência, notas e muito mais!</li>
            </ul>
        `;
        customIcon = 'school';
    } else if (type === 'professor') {
        customGreeting = 'Bem-vindo(a) à equipe docente!';
        customDescription = 'Parabéns! Sua conta foi criada com sucesso como <strong style="color: #007bff;">professor</strong> na plataforma <strong>Class.GNTP</strong>, o sistema de frequência escolar que facilita o gerenciamento de aulas, frequência e notas.';
        customSteps = `
            <ul style="font-size: 16px; line-height: 1.8;">
                <li><strong>Faça Login:</strong> Acesse <a href="localhost:9090/login" style="color: #007bff; text-decoration: none;">nosso portal</a> com seu e-mail e senha.</li>
                <li><strong>Altere Sua Senha:</strong> Vá para as configurações da conta após o login.</li>
                <li><strong>Explore o Sistema:</strong> Como professor, você pode gerenciar frequência, lançar notas e acompanhar turmas!</li>
            </ul>
        `;
        customIcon = 'person';
    } else if (type === 'admin') {
        customGreeting = 'Bem-vindo(a) à administração!';
        customDescription = 'Parabéns! Sua conta foi criada com sucesso como <strong style="color: #007bff;">administrador</strong> na plataforma <strong>Class.GNTP</strong>, o sistema de frequência escolar que oferece controle total sobre usuários, turmas e relatórios.';
        customSteps = `
            <ul style="font-size: 16px; line-height: 1.8;">
                <li><strong>Faça Login:</strong> Acesse <a href="https://seusite.com/login" style="color: #007bff; text-decoration: none;">nosso portal</a> com seu e-mail e senha.</li>
                <li><strong>Altere Sua Senha:</strong> Vá para as configurações da conta após o login.</li>
                <li><strong>Explore o Sistema:</strong> Como administrador, você pode gerenciar usuários, turmas, relatórios e muito mais!</li>
            </ul>
        `;
        customIcon = 'admin_panel_settings';
    }

    const text = `Olá ${name}, você foi registrado como ${type}. Seu e-mail é ${email} e senha temporária é ${password}. Altere a senha no primeiro login. Acesse: https://seusite.com/login`;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <!-- Header com Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="cid:logo@cid" alt="Logo Class.GNTP" style="height: 60px; vertical-align: middle;" />
                <h1 style="color: #007bff; margin: 10px 0; font-size: 24px;">${customGreeting}</h1>
            </div>

            <!-- Saudação Personalizada -->
            <h2 style="color: #333; text-align: center;">Olá ${name}!</h2>
            <p style="font-size: 16px; line-height: 1.5;">${customDescription}</p>
            <p style="font-size: 16px; line-height: 1.5;">Estamos felizes em tê-lo conosco! Nossa plataforma ajuda alunos, professores e administradores a gerenciar o dia a dia escolar de forma simples e eficiente.</p>

            <!-- Seção: Credenciais -->
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #007bff;">
                <h3 style="color: #333; margin-top: 0;">🚀 Suas Credenciais de Acesso</h3>
                <p><strong>E-mail:</strong> ${email}</p>
                <p><strong>Senha:</strong> ${password}</p>
            </div>

            <!-- Seção: Próximos Passos -->
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">📋 Próximos Passos</h3>
                ${customSteps}
            </div>

            <!-- Seção: Suporte -->
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 16px; margin: 0;">Precisa de ajuda? Entre em contato com nosso suporte: <a href="mailto:suporte@classgntp.com" style="color: #007bff;">suporte@classgntp.com</a></p>
            </div>

            <!-- Rodapé -->
            <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #666;">
                <p>Atenciosamente,<br><strong>Equipe Class.GNTP</strong><br>Plataforma de Gestão Escolar</p>
                <p>Enviado por: administração - class.gntp</p>
            </div>
        </div>
    `;

    const transportador = createTransporter();
    const imagePath = path.join(__dirname, '../public/img/logo_v2.jpeg');
    let attachments = [];
    if (fs.existsSync(imagePath)) {
        attachments.push({
            filename: 'logo_v2.jpeg',
            path: imagePath,
            cid: 'logo@cid'
        });
    }

    await transportador.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: email,
        subject: subject,
        text: text,
        html: html,
        attachments: attachments
    });

    console.log(`[EMAIL LOG] E-mail de boas-vindas personalizado enviado para: ${email} (${type})`);
};

exports.sendWarnDesempenho = async ({ username, para, assunto, texto, html, alunoName, tipoAviso, valor, limite }) => {
    if (!para || !assunto || (!texto && !html)) {
        throw new Error("Campos obrigatórios: para, assunto e texto ou html.");
    }

    // Ajuste para aceitar múltiplos destinatários
    const destinatarios = Array.isArray(para) ? para : [para];
    const emailsValidos = destinatarios.filter(email => email && email.trim()).join(",");

    if (!emailsValidos) {
        throw new Error("Nenhum e-mail válido fornecido.");
    }

    // Personalizar conteúdo baseado no tipo de aviso
    let customTitle = '';
    let customDescription = '';
    let customSteps = '';
    let customIcon = '';

    if (tipoAviso === 'frequência') {
        customTitle = 'Aviso de Frequência Baixa';
        customDescription = `Olá ${alunoName}, notamos que sua frequência está abaixo do esperado. Isso pode impactar seu desempenho acadêmico.`;
        customSteps = `
            <ul style="font-size: 16px; line-height: 1.8;">
                <li><strong>Verifique Sua Frequência:</strong> Acesse o sistema para ver detalhes.</li>
                <li><strong>Entre em Contato:</strong> Fale com seu professor ou coordenação.</li>
                <li><strong>Melhore a Assiduidade:</strong> Participe das aulas para evitar problemas.</li>
            </ul>
        `;
        customIcon = '📊';
    } else if (tipoAviso === 'nota') {
        customTitle = 'Aviso de Média Baixa';
        customDescription = `Olá ${alunoName}, sua média de notas está abaixo de 6. Vamos trabalhar juntos para melhorar!`;
        customSteps = `
            <ul style="font-size: 16px; line-height: 1.8;">
                <li><strong>Revise Seus Estudos:</strong> Foque nas matérias com dificuldades.</li>
                <li><strong>Busque Ajuda:</strong> Converse com professores ou tutores.</li>
                <li><strong>Acompanhe o Progresso:</strong> Monitore suas notas no sistema.</li>
            </ul>
        `;
        customIcon = '📚';
    }

    // Construir HTML personalizado (ignora html passado, usa template interno)
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
            <!-- Header com Logo -->
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="cid:logo@cid" alt="Logo Class.GNTP" style="height: 60px; vertical-align: middle;" />
                <h1 style="color: #ff6b6b; margin: 10px 0; font-size: 24px;">${customIcon} ${customTitle}</h1>
            </div>

            <!-- Saudação e Descrição -->
            <h2 style="color: #333; text-align: center;">Atenção Importante</h2>
            <p style="font-size: 16px; line-height: 1.5;">${customDescription}</p>
            <p style="font-size: 16px; line-height: 1.5;">Estamos aqui para apoiá-lo(a) no seu caminho acadêmico. Vamos resolver isso juntos!</p>

            <!-- Seção: Detalhes do Aviso -->
            <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #ff6b6b;">
                <h3 style="color: #333; margin-top: 0;">📋 Detalhes do Aviso</h3>
                <p><strong>Tipo:</strong> ${tipoAviso.charAt(0).toUpperCase() + tipoAviso.slice(1)}</p>
                <p><strong>Valor Atual:</strong> ${valor}</p>
                <p><strong>Limite:</strong> ${limite}</p>
            </div>

            <!-- Seção: Próximos Passos -->
            <div style="background-color: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">🚀 O Que Fazer Agora</h3>
                ${customSteps}
            </div>

            <!-- Seção: Suporte -->
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="font-size: 16px; margin: 0;">Precisa de ajuda? Entre em contato com nosso suporte: <a href="mailto:suporte@classgntp.com" style="color: #007bff;">suporte@classgntp.com</a></p>
            </div>

            <!-- Rodapé -->
            <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #666;">
                <p>Atenciosamente,<br><strong>Equipe Class.GNTP</strong><br>Plataforma de Gestão Escolar</p>
                <p>Enviado por: ${username}</p>
            </div>
        </div>
    `;

    const transportador = createTransporter();
    const imagePath = path.join(__dirname, '../public/img/logo_v2.jpeg');
    let attachments = [];
    if (fs.existsSync(imagePath)) {
        attachments.push({
            filename: 'logo_v2.jpeg',
            path: imagePath,
            cid: 'logo@cid'
        });
    }

    await transportador.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: emailsValidos,
        subject: assunto,
        text: texto,  // Mantém o texto plano passado
        html: emailHtml,  // Usa o HTML personalizado
        attachments: attachments
    });

    console.log(`[EMAIL LOG] Aviso de desempenho aprimorado enviado para: ${emailsValidos} (${tipoAviso})`);
};

