import Blacklist from "the-big-username-blacklist";
import { CensorSensor, CensorTier } from "censor-sensor";

const usernameRegex = /^[a-z0-9_]+$/i;

const StrictCensor = new CensorSensor();
StrictCensor.disableTier(CensorTier.CommonProfanity);
StrictCensor.disableTier(CensorTier.PossiblyOffensive);
StrictCensor.disableTier(CensorTier.SexualTerms);
StrictCensor.addWord("queer");
StrictCensor.addWord("slave");

const LaxCensor = new CensorSensor();

export const RegistrationDataSatisfiesCriteria = (
  username: string,
  password: string,
  clientID: string
) => {
  if (username.length > 15 || username.length < 5) return false;
  if (password.length > 100 || password.length < 8) return false;
  if (!clientID) return false;
  return true;
};

export const IsAllowedUsername = (username: string) => {
  if (!usernameRegex.test(username)) return false;
  if (StrictCensor.isProfaneIsh(username.replace("_", " "))) return false;
  if (LaxCensor.isProfane(username.replace("_", " "))) return false;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  if (!Blacklist.validate(username)) return false;
  return true;
};
