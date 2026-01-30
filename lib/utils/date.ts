export const getCurrentISOTimestamp = (): string => {
  return new Date().toISOString();
};

export const parseISOTimestamp = (timestamp: string): Date => {
  return new Date(timestamp);
};

export const isValidISOTimestamp = (timestamp: string): boolean => {
  const date = new Date(timestamp);
  return !isNaN(date.getTime()) && date.toISOString() === timestamp;
};
