// language: javascript
// filepath: /c:/Users/thiago.jlima/Downloads/class.gntp/middlewares/authMiddleware.js
// ...existing code...
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

function checkToken(req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["x-access-token"] || "";
  const token = authHeader && authHeader.split ? authHeader.split(" ")[1] : null;

  if (!token) {
    return res.status(401).json({ msg: "Acesso negado!" });
  }

  try {
    const secret = process.env.SECRET;
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id || decoded._id || decoded.userId || null,
      type: decoded.type || decoded.tipo || decoded.role || null,
      raw: decoded
    };
    return next();
  } catch (err) {
    return res.status(400).json({ msg: "O Token é inválido!" });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Usuário não autenticado!" });
    }
    const userType = req.user.type || (req.user.raw && (req.user.raw.type || req.user.raw.role || req.user.raw.tipo));
    if (!roles.includes(userType)) {
      return res.status(403).json({ msg: "Acesso negado! Permissão insuficiente." });
    }
    next();
  };
}

function checkAdmin(req, res, next) {
  const userType = req.user && (req.user.type || (req.user.raw && (req.user.raw.type || req.user.raw.role || req.user.raw.tipo)));
  if (userType !== "admin") {
    return res.status(403).json({ msg: "Acesso restrito a administradores!" });
  }
  next();
}



// Export compatível com diferentes import styles:
// - const auth = require('./authMiddleware'); -> auth(req,res,next)
// - const { checkToken } = require('./authMiddleware'); -> checkToken(req,res,next)
// - const auth = require('./authMiddleware'); auth.authorize('admin')
module.exports = checkToken;
module.exports.checkToken = checkToken;
module.exports.authorize = authorize;
module.exports.checkAdmin = checkAdmin;
// ...existing code...