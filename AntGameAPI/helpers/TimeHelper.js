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

module.exports = { getGeneralizedTimeString };
