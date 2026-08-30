import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SKILL_ROOT, "../../..");
const SCRATCH_ROOT = path.join(SKILL_ROOT, "scratch");
const ARTIFACTS_ROOT = path.join(SKILL_ROOT, "artifacts");

const DEFAULT_PORT = 3847;
const DEFAULT_ADMIN_EMAIL = "verify@time-box.local";
const DEFAULT_ADMIN_PASSWORD = "verify-pass-12";
const READY_TIMEOUT_MS = 120_000;
const READY_POLL_MS = 500;

function usage() {
  console.error(
    "Usage: node control-time-box.mjs <launch|doctor|stop|print-env> [--run-id <id>] [--port <n>]"
  );
  process.exit(1);
}

function parseArgs(argv) {
  const command = argv[0];
  const options = { runId: process.env.TIME_BOX_VERIFY_RUN_ID, port: DEFAULT_PORT };

  for (let index = 1; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--run-id") {
      options.runId = argv[index + 1];
      index += 1;
      continue;
    }
    if (token === "--port") {
      options.port = Number(argv[index + 1]);
      index += 1;
      continue;
    }
  }

  if (!options.runId) {
    options.runId = `run-${Date.now()}`;
  }

  return { command, options };
}

function runDir(runId) {
  return path.join(SCRATCH_ROOT, runId);
}

function statePath(runId) {
  return path.join(runDir(runId), "instance.json");
}

function readState(runId) {
  const file = statePath(runId);
  if (!fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeState(runId, state) {
  const dir = runDir(runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statePath(runId), JSON.stringify(state, null, 2));
}

function isPidRunning(pid) {
  if (!pid || Number.isNaN(pid)) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function findListeningPid(port) {
  try {
    const result = spawnSync("netstat", ["-ano"], {
      encoding: "utf8",
      shell: true,
    });
    const needle = `:${port}`;
    for (const line of result.stdout.split("\n")) {
      if (!line.includes(needle) || !line.includes("LISTENING")) {
        continue;
      }
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts.at(-1));
      if (pid) {
        return pid;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function getInstancePid(state) {
  if (isPidRunning(state.pid)) {
    return state.pid;
  }
  return findListeningPid(state.port);
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          body: Buffer.concat(chunks).toString("utf8"),
        });
      });
    });
    request.on("error", reject);
    request.setTimeout(5_000, () => {
      request.destroy(new Error("timeout"));
    });
  });
}

async function waitForReady(baseUrl) {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await httpGet(baseUrl);
      if (response.statusCode >= 200 && response.statusCode < 500) {
        return response;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
  }
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

function runRepoCommand(args, env, logPath) {
  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  const result = spawnSync("pnpm", args, {
    cwd: REPO_ROOT,
    env,
    shell: true,
    encoding: "utf8",
  });

  logStream.write(`\n--- pnpm ${args.join(" ")} ---\n`);
  if (result.stdout) {
    logStream.write(result.stdout);
  }
  if (result.stderr) {
    logStream.write(result.stderr);
  }
  logStream.end();

  if (result.status !== 0) {
    throw new Error(
      `Command failed: pnpm ${args.join(" ")}\n${result.stderr || result.stdout}`
    );
  }
}

async function launch(options) {
  const runId = options.runId;
  const port = options.port;
  const dir = runDir(runId);
  const databasePath = path.join(dir, "verify.db");
  const logPath = path.join(dir, "dev.log");
  const baseUrl = `http://127.0.0.1:${port}`;
  const databaseUrl = `file:${databasePath.replace(/\\/g, "/")}`;

  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(ARTIFACTS_ROOT, runId), { recursive: true });

  const verifyEnv = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    NEXTAUTH_SECRET: process.env.TIME_BOX_VERIFY_NEXTAUTH_SECRET || "time-box-verify-secret",
    NEXTAUTH_URL: baseUrl,
    ADMIN_EMAIL: process.env.TIME_BOX_VERIFY_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL,
    ADMIN_PASSWORD:
      process.env.TIME_BOX_VERIFY_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
    TIME_BOX_VERIFY_RUN_ID: runId,
  };

  runRepoCommand(
    ["exec", "prisma", "migrate", "deploy"],
    verifyEnv,
    logPath
  );
  runRepoCommand(["exec", "tsx", "scripts/seed-admin.ts"], verifyEnv, logPath);

  const logStream = fs.createWriteStream(logPath, { flags: "a" });
  const child = spawn("pnpm", ["dev", "--port", String(port)], {
    cwd: REPO_ROOT,
    env: verifyEnv,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
  });

  child.stdout?.pipe(logStream);
  child.stderr?.pipe(logStream);
  child.unref();

  const state = {
    runId,
    port,
    baseUrl,
    pid: child.pid,
    databasePath,
    adminEmail: verifyEnv.ADMIN_EMAIL,
    adminPassword: verifyEnv.ADMIN_PASSWORD,
    logPath,
    artifactsDir: path.join(ARTIFACTS_ROOT, runId),
    startedAt: new Date().toISOString(),
  };

  writeState(runId, state);
  await waitForReady(baseUrl);

  console.log(JSON.stringify({ ok: true, ...state }, null, 2));
}

async function doctor(options) {
  const state = readState(options.runId);
  if (!state) {
    console.log(
      JSON.stringify({
        ok: false,
        runId: options.runId,
        reason: "missing_state",
      })
    );
    process.exitCode = 1;
    return;
  }

  const listenerPid = getInstancePid(state);
  const checks = {
    stateFile: true,
    processRunning: listenerPid !== null,
    listenerPid,
    httpOk: false,
    plannerMarker: false,
  };

  try {
    const response = await httpGet(state.baseUrl);
    checks.httpOk = response.statusCode >= 200 && response.statusCode < 500;
    checks.plannerMarker =
      response.body.includes("Daily Timeboxing Planner") ||
      response.body.includes("Timeboxing Planner");
  } catch {
    checks.httpOk = false;
  }

  const ok =
    checks.stateFile &&
    checks.processRunning &&
    checks.httpOk &&
    checks.plannerMarker;

  console.log(
    JSON.stringify({
      ok,
      runId: state.runId,
      baseUrl: state.baseUrl,
      pid: state.pid,
      databasePath: state.databasePath,
      artifactsDir: state.artifactsDir,
      checks,
    }, null, 2)
  );

  if (!ok) {
    process.exitCode = 1;
  }
}

function stop(options) {
  const state = readState(options.runId);
  if (!state) {
    console.log(JSON.stringify({ ok: true, runId: options.runId, stopped: false }));
    return;
  }

  const pid = getInstancePid(state);
  if (pid) {
    try {
      process.kill(pid);
    } catch {
      // ignore
    }
  }

  console.log(
    JSON.stringify({
      ok: true,
      runId: state.runId,
      stopped: true,
      artifactsDir: state.artifactsDir,
      scratchDir: runDir(state.runId),
    }, null, 2)
  );
}

function printEnv(options) {
  const state = readState(options.runId);
  if (!state) {
    console.error(`No state for run ${options.runId}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify(state, null, 2));
}

const { command, options } = parseArgs(process.argv.slice(2));
if (!command) {
  usage();
}

try {
  if (command === "launch") {
    await launch(options);
  } else if (command === "doctor") {
    await doctor(options);
  } else if (command === "stop") {
    stop(options);
  } else if (command === "print-env") {
    printEnv(options);
  } else {
    usage();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
