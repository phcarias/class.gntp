//Este arquivo Picture.js é a "planta" que descreve como os dados das imagens 
//serão estruturados e armazenados no seu banco de dados MongoDB.


// Importa o módulo Mongoose, que é uma biblioteca para Node.js
// que facilita a interação com o MongoDB, fornecendo um sistema de esquemas.
const mongoose = require("mongoose");

// Extrai a classe 'Schema' de Mongoose. Um Schema é a estrutura do seu documento.
const Schema = mongoose.Schema;


// Cria um novo 'Schema' para a coleção de 'Pictures'.
// Isso define os campos (ou "propriedades") que cada documento de imagem terá no banco de dados.
  
  // 1- Define o campo 'name' (nome da imagem).
  // 'type: String' especifica que o valor deste campo deve ser uma string.
  // 'required: true' significa que este campo é obrigatório;
  // um documento não pode ser salvo sem um valor para 'name'.
   
  // 2- Define o campo 'src' (source, ou caminho do arquivo).
  // 'type: String' especifica que o valor deve ser uma string.
  // 'required: true' torna este campo obrigatório.
  // Ele armazenará o caminho onde o arquivo da imagem está salvo no servidor.

  const PictureSchema = new Schema({
  //1 -
  name: { type: String, required: true }, 
  //2 -
  src: { type: String, required: true },
});


// Exporta o modelo de Mongoose.
// 1. 'mongoose.model("Picture", PictureSchema)' cria um modelo de dados.
//    - "Picture" é o nome singular da sua coleção no banco de dados. O Mongoose
//      automaticamente o pluraliza para "pictures".
//    - 'PictureSchema' é o esquema que o modelo usará para validar os documentos.
// 2. O 'module.exports' torna este modelo disponível para ser importado e usado em outros
//    arquivos da sua aplicação (por exemplo, no 'pictureController').
module.exports = mongoose.model("Picture", PictureSchema, "picture");