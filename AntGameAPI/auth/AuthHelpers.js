const { ServiceTokenHandler } = require("./ServiceTokenHandler");
const { checkPassword } = require("./PasswordHandler");

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

const ServiceEndpointAuth = async (req, res, next) => {
  const token = req.get("Authorization");
  const serviceName = req.get("service-id");

  if (!token || !serviceName) {
    res.status(401);
    res.send("Incomplete auth");
    return;
  }

  const tokenData = await ServiceTokenHandler.getTokenData({ serviceName });

  if (tokenData === null) {
    res.status(401);
    res.send("Unknown service");
    return;
  }

  if (!(await checkPassword(token, tokenData.tokenHash))) {
    res.send(401);
    res.send("Incorrect token");
    return;
  }

  next();
};

module.exports = { RejectNotAdmin, RejectIfAnon, ServiceEndpointAuth };
