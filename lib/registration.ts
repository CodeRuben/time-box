export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
};

type RegistrationValidationResult =
  | { data: RegistrationInput }
  | { error: string; status: number };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MAX_REGISTRATION_NAME_LENGTH = 100;
export const MAX_REGISTRATION_EMAIL_LENGTH = 254;
export const MIN_REGISTRATION_PASSWORD_LENGTH = 8;
export const MAX_REGISTRATION_PASSWORD_LENGTH = 256;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getStringField(body: Record<string, unknown>, field: string) {
  const value = body[field];
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeRegistrationEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateRegistrationBody(
  body: unknown
): RegistrationValidationResult {
  if (!isRecord(body)) {
    return { error: "Invalid registration payload", status: 400 };
  }

  const name = getStringField(body, "name");
  const email = normalizeRegistrationEmail(getStringField(body, "email"));
  const password = typeof body.password === "string" ? body.password : "";

  if (!name || !email || !password.trim()) {
    return { error: "Name, email, and password are required", status: 400 };
  }

  if (name.length > MAX_REGISTRATION_NAME_LENGTH) {
    return { error: "Name must be 100 characters or less", status: 400 };
  }

  if (
    email.length > MAX_REGISTRATION_EMAIL_LENGTH ||
    !EMAIL_PATTERN.test(email)
  ) {
    return { error: "Enter a valid email address", status: 400 };
  }

  if (password.length < MIN_REGISTRATION_PASSWORD_LENGTH) {
    return {
      error: "Password must be at least 8 characters long",
      status: 400,
    };
  }

  if (password.length > MAX_REGISTRATION_PASSWORD_LENGTH) {
    return {
      error: "Password must be 256 characters or less",
      status: 400,
    };
  }

  return {
    data: {
      name,
      email,
      password,
    },
  };
}

export function isRegistrationValidationError(
  result: RegistrationValidationResult
): result is { error: string; status: number } {
  return "error" in result;
}
