"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { AuthPageShell } from "@/app/components/auth-page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MAX_REGISTRATION_EMAIL_LENGTH,
  MAX_REGISTRATION_NAME_LENGTH,
  MAX_REGISTRATION_PASSWORD_LENGTH,
  MIN_REGISTRATION_PASSWORD_LENGTH,
} from "@/lib/registration";

type RegisterResponse = {
  error?: string;
};

type AccessResponse = {
  allowed?: boolean;
  error?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkRegistrationAccess() {
      setIsCheckingRegistration(true);

      try {
        const response = await fetch("/api/settings/access?feature=registration");
        const result = (await response.json()) as AccessResponse;

        if (!cancelled) {
          setRegistrationEnabled(response.ok && result.allowed === true);
          setError(response.ok ? "" : result.error ?? "Unable to check registration");
        }
      } catch {
        if (!cancelled) {
          setRegistrationEnabled(false);
          setError("Unable to check registration");
        }
      } finally {
        if (!cancelled) {
          setIsCheckingRegistration(false);
        }
      }
    }

    void checkRegistrationAccess();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email: normalizedEmail,
          password,
        }),
      });
      const result = (await response.json()) as RegisterResponse;

      if (!response.ok) {
        setError(result.error ?? "Unable to create your account");
        return;
      }

      const signInResult = await signIn("credentials", {
        email: normalizedEmail,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError("Account created, but sign in failed. Please sign in.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingRegistration) {
    return (
      <AuthPageShell
        title="Create account"
        description="Checking whether registration is open."
        footer={
          <>
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </>
        }
      >
        <div className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">
          Loading registration settings...
        </div>
      </AuthPageShell>
    );
  }

  if (!registrationEnabled) {
    return (
      <AuthPageShell
        title="Registration closed"
        description="New user registration is currently disabled."
        footer={
          <>
            Already have an account?{" "}
            <Link className="font-medium text-primary hover:underline" href="/login">
              Sign in
            </Link>
          </>
        }
      >
        <div
          role="alert"
          className="rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground"
        >
          Please check back later or ask an administrator to reopen registration.
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Create account"
      description="Save your planner and workouts across devices."
      footer={
        <>
          Already have an account?{" "}
          <Link className="font-medium text-primary hover:underline" href="/login">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="h-11 bg-background"
            maxLength={MAX_REGISTRATION_NAME_LENGTH}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="h-11 bg-background"
            maxLength={MAX_REGISTRATION_EMAIL_LENGTH}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 bg-background pr-16"
              minLength={MIN_REGISTRATION_PASSWORD_LENGTH}
              maxLength={MAX_REGISTRATION_PASSWORD_LENGTH}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm-password"
              name="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11 bg-background pr-16"
              minLength={MIN_REGISTRATION_PASSWORD_LENGTH}
              maxLength={MAX_REGISTRATION_PASSWORD_LENGTH}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </Button>
          </div>
        </div>

        <Button
          className="h-11 w-full active:scale-[0.98] ease-out will-change-transform motion-reduce:transition-none motion-reduce:active:scale-100"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
