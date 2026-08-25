// Pakistani CNIC: 5 digits - 7 digits - 1 digit, e.g. 35202-1234567-1
const CNIC_REGEX = /^\d{5}-\d{7}-\d{1}$/;
// Standard, reasonably strict email check (not exhaustive RFC 5322, but rejects the
// obvious junk: missing @, missing TLD, spaces, etc.)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function isValidEmail(email) {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

function isValidCnic(cnic) {
  return typeof cnic === "string" && CNIC_REGEX.test(cnic.trim());
}

module.exports = { isValidEmail, isValidCnic, EMAIL_REGEX, CNIC_REGEX };
