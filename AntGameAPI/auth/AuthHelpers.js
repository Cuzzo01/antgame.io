const RejectNotAdmin = (req, res, next) => {
  if (req.user.admin !== true) {
    res.status(401);
    res.send("Not admin");
    return;
  }
  next();
};

const RejectIfAnon = (req, res) => {
  if (req.user.anon) {
    res.status(401);
    res.send("Cant be anon");
    return true;
  }
  return false;
};

module.exports = { RejectNotAdmin, RejectIfAnon };
