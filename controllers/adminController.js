const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const Turma = require("../models/TurmaModel");

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
  const { id, name, email, active, roleData } = req.body;

  try {
    const user = await User.findById(id);
    if (!user || user.type !== "aluno") {
      return res.status(404).json({ msg: "Aluno não encontrado!" });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
      user.email = email;
    }
    if (name) user.name = name;
    if (typeof active === "boolean") user.active = active;

    if (roleData) {
      if (roleData.matricula && roleData.matricula !== user.roleData?.matricula) {
        const matriculaExists = await User.findOne({
          "roleData.matricula": roleData.matricula,
          _id: { $ne: id },
        });
        if (matriculaExists) {
          return res.status(422).json({ msg: "Matrícula já cadastrada!" });
        }
        user.roleData.matricula = roleData.matricula;
      }

      if (roleData.responsavelEmail !== undefined) {
        user.roleData.responsavelEmail = roleData.responsavelEmail;
      }

      if (roleData.turmas) {
        const incomingIds = Array.isArray(roleData.turmas)
          ? roleData.turmas.map((t) =>
              typeof t === "object" && t !== null ? String(t.turma || t._id || t.id) : String(t)
            )
          : [];
        const newIds = [...new Set(incomingIds.filter(Boolean))];

        const currentIds = (user.roleData?.turmas || []).map((t) =>
          String(typeof t === "object" && t !== null ? t.turma : t)
        );

        const toAdd = newIds.filter((tid) => !currentIds.includes(tid));
        const toRemove = currentIds.filter((tid) => !newIds.includes(tid));

        await Promise.all([
          ...toAdd.map((tid) => Turma.findByIdAndUpdate(tid, { $addToSet: { alunos: user._id } })),
          ...toRemove.map((tid) => Turma.findByIdAndUpdate(tid, { $pull: { alunos: user._id } })),
        ]);

        user.roleData.turmas = newIds.map((tid) => ({ turma: tid }));
      }

      // Marcar roleData como modificado para Mixed fields
      user.markModified('roleData');
    }

    await user.save();
    res.status(200).json({ msg: "Dados do aluno atualizados com sucesso!", user });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao atualizar aluno!", error });
  }
};

exports.updateProfessor = async (req, res) => {
  const { id, name, email, active, roleData } = req.body;

  if (!id) {
    return res.status(400).json({ msg: "ID do professor é obrigatório." });
  }

  try {
    const user = await User.findById(id);
    if (!user || user.type !== "professor") {
      console.log('Professor not found or invalid type for id:', id);
      return res.status(404).json({ msg: "Professor não encontrado!" });
    }

    // Update basic fields with validations
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: id } });
      if (emailExists) return res.status(422).json({ msg: "Por favor, utilize outro e-mail!" });
      user.email = email;
    }
    if (typeof active === "boolean") user.active = active;

    if (roleData) {
      // Matricula with uniqueness check
      if (roleData.matricula && roleData.matricula !== user.roleData?.matricula) {
        const matriculaExists = await User.findOne({
          "roleData.matricula": roleData.matricula,
          _id: { $ne: id },
        });
        if (matriculaExists) {
          return res.status(422).json({ msg: "Matrícula já cadastrada!" });
        }
        user.roleData.matricula = roleData.matricula;
      }

      // Disciplinas
      if (roleData.disciplinas) user.roleData.disciplinas = roleData.disciplinas;

      // Turmas: normalize and sync with TurmaModel
      if (roleData.turmas) {
        const incomingIds = Array.isArray(roleData.turmas)
          ? roleData.turmas.map((t) =>
              typeof t === "object" && t !== null ? String(t.turma || t._id || t.id) : String(t)
            )
          : [];
        const newIds = [...new Set(incomingIds.filter(Boolean))];

        console.log('Processed turmas - incomingIds:', incomingIds, 'newIds:', newIds);

        const currentIds = (user.roleData?.turmas || []).map((t) =>
          String(typeof t === "object" && t !== null ? t.turma : t)
        );

        const toAdd = newIds.filter((tid) => !currentIds.includes(tid));
        const toRemove = currentIds.filter((tid) => !newIds.includes(tid));

        console.log('Turmas to add/remove:', { toAdd, toRemove });

        await Promise.all([
          ...toAdd.map((tid) => Turma.findByIdAndUpdate(tid, { $addToSet: { professores: user._id } })),
          ...toRemove.map((tid) => Turma.findByIdAndUpdate(tid, { $pull: { professores: user._id } })),
        ]);

        user.roleData.turmas = newIds.map((tid) => ({ turma: tid }));

        console.log('Updated user.roleData.turmas:', user.roleData.turmas);
      }

      // Marcar roleData como modificado para Mixed fields
      user.markModified('roleData');
    }

    console.log('About to save user with roleData:', user.roleData);
    await user.save();
    console.log('User saved successfully, final roleData:', user.roleData);

    return res.status(200).json({ msg: "Dados do professor atualizados com sucesso!", user });
  } catch (error) {
    console.error('Error in updateProfessor:', error);
    return res.status(500).json({ msg: "Erro ao atualizar professor!", error: error.message });
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

exports.getAlunosStats = async (req, res) => {
  try {
    // Total de alunos
    const totalAlunos = await User.countDocuments({ type: "aluno" });

    // Alunos matriculados este mês
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Considerando que o campo de data de matrícula é 'createdAt'
    const alunosMatriculadosEsteMes = await User.countDocuments({
      type: "aluno",
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    res.status(200).json({
      totalAlunos,
      alunosMatriculadosEsteMes
    });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar estatísticas de alunos!", error });
  }
};

exports.getAlunos = async (req, res) => {
  try {
    const alunos = await User.find({ type: 'aluno' })
      .select('name email type active roleData createdAt')
      .populate({
        path: 'roleData.turmas.turma',
        model: Turma
      });   

    res.status(200).json(alunos);
  } catch (error) {
    console.error('Erro ao buscar alunos:', error);
    res.status(500).json({ erro: 'Erro ao buscar alunos', detalhes: error.message });
  }
};

exports.getProfessores = async (req, res) => {
  try {
    const professores = await User.find({ type: 'professor' })
      .select('name email type active roleData createdAt')
      .populate({
        path: 'roleData.turmas.turma',
        model: Turma
      });

    res.status(200).json(professores);
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    res.status(500).json({ erro: 'Erro ao buscar professores', detalhes: error.message });
  }
};

exports.getProfessoresByName = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório para a busca!" });
  }

  try {
    const professores = await User.find({
      type: "professor",
      name: { $regex: new RegExp(name, "i") }
    })
      .select('name email type active roleData createdAt')
      .populate({
        path: 'roleData.turmas.turma',
        model: Turma
      });

    if (!professores.length) {
      return res.status(404).json({ msg: "Nenhum professor encontrado com esse nome!" });
    }

    res.status(200).json(professores);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar professores pelo nome!", error });
  }
};

exports.getProfessoresStats = async (req, res) => {
  try {
    // Total de professores
    const totalProfessores = await User.countDocuments({ type: "professor" });

    // Professores cadastrados este mês
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Considerando que o campo de data de cadastro é 'createdAt'
    const professoresCadastradosEsteMes = await User.countDocuments({
      type: "professor",
      createdAt: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
    });

    res.status(200).json({
      totalProfessores,
      professoresCadastradosEsteMes
    });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar estatísticas de professores!", error });
  }
};

exports.getTurmasStats = async (req, res) => {
  try {
    // Total de turmas
    const totalTurmas = await Turma.countDocuments();

    // Total de turmas desativadas
    const turmasDesativadas = await Turma.countDocuments({ active: false });

    res.status(200).json({
      totalTurmas,
      turmasDesativadas
    });
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar estatísticas de turmas!", error });
  }
};

// ...existing code...
// Ajuste o modelo/campos conforme seu schema (ex.: Chamada/Aula/Presenca, campo de data e flag 'presente')
exports.getFrequenciaMedia = async (req, res) => {
  try {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth(); // 0-11

    const startThis = new Date(ano, mes, 1, 0, 0, 0, 0);
    const endThis = new Date(ano, mes + 1, 0, 23, 59, 59, 999);

    const startPrev = new Date(ano, mes - 1, 1, 0, 0, 0, 0);
    const endPrev = new Date(ano, mes, 0, 23, 59, 59, 999);

    // Substitua 'Chamada' pelo seu modelo de presença e ajuste 'data' e 'registros.presente'
    const Chamada = require('../models/frequenciaModel');

    async function computeRange(start, end) {
      const agg = await Chamada.aggregate([
        { $match: { data: { $gte: start, $lte: end } } },
        { $unwind: '$registros' },
        {
          $group: {
            _id: null,
            totalRegistros: { $sum: 1 },
            totalPresentes: {
              $sum: { $cond: [{ $eq: ['$registros.presente', true] }, 1, 0] }
            }
          }
        }
      ]);
      if (!agg.length) return { totalRegistros: 0, totalPresentes: 0 };
      return agg[0];
    }

    const cur = await computeRange(startThis, endThis);
    const prev = await computeRange(startPrev, endPrev);

    const freqAtual = cur.totalRegistros > 0
      ? Math.round((cur.totalPresentes / cur.totalRegistros) * 100)
      : 0;

    const freqAnterior = prev.totalRegistros > 0
      ? Math.round((prev.totalPresentes / prev.totalRegistros) * 100)
      : 0;

    const diferenca = freqAtual - freqAnterior;

    return res.status(200).json({
      frequenciaMedia: freqAtual,
      diferencaFrequencia: diferenca
    });
  } catch (error) {
    console.error('Erro getFrequenciaMedia:', error);
    return res.status(500).json({ msg: 'Erro ao calcular frequência média', error });
  }
};

exports.getAlunosByName = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(422).json({ msg: "O nome é obrigatório para a busca!" });
  }

  try {
    // Busca alunos cujo nome contenha o valor fornecido (case-insensitive)
    const alunos = await User.find({
      type: "aluno",
      name: { $regex: new RegExp(name, "i") }
    })
      .select('name email type active roleData createdAt')
      .populate({
        path: 'roleData.turmas.turma',
        model: Turma
      });

    if (!alunos.length) {
      return res.status(404).json({ msg: "Nenhum aluno encontrado com esse nome!" });
    }

    res.status(200).json(alunos);
  } catch (error) {
    res.status(500).json({ msg: "Erro ao buscar alunos pelo nome!", error });
  }
};