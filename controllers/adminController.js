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