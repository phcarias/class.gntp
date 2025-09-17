//Arquivo com a lógia de controle para as operações de imagens


// Importa o módulo 'fs' (File System), que permite interagir com o sistema de arquivos do servidor.
// O 'fs' é usado aqui para excluir arquivos, embora não na função 'create'.
const fs = require("fs");

// Importa o modelo 'Picture' criado, permitindo interagir com a coleção de imagens no banco de dados.
const Picture = require("../models/PictureModel");
//const { info, error } = require("console");


// Define a função 'create' e a exporta para ser usada em outros arquivos.
// Esta função é assíncrona porque interage com o banco de dados.
exports.create = async (req, res) => {
  try {
     // 1. Desestrutura o objeto 'req.body' para obter o 'name' da imagem enviado no corpo da requisição.
    const { nome } = req.body;

    // 2. Obtém o objeto 'file' da requisição, que contém informações sobre o arquivo
    //    que foi salvo pelo Multer, incluindo o caminho ('file.path').
    const file = req.file;

    // 3. Cria uma nova instância do modelo 'Picture' com o nome e o caminho do arquivo.
    const picture = new Picture({
      nome,
      src: file.path,
    });

    // 4. Salva o novo documento (a imagem) no banco de dados.
    await picture.save();
    
    // 5. Envia o objeto da imagem que acabou de ser salvo como resposta.
    res.json(picture);

    // 6. Se ocorrer um erro durante o processo (por exemplo, falha ao salvar no DB),
    //    uma resposta de erro com status 500 é enviada.
  } catch (err) {
    res.status(500).json({ message: "Erro ao salvar a imagem." });
  }
};

// Define e exporta a função 'remove', que é assíncrona.
exports.remove = async (req, res) => {
  try {
    // 1. Busca a imagem no banco de dados usando o ID fornecido na URL da requisição.
    const picture = await Picture.findById(req.params.id);

    // 2. Verifica se a imagem foi encontrada. Se não, retorna um erro 404.
    if (!picture) {
      return res.status(404).json({ message: "Imagem não encontrada." });
    }

    // 3. Usa 'fs.unlinkSync' para remover o arquivo da imagem do sistema de arquivos do servidor
    //    com base no caminho ('picture.src') salvo no banco de dados. 
    //    A versão síncrona 'unlinkSync' bloqueia a execução até a conclusão.
    fs.unlinkSync(picture.src);

    // 4. Usa o método 'deleteOne' do Mongoose para deletar o documento do banco de dados.
    await Picture.deleteOne({ _id: req.params.id });

    // 5. Envia uma resposta de sucesso com status 200 e uma mensagem.
    res.status(200).json({ message: "Imagem removida com sucesso!" });

    // 6. Se ocorrer um erro (ex: arquivo não encontrado), a função 'catch' é ativada
  } catch (err) {
    // 5. Trata o erro de forma segura
    console.error(err);
    res.status(500).json({ message: "Erro ao remover a imagem.", error: err.message });
  }
};


// Define e exporta a função 'findAll', que é assíncrona.
exports.findAll = async (req, res) => {
  try {
    // 1. Usa o método 'find()' do Mongoose para buscar todos os documentos (todas as imagens)
    //    na coleção 'Picture'.
    const pictures = await Picture.find();
    // 2. Envia a lista de imagens encontradas como resposta.
    res.json(pictures);
    
    // 3. Se ocorrer um erro durante a busca, envia uma resposta de erro com o status 500.
  } catch (err) {
    res.status(500).json({ message: "Erro ao buscar as imagens." });
  }
};