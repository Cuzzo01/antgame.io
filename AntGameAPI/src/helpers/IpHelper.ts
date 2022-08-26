import { Request } from "express";

export const GetIpAddress = (req: Request) => {
  const cfIP = req.headers["do-connecting-ip"];
  if (cfIP) return Array.isArray(cfIP) ? cfIP[0] : cfIP;
  const forwardIP = req.headers["x-forwarded-for"];
  if (forwardIP) return Array.isArray(forwardIP) ? forwardIP[0] : forwardIP;
  const sourceIP = req.connection.remoteAddress;
  return sourceIP;
};
