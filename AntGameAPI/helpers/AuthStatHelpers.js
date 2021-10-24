const Logger = require("../Logger");

function addStatToResponse(response, statName, values) {
  getStatDeltas(values);
  for (let i = 0; i < values.length; i++) {
    const result = values[i];
    let label = "";
    if (i === values.length - 1) {
      label = getLabelFromResult(result, 2);
    } else {
      label = getLabelFromResult(result, 1);
    }
    response[statName][label] = { value: result.value, delta: result.delta };
  }
}
module.exports = { addStatToResponse };

function getStatDeltas(valuesArr) {
  const first = valuesArr[0];
  if (first.hasOwnProperty("hours")) {
    return getStatDeltasFromHours(valuesArr);
  }
}

const getStatDeltasFromHours = valuesArr => {
  let lastHours = 0;
  let lastValue = 0;
  for (let i = 0; i < valuesArr.length; i++) {
    const statResult = valuesArr[i];
    const statResultHours = statResult.hours;
    const statResultValue = statResult.value;
    if (lastHours !== 0) {
      const valueExtrapolated = statResultValue * (lastHours / statResultHours);
      const valueDeltaPercent = getPercentDifference(lastValue, valueExtrapolated);
      valuesArr[i - 1].delta = Math.round(valueDeltaPercent * 100);
    }
    lastHours = statResultHours;
    lastValue = statResultValue;
  }
};

const getPercentDifference = (newValue, oldValue) => {
  return (newValue - oldValue) / oldValue;
};

const getLabelFromResult = (result, digits) => {
  let label = "";
  if (result.hours === 12) label = "12Hs";
  else if (result.hours === 24) label = "24Hs";
  else if (result.hours === 72) label = "3Ds";
  else if (result.hours === 168) label = "7Ds";
  else if (result.hours === 720) label = "30Ds";
  if (label.length < digits + 2) {
    label = "0" + label;
  }
  return label;
};
