const FlagHandler = require("../handler/FlagHandler");

const getFlag = async (req, res) => {
  try {
    const name = req.params.name;
    const value = await FlagHandler.getFlagValue(name);
    if (value === null) {
      res.sendStatus(404);
      return;
    }
    res.send(value);
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
    return;
  }
};

module.exports = { getFlag };