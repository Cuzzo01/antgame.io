const RejectNotAdmin = (req, res) => {
  if (req.user.admin) return false;
  res.status(401);
  res.send("Not admin");
  return true;
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
