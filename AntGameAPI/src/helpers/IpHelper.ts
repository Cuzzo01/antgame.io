import { Request } from "express";

export const GetIpAddress = (req: Request) => {
  const doIP = req.headers["do-connecting-ip"];
  if (doIP) return Array.isArray(doIP) ? doIP[0] : doIP;
  const cfIP = req.headers["cf-connecting-ip"];
  if (cfIP) return Array.isArray(cfIP) ? cfIP[0] : cfIP;
  const forwardIP = req.headers["x-forwarded-for"];
  if (forwardIP) return Array.isArray(forwardIP) ? forwardIP[0] : forwardIP;
  const sourceIP = req.socket.remoteAddress;
  return sourceIP;
};
