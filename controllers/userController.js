const User = require("../models/UserModel");
const { checkToken } = require("../middlewares/authMiddleware");


//10 Antes da função
// Rota privada
exports.getUserPublic = async (req, res) => {
  const id = req.params.id; // Obtém o ID do usuário a partir dos parâmetros da URL

  // check if user exists
  const user = await User.findById(id, "-password"); // Busca o usuário no banco de dados, excluindo o campo de senha

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" }); // Retorna um erro 404 se o usuário não for encontrado
  }

  res.status(200).json({ user }); // Retorna os dados do usuário encontrado
};

//12
// Rota privada depois da função criada
exports.getUserPrivate =  async (req, res) => {
  const id = req.params.id; // Obtém o ID do usuário a partir dos parâmetros da URL

  // check if user exists
  const user = await User.findById(id); // Busca o usuário no banco de dados, excluindo o campo de senha

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" }); // Retorna um erro 404 se o usuário não for encontrado
  }

  res.status(200).json({ 
    msg: "Voce está ná Área Restrita",
    user 
    }); // Retorna mensagem e os dados do usuário encontrado
};

