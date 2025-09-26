const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
const Picture = require("../models/PictureModel");
const UserProfessor = require("../models/ProfessorModel");
const UserAluno = require("../models/AlunoModel");



//07 - Depois criar o arquivo MODEL
exports.register = async (req, res) => {
  const { name, email, password, confirmpassword, type, active, matricula, curso, periodo, disciplinas } = req.body;
  const file = req.file;

  // Validações básicas
  if (!name) return res.status(422).json({ msg: "O nome é obrigatório!" });
  if (!email) return res.status(422).json({ msg: "O email é obrigatório!" });
  if (!password) return res.status(422).json({ msg: "A senha é obrigatória!" });
  if (password !== confirmpassword) return res.status(422).json({ msg: "A senha e a confirmação precisam ser iguais!" });

  // Validação do tipo de usuário
  const tiposPermitidos = ['admin', 'professor', 'aluno'];
  if (type && !tiposPermitidos.includes(type)) {
    return res.status(422).json({ msg: "Tipo de usuário inválido!" });
  }

  // Validações específicas por tipo
  if (type === 'aluno' && !matricula) {
    return res.status(422).json({ msg: "Matrícula é obrigatória para alunos!" });
  }

  if (type === 'professor' && !matricula) {
    return res.status(422).json({ msg: "Matrícula é obrigatória para professores!" });
  }

  // Verificar se usuário existe
  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
  }

  // Verificar se matrícula já existe (para alunos e professores)
  if (type === 'aluno' || type === 'professor') {
    const matriculaExists = type === 'aluno' 
      ? await UserAluno.findOne({ matricula: matricula })
      : await UserProfessor.findOne({ matricula: matricula });
    
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

    // Criar usuário base
    const newUser = new User({
      name,
      email,
      password: passwordHash,
      type: type || 'aluno',
      active: active !== undefined ? active : true,
      imagem: pictureId
    });

    await newUser.save();

    // Criar perfil específico baseado no tipo
    if (type === 'aluno') {
      const newAluno = new UserAluno({
        usuario: newUser._id,
        matricula: matricula,
        dadosAcademicos: {
          curso: curso || '',
          periodo: periodo || 1
        },
        turmas: []
      });
      await newAluno.save();
    } 
    else if (type === 'professor') {
      const newProfessor = new UserProfessor({
        usuario: newUser._id,
        matricula: matricula,
        disciplinas: disciplinas || [],
        turmas: []
      });
      await newProfessor.save();
    }

    // Para admin, apenas o User base é criado

    res.status(201).json({ 
      msg: "Usuário criado com sucesso!",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        type: newUser.type,
        matricula: type !== 'admin' ? matricula : undefined
      }
    });

  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    
    // Rollback: Se o user foi salvo mas o perfil específico falhou, deletar o user
    if (newUser && newUser._id) {
      await User.findByIdAndDelete(newUser._id);
    }
    
    res.status(500).json({ msg: "Erro interno do servidor" });
  }
};

//08
exports.login = async (req, res) => {
  const { email, password } = req.body; // Obtém os dados do corpo da requisição

  // validations
  if (!email) {
    return res.status(422).json({ msg: "O email é obrigatório!" }); // Retorna um erro 422 se o email não for fornecido
  }

  if (!password) {
    return res.status(422).json({ msg: "A senha é obrigatória!" }); // Retorna um erro 422 se a senha não for fornecida
  }

  // check if user exists
  const user = await User.findOne({ email: email }); // Busca o usuário no banco de dados pelo email

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" }); // Retorna um erro 404 se o usuário não for encontrado
  }

  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password); // Compara a senha fornecida com o hash armazenado

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha inválida" }); // Retorna um erro 422 se a senha estiver incorreta
  }

  //09 Fazer um env secret para evitar ser hackeado
  try {
    const secret = process.env.SECRET; // Obtém a chave secreta a partir das variáveis de ambiente

    const token = jwt.sign(
      {
        id: user._id, // Cria um token JWT contendo o ID e nome do usuário
        name: user.name,
      },
      secret
    );

    res.status(200).json({ msg: "Autenticação realizada com sucesso!", token }); // Retorna o token JWT
  } catch (error) {
    res.status(500).json({ msg: error }); // Retorna um erro 500 se algo der errado ao gerar o token
  }

  //Ainda não sabe lidar com token iremos realizar a tratativa no passo 10
};

