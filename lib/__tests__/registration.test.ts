import { describe, expect, it } from "vitest";
import {
  isRegistrationValidationError,
  normalizeRegistrationEmail,
  validateRegistrationBody,
} from "../registration";

describe("normalizeRegistrationEmail", () => {
  it("trims and lowercases emails", () => {
    expect(normalizeRegistrationEmail("  USER@Example.COM ")).toBe(
      "user@example.com"
    );
  });
});

describe("validateRegistrationBody", () => {
  it("returns normalized registration data for valid input", () => {
    const result = validateRegistrationBody({
      name: "  Ruben  ",
      email: " RUBEN@example.COM ",
      password: "password123",
    });

    expect(isRegistrationValidationError(result)).toBe(false);
    if (!isRegistrationValidationError(result)) {
      expect(result.data).toEqual({
        name: "Ruben",
        email: "ruben@example.com",
        password: "password123",
      });
    }
  });

  it("rejects missing required fields", () => {
    const result = validateRegistrationBody({
      name: "",
      email: "user@example.com",
      password: "password123",
    });

    expect(result).toEqual({
      error: "Name, email, and password are required",
      status: 400,
    });
  });

  it("rejects invalid email addresses", () => {
    const result = validateRegistrationBody({
      name: "Ruben",
      email: "not-an-email",
      password: "password123",
    });

    expect(result).toEqual({
      error: "Enter a valid email address",
      status: 400,
    });
  });

  it("rejects short passwords", () => {
    const result = validateRegistrationBody({
      name: "Ruben",
      email: "user@example.com",
      password: "short",
    });

    expect(result).toEqual({
      error: "Password must be at least 8 characters long",
      status: 400,
    });
  });

  it("rejects passwords that are too long", () => {
    const result = validateRegistrationBody({
      name: "Ruben",
      email: "user@example.com",
      password: "a".repeat(257),
    });

    expect(result).toEqual({
      error: "Password must be 256 characters or less",
      status: 400,
    });
  });
});
