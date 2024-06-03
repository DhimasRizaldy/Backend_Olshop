// handling verifyAdmin
const verifyUser = (req, res, next) => {
  const { role } = req.user;

  if (role !== "USER") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
      err: "You are not an users",
      data: null,
    });
  }
  next();
};

module.exports = verifyUser;
