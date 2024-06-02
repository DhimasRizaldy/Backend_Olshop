const jwt = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

// handling verifyToken
const verifyToken = (req, res, next) => {
  if (req.headers.authorization === undefined)
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      err: "No token provided",
      data: null,
    });

  // check token
  const token = req.headers.authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      err: "No token provided",
      data: null,
    });
  }

  // verify token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.status(401).json({
        success: false,
        message: "Unauthorized",
        err: err.message,
        data: null,
      });
    } else {
      req.user = decoded;
      next();
    }
  });
};

module.exports = verifyToken;
