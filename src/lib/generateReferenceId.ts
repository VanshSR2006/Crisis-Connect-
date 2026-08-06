/**
 * Generates a short emergency reference code formatted as SOS-XXXXX.
 */
export const generateReferenceId = (): string => {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `SOS-${result}`;
};
