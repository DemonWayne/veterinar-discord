export const reFormatDuration = (duration: number) => {
  let res = '';

  const days = Math.floor(duration / (24 * 60 * 60 * 1000));
  if (days !== 0) res += `${days}d `;
  duration %= 24 * 60 * 60 * 1000;

  const hours = Math.floor(duration / (60 * 60 * 1000));
  if (hours !== 0) res += `${hours}h `;
  duration %= 60 * 60 * 1000;

  const minutes = Math.floor(duration / (60 * 1000));
  if (minutes !== 0) res += `${minutes}m `;
  duration %= 60 * 1000;

  const seconds = Math.floor(duration / 1000);
  if (seconds !== 0) res += `${seconds}s `;

  return res.trim();
};
