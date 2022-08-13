const GetIpAddress = req => {
  const cfIP = req.headers["do-connecting-ip"];
  if (cfIP) return cfIP;
  const forwardIP = req.headers["x-forwarded-for"];
  if (forwardIP) return forwardIP;
  const sourceIP = req.connection.remoteAddress;
  return sourceIP;
};
module.exports = { GetIpAddress };
