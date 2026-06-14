import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerAuthSession } from "@/lib/auth";
import { getSessionFeatureAccess } from "@/lib/feature-access";
import { getClientIpFromHeaders } from "@/lib/login-rate-limit";
import { prisma } from "@/lib/prisma";
import { consumeRegistrationRateLimit } from "@/lib/registration-rate-limit";
import {
  MAX_REGISTRATION_EMAIL_LENGTH,
  MAX_REGISTRATION_NAME_LENGTH,
  MAX_REGISTRATION_PASSWORD_LENGTH,
  isRegistrationValidationError,
  validateRegistrationBody,
} from "@/lib/registration";

const MAX_REGISTRATION_BODY_BYTES =
  MAX_REGISTRATION_NAME_LENGTH +
  MAX_REGISTRATION_EMAIL_LENGTH +
  MAX_REGISTRATION_PASSWORD_LENGTH +
  1024;

type JsonBodyResult =
  | { body: unknown }
  | { error: string; status: 400 | 413 };

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function isBodyTooLarge(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return false;
  }

  const size = Number.parseInt(contentLength, 10);
  return Number.isFinite(size) && size > MAX_REGISTRATION_BODY_BYTES;
}

async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  if (isBodyTooLarge(request)) {
    return { error: "Registration request is too large", status: 413 };
  }

  if (!request.body) {
    return { error: "Invalid JSON body", status: 400 };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_REGISTRATION_BODY_BYTES) {
        return { error: "Registration request is too large", status: 413 };
      }

      chunks.push(value);
    }

    const buffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return { body: JSON.parse(new TextDecoder().decode(buffer)) };
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const registrationEnabled = await getSessionFeatureAccess(
    await getServerAuthSession(),
    "registration"
  );

  if (!registrationEnabled) {
    return NextResponse.json(
      { error: "New user registration is currently closed" },
      { status: 403 }
    );
  }

  const raw = await readJsonBody(request);
  if ("error" in raw) {
    return NextResponse.json({ error: raw.error }, { status: raw.status });
  }

  const result = validateRegistrationBody(raw.body);
  if (isRegistrationValidationError(result)) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }

  const rateLimitKey = {
    clientIp: getClientIpFromHeaders(request.headers),
    email: result.data.email,
  };

  if (await consumeRegistrationRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please try again later." },
      { status: 429 }
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: result.data.email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(result.data.password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        email: result.data.email,
        name: result.data.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    throw error;
  }
}
