import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const databaseUrl = requireEnv("DATABASE_URL");
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Admin";

  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters long");
  }

  const adapter = new PrismaLibSql({
    url: databaseUrl,
  });
  const prisma = new PrismaClient({ adapter });
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
        },
      });

      console.log(`Updated admin account for ${email}.`);
      return;
    }

    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });

    console.log(`Created admin account for ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to seed admin account:", error);
  process.exitCode = 1;
});
