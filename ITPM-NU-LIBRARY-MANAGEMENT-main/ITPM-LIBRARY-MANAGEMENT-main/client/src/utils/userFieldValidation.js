const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

/** Nine digits after +94 (national number). */
const SL_DIGITS_RE = /^\d{9}$/;

/** At least one symbol such as @, #, $, etc. */
const PASSWORD_SPECIAL_RE = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

/** Latin, Sinhala, or Tamil letters for place names */
const ADDRESS_HAS_LETTER = /[a-zA-Z\u0D80-\u0DFF\u0B80-\u0BFF]/;

const VALID_ROLES = ["Admin", "Librarian", "Student"];
const VALID_STATUS = ["Active", "Restricted", "Suspended"];

export const buildPhoneE164 = (nineDigits) => `+94${nineDigits}`;

/** Normalize stored phone (e.g. +94771234567) to 9 national digits for the input field. */
export const phoneStorageToDigits = (phone) => {
  if (!phone) return "";
  const d = String(phone).replace(/\D/g, "");
  if (d.length >= 11 && d.startsWith("94")) return d.slice(2, 11);
  if (d.length === 9) return d;
  if (d.length > 9) return d.slice(-9);
  return d.slice(0, 9);
};

export const initialUserFieldErrors = () => ({
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
});

export const initialAdminUserFieldErrors = () => ({
  ...initialUserFieldErrors(),
  role: "",
  status: "",
});

/** 5 checks: length ≥8, lower, upper, digit, special — maps to weak / medium / strong. */
export const getPasswordStrength = (pwd) => {
  if (!pwd) {
    return { score: 0, label: "", tone: "none" };
  }
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd)) score += 1;
  if (PASSWORD_SPECIAL_RE.test(pwd)) score += 1;

  if (score <= 2) {
    return { score, label: "Weak", tone: "weak" };
  }
  if (score <= 4) {
    return { score, label: "Medium", tone: "medium" };
  }
  return { score, label: "Strong", tone: "strong" };
};

export const strengthToneClasses = {
  weak: {
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    track: "bg-rose-100 dark:bg-rose-950/50",
  },
  medium: {
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    track: "bg-amber-100 dark:bg-amber-950/40",
  },
  strong: {
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    track: "bg-emerald-100 dark:bg-emerald-950/40",
  },
};

const validatePasswordValue = (password, errors) => {
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (password.length > 128) {
    errors.password = "Password must be at most 128 characters.";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Include at least one lowercase letter.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Include at least one uppercase letter.";
  } else if (!/\d/.test(password)) {
    errors.password = "Include at least one number.";
  } else if (!PASSWORD_SPECIAL_RE.test(password)) {
    errors.password = "Include at least one special character (e.g. @ # $ % &).";
  }
};

export const validateRegisterForm = (form) => {
  const errors = initialUserFieldErrors();
  const name = form.name.trim();
  const email = form.email.trim();
  const password = form.password;
  const phoneDigits = form.phoneDigits.replace(/\D/g, "");
  const address = form.address.trim();

  if (!name) {
    errors.name = "Full name is required.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Name must be at most 100 characters.";
  } else if (!/[a-zA-Z]/.test(name)) {
    errors.name = "Name must include at least one letter.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  validatePasswordValue(password, errors);

  if (!phoneDigits) {
    errors.phone = "Enter your 9-digit mobile number (after +94).";
  } else if (!SL_DIGITS_RE.test(phoneDigits)) {
    errors.phone = "Use exactly 9 digits (e.g. 771234567).";
  }

  if (!address) {
    errors.address = "Address is required.";
  } else if (address.length < 2) {
    errors.address = "Enter area, town, or city (e.g. Jaffna, Meesalai, Colombo).";
  } else if (address.length > 500) {
    errors.address = "Address is too long (max 500 characters).";
  } else if (!ADDRESS_HAS_LETTER.test(address)) {
    errors.address = "Use letters for place names (English, Tamil, or Sinhala).";
  }

  return errors;
};

/**
 * Same rules as registration for profile fields; password optional when editing and left blank.
 */
export const validateAdminUserForm = (form, { isEdit }) => {
  const errors = initialAdminUserFieldErrors();
  const name = form.name.trim();
  const email = form.email.trim();
  const password = form.password;
  const phoneDigits = form.phoneDigits.replace(/\D/g, "");
  const address = form.address.trim();

  if (!name) {
    errors.name = "Full name is required.";
  } else if (name.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (name.length > 100) {
    errors.name = "Name must be at most 100 characters.";
  } else if (!/[a-zA-Z]/.test(name)) {
    errors.name = "Name must include at least one letter.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (isEdit) {
    if (password) {
      validatePasswordValue(password, errors);
    }
  } else {
    validatePasswordValue(password, errors);
  }

  if (!phoneDigits) {
    errors.phone = "Enter your 9-digit mobile number (after +94).";
  } else if (!SL_DIGITS_RE.test(phoneDigits)) {
    errors.phone = "Use exactly 9 digits (e.g. 771234567).";
  }

  if (!address) {
    errors.address = "Address is required.";
  } else if (address.length < 2) {
    errors.address = "Enter area, town, or city (e.g. Jaffna, Meesalai, Colombo).";
  } else if (address.length > 500) {
    errors.address = "Address is too long (max 500 characters).";
  } else if (!ADDRESS_HAS_LETTER.test(address)) {
    errors.address = "Use letters for place names (English, Tamil, or Sinhala).";
  }

  if (!VALID_ROLES.includes(form.role)) {
    errors.role = "Select a valid role.";
  }
  if (!VALID_STATUS.includes(form.status)) {
    errors.status = "Select a valid status.";
  }

  return errors;
};

export const hasFieldErrors = (errors) => Object.values(errors).some(Boolean);
