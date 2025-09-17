//Este arquivo é a definição de rotas, que basicamente "diz" ao servidor qual função executar para cada requisição HTTP recebida.

// Importa o framework Express, que é usado para criar o servidor web.
const express = require("express");

// Cria um objeto de 'Router' do Express. Isso permite agrupar rotas e exportá-las
// para serem usadas no arquivo principal do servidor (como o app.js).
const router = express.Router();

// Importa a configuração do Multer, uma biblioteca para lidar com o upload de arquivos.
// O 'upload' contém a configuração de como os arquivos serão armazenados.
const upload = require("../config/multer");

// Importa o 'PictureController', que contém a lógica real (as funções) para
// manipular as requisições, como criar, buscar ou remover imagens.
const PictureController = require("../controllers/PictureController");

// Define uma rota POST para a URL raiz ("/") deste roteador.
// 1. O 'upload.single("file")' é um middleware do Multer. Ele intercepta a requisição,
//    processa o upload de um único arquivo (nomeado "file") e salva-o no disco.
// 2. Após o upload ser concluído, a requisição é passada para o 'PictureController.create',
//    que lida com a lógica de salvar o caminho do arquivo no banco de dados.
router.post("/", upload.single("file"), PictureController.create);

// Define uma rota GET para a URL raiz ("/").
// Quando um usuário faz uma requisição GET para esta rota, a função 'findAll' do
// PictureController é executada, buscando todas as imagens no banco de dados.
router.get("/", PictureController.findAll);

// Define uma rota DELETE com um parâmetro dinâmico ":id".
// O ":id" captura o ID da imagem na URL (por exemplo, /pictures/12345).
// A função 'remove' do PictureController é então executada, usando o ID fornecido
// para deletar a imagem do banco de dados e o arquivo do servidor.
router.delete("/:id", PictureController.remove);


// Exporta o objeto 'router' para que ele possa ser importado e usado no arquivo principal
// (como 'app.js'), onde será atrelado a um prefixo de URL, como "/pictures".
module.exports = router;