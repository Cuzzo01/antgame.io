const getGeneralizedTimeString = milliseconds => {
  const seconds = milliseconds / 1000;
  if (seconds < 60) return "Now";
  const minuets = seconds / 60;
  if (minuets < 60) return `${Math.floor(minuets)}m`;
  const hours = minuets / 60;
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = hours / 24;
  if (days < 14) return `${Math.floor(days)}d`;
  const weeks = days / 7;
  return `${Math.floor(weeks)}w`;
};

const getGeneralizedTimeStringFromObjectID = objectID => {
  const recordTime = objectID.getTimestamp();
  const timeDelta = new Date() - recordTime;
  const timeString = getGeneralizedTimeString(timeDelta);
  return timeString;
};

const getTimeStringForDailyChallenge = objectID => {
  const recordTime = objectID.getTimestamp();
  recordTime.setHours(recordTime.getHours() - 12);
  let hours = recordTime.getUTCHours();
  const min = recordTime.getUTCMinutes();
  let hoursDisplay;
  if (hours === 0) {
    hoursDisplay = 12;
  } else if (hours > 12) {
    hoursDisplay = hours - 12;
  } else {
    hoursDisplay = hours;
  }

  return `${hoursDisplay}:${min < 10 ? `0${min}` : min} ${hours > 11 ? "PM" : "AM"}`;
};

module.exports = {
  getGeneralizedTimeString,
  getGeneralizedTimeStringFromObjectID,
  getTimeStringForDailyChallenge,
};
