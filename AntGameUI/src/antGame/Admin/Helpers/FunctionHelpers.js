export const GetTimeString = dateTimeString => {
  const date = new Date(dateTimeString);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};
