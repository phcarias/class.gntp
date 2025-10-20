const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Picture = require("../models/PictureModel");

exports.register = async (req, res) => {
  const { name, email, password, confirmpassword, type, active, matricula, curso, periodo, disciplinas, turmas } = req.body;
  const file = req.file;

  // Validações básicas
  if (!name) return res.status(422).json({ msg: "O nome é obrigatório!" });
  if (!email) return res.status(422).json({ msg: "O email é obrigatório!" });
  if (!password) return res.status(422).json({ msg: "A senha é obrigatória!" });
  if (password !== confirmpassword) return res.status(422).json({ msg: "A senha e a confirmação precisam ser iguais!" });

  // Validação do tipo de usuário
  const tiposPermitidos = ['admin', 'professor', 'aluno'];
  if (!tiposPermitidos.includes(type)) return res.status(422).json({ msg: "Tipo de usuário inválido!" });

  // Verificar se o email já existe
  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  // Verificar se a matrícula já existe (para alunos e professores)
  if (type === 'aluno' || type === 'professor') {
    const matriculaExists = await User.findOne({ "roleData.matricula": matricula });
    if (matriculaExists) {
      return res.status(422).json({ msg: "Matrícula já cadastrada!" });
    }
  }

  try {
    let pictureId = null;

    // Processar imagem se houver arquivo
    if (file) {
      const picture = new Picture({
        name: "imagem de " + name,
        src: file.path,
      });
      await picture.save();
      pictureId = picture._id;
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Definir os dados específicos do tipo de usuário no roleData
    const roleData = {};
    if (type === 'aluno') {
      roleData.matricula = matricula;
      roleData.turmas = (turmas || []).map(turmaId => ({ turma: turmaId })); // Referenciando ao modelo de Turma
      roleData.responsavelEmail = responsavelEmail || null;
    } else if (type === 'professor') {
      roleData.matricula = matricula;
      roleData.disciplinas = disciplinas || [];
      roleData.turmas = (turmas || []).map(turmaId => ({ turma: turmaId })); // Referenciando ao modelo de Turma
    }

    // Criar o usuário base
    const newUser = new User({
      name,
      email,
      password: passwordHash,
      type,
      active: active !== undefined ? active : true,
      imagem: pictureId,
      roleData,
    });

    await newUser.save();

    res.status(201).json({
      msg: "Usuário criado com sucesso!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        roleData: newUser.roleData,
      },
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ msg: "Erro interno do servidor" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validações básicas
  if (!email) return res.status(422).json({ msg: "O email é obrigatório!" });
  if (!password) return res.status(422).json({ msg: "A senha é obrigatória!" });

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email: email }).select("+password");
    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    const type = user.type;

    // Verificar se a senha está correta
    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      return res.status(422).json({ msg: "Senha inválida!" });
    }

    // Gerar token JWT
    const secret = process.env.SECRET;
    const token = jwt.sign(
      {
        id: user._id,
        type: user.type,
      },
      secret
    );

    res.status(200).json({ msg: "Autenticação realizada com sucesso!", token, type, _id: user._id, name: user.name });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ msg: "Erro interno do servidor" });
  }
};

