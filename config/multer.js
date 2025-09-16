//Este arquivo é o que define como os arquivos de imagem são recebidos e armazenados no seu servidor.

// Importa o módulo 'multer', que é uma biblioteca de middleware para Node.js
// usada para lidar com o envio de arquivos (upload) em formulários multipart/form-data.
const multer = require("multer");

// Importa o módulo 'path', que fornece utilitários para trabalhar com caminhos de arquivos e diretórios.
// É usado aqui para extrair a extensão do nome do arquivo.
const path = require("path");

// Configura o 'diskStorage' do Multer, que define onde e como os arquivos serão salvos no disco rígido.
const storage = multer.diskStorage({
  // A função 'destination' define o diretório onde os arquivos serão salvos.
  // 'cb' é a função de callback, onde o primeiro parâmetro é para erros (null neste caso, pois não há)
  // e o segundo é o caminho do diretório.
  destination: function (req, file, cb) {
    // Define a pasta 'uploads/' como o destino para todos os arquivos.
    cb(null, "uploads/");
  },
  // A função 'filename' define o nome do arquivo a ser salvo.
  filename: function (req, file, cb) {
    // Cria um nome de arquivo único para evitar conflitos.
    // 'Date.now()' gera um timestamp numérico, que é único.
    // 'path.extname(file.originalname)' extrai a extensão do arquivo original (ex: .jpg, .png).
    // O resultado final será algo como "1678886400000.jpg".
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
// Cria uma instância do Multer.
// Ele usa a configuração de 'storage' definidas acima para determinar como os arquivos serão salvos.
const upload = multer({ storage });

// Exporta a instância 'upload'.
// Isso permite que ela seja importada e usada como um middleware nas rotas do seu Express
// para processar os uploads de arquivos.
module.exports = upload;