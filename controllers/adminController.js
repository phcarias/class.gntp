const User = require("../models/UserModel");
const bcrypt = require("bcrypt");

exports.updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const admin = await User.findById(id);

    if (!admin || admin.type !== "admin") {
      return res.status(404).json({ msg: "Administrador não encontrado!" });
    }

    // Atualizar os campos permitidos
    if (name) admin.name = name;
    if (email) admin.email = email;

    await admin.save();

    res.status(200).json({ msg: "Dados do administrador atualizados com sucesso!", admin });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao atualizar administrador!", error });
  }
};

//alteração de senha, devem ter mais verificações!

exports.updatePasswordByEmail = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  // Validações básicas
  if (!email || !newPassword || !confirmPassword) {
    return res.status(422).json({ msg: "E-mail, nova senha e confirmação são obrigatórios!" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(422).json({ msg: "A nova senha e a confirmação precisam ser iguais!" });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    // Gerar hash da nova senha
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Atualizar a senha do usuário
    user.password = passwordHash;
    await user.save();

    res.status(200).json({ msg: "Senha atualizada com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao atualizar a senha!", error });
  }
};

exports.updatePassword = async (req, res) => {
  const { id } = req.params; // ID do usuário
  const { newPassword, confirmPassword } = req.body;

  // Validações básicas
  if (!newPassword || !confirmPassword) {
    return res.status(422).json({ msg: "A nova senha e a confirmação são obrigatórias!" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(422).json({ msg: "A nova senha e a confirmação precisam ser iguais!" });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ msg: "Usuário não encontrado!" });
    }

    // Gerar hash da nova senha
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Atualizar a senha do usuário
    user.password = passwordHash;
    await user.save();

    res.status(200).json({ msg: "Senha atualizada com sucesso!" });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao atualizar a senha!", error });
  }
};

exports.updateAluno = async (req, res) => {
  const { id } = req.params; // ID do usuário (aluno)
  const { name, email, active, roleData } = req.body;

  try {
    // Busca o usuário e garante que é do tipo aluno
    const user = await User.findById(id);
    if (!user || user.type !== "aluno") {
      return res.status(404).json({ msg: "Aluno não encontrado!" });
    }

    // Atualiza campos permitidos
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof active === "boolean") user.active = active;

    // Atualiza dados específicos do aluno (roleData)
    if (roleData) {
      // Aqui depende do formato do seu schema:
      // Se matricula/curso/turma forem arrays, você pode atribuir arrays.
      // Se forem strings, só aceita um valor.
      if (roleData.matricula) user.roleData.matricula = roleData.matricula;
      if (roleData.curso) user.roleData.curso = roleData.curso;
      if (roleData.periodo) user.roleData.periodo = roleData.periodo;
      if (roleData.turmas) user.roleData.turmas = roleData.turmas;
    }

    await user.save();

    res.status(200).json({ msg: "Dados do aluno atualizados com sucesso!", user });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao atualizar aluno!", error });
  }
};

exports.updateProfessor = async (req, res) => {
  const { id } = req.params; // ID do usuário (professor)
  const { name, email, active, roleData } = req.body;

  try {
    // Busca o usuário e garante que é do tipo professor
    const user = await User.findById(id);
    if (!user || user.type !== "professor") {
      return res.status(404).json({ msg: "Professor não encontrado!" });
    }

    // Atualiza campos permitidos
    if (name) user.name = name;
    if (email) user.email = email;
    if (typeof active === "boolean") user.active = active;

    // Atualiza dados específicos do professor (roleData)
    if (roleData) {
      // Permitir múltiplas turmas para o professor
      if (roleData.turmas) user.roleData.turmas = roleData.turmas;
      if (roleData.disciplinas) user.roleData.disciplinas = roleData.disciplinas;
    }

    await user.save();

    res.status(200).json({ msg: "Dados do professor atualizados com sucesso!", user });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao atualizar professor!", error });
  }
};

exports.removeTurmas = async (req, res) => {
  const { id } = req.params; // ID do usuário (professor ou aluno)
  const { turmasToRemove } = req.body; // Array de turmas a serem removidas

  if (!Array.isArray(turmasToRemove) || turmasToRemove.length === 0) {
    return res.status(422).json({ msg: "É necessário fornecer um array de turmas para remover!" });
  }

  try {
    // Busca o usuário
    const user = await User.findById(id);
    if (!user || !user.roleData || !Array.isArray(user.roleData.turmas)) {
      return res.status(404).json({ msg: "Usuário ou turmas não encontrados!" });
    }

    // Remove as turmas especificadas
    user.roleData.turmas = user.roleData.turmas.filter(
      (turma) => !turmasToRemove.includes(turma)
    );

    await user.save();

    res.status(200).json({ msg: "Turmas removidas com sucesso!", turmas: user.roleData.turmas });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao remover turmas!", error });
  }
};