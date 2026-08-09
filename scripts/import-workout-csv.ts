import "dotenv/config";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../generated/prisma/client";
import {
  isWorkoutSubtaskStatus,
  isWorkoutType,
  type Workout,
} from "../lib/workout-day-data";

interface CsvRow {
  date: string;
  workoutName: string;
  workoutType: string;
  workoutCreatedAt: string;
  exerciseName: string;
  exerciseStatus: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i]!;
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\n" || (char === "\r" && next === "\n")) {
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      if (char === "\r") {
        i += 1;
      }
      continue;
    }

    if (char === "\r") {
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function rowsToWorkoutDays(rows: CsvRow[]): Map<string, Workout[]> {
  const byDate = new Map<string, Map<string, Workout>>();

  for (const row of rows) {
    if (!isWorkoutType(row.workoutType)) {
      throw new Error(`Invalid workout type: ${row.workoutType}`);
    }

    const dateWorkouts = byDate.get(row.date) ?? new Map<string, Workout>();
    const workoutKey = `${row.workoutCreatedAt}::${row.workoutName}::${row.workoutType}`;
    let workout = dateWorkouts.get(workoutKey);

    if (!workout) {
      workout = {
        id: randomUUID(),
        type: row.workoutType,
        name: row.workoutName,
        createdAt: row.workoutCreatedAt,
        subtasks: [],
      };
      dateWorkouts.set(workoutKey, workout);
    }

    if (row.exerciseName.trim()) {
      workout.subtasks.push({
        id: randomUUID(),
        name: row.exerciseName,
        status: isWorkoutSubtaskStatus(row.exerciseStatus)
          ? row.exerciseStatus
          : "pending",
      });
    }

    byDate.set(row.date, dateWorkouts);
  }

  return new Map(
    [...byDate.entries()].map(([date, workouts]) => [
      date,
      [...workouts.values()],
    ]),
  );
}

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    throw new Error("Usage: pnpm tsx scripts/import-workout-csv.ts <csv-path>");
  }

  const databaseUrl = requireEnv("DATABASE_URL");
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();

  const adapter = new PrismaLibSql({ url: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error(`No user found for ${email}. Run seed:admin first.`);
    }

    const raw = readFileSync(csvPath, "utf8");
    const table = parseCsv(raw);
    if (table.length < 2) {
      throw new Error("CSV has no data rows");
    }

    const header = table[0]!;
    const expected = [
      "Date",
      "Workout Name",
      "Workout Type",
      "Workout Created At",
      "Exercise Name",
      "Exercise Status",
    ];
    if (header.join(",") !== expected.join(",")) {
      throw new Error(`Unexpected CSV header: ${header.join(",")}`);
    }

    const csvRows: CsvRow[] = table.slice(1).map((cells) => ({
      date: cells[0] ?? "",
      workoutName: cells[1] ?? "",
      workoutType: cells[2] ?? "",
      workoutCreatedAt: cells[3] ?? "",
      exerciseName: cells[4] ?? "",
      exerciseStatus: cells[5] ?? "",
    }));

    const days = rowsToWorkoutDays(csvRows);
    let upserted = 0;

    for (const [date, workouts] of days) {
      const data = JSON.stringify({
        workouts,
        lastSaved: new Date().toISOString(),
      });

      await prisma.workoutDay.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date,
          },
        },
        update: { data },
        create: {
          userId: user.id,
          date,
          data,
        },
      });
      upserted += 1;
    }

    const workoutCount = [...days.values()].reduce(
      (sum, workouts) => sum + workouts.length,
      0,
    );

    console.log(
      `Imported ${workoutCount} workouts across ${upserted} days for ${email} from ${csvPath}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Failed to import workout CSV:", error);
  process.exitCode = 1;
});
