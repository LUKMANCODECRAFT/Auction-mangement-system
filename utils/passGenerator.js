/**
 * Generates an alphanumeric Exchange Pass code (e.g., "FUD-8X2A")
 * @param {number} length - Pass code length
 */
const generatePass = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pass = 'FUD-';
  for (let i = 0; i < length; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pass;
};

module.exports = generatePass;