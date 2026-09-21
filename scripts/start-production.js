#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const BACKEND_DIR = path.join(ROOT, "backend", "Backend");
const ML_SCRIPT = path.join(ROOT, "backend", "ML", "api_server.py");

const ML_PORT = process.env.ML_PORT || "8000";

const PYTHON_CANDIDATES =
  process.platform === "win32"
    ? ["python", "py", "python3"]
    : ["python3", "python"];

let pythonCommand = null;

for (const command of PYTHON_CANDIDATES) {
  const result = spawnSync(command, ["--version"], {
    stdio: "ignore",
  });

  if (!result.error) {
    pythonCommand = command;
    break;
  }
}

if (!pythonCommand) {
  console.error(
    `[start-production] Python not found. Tried: ${PYTHON_CANDIDATES.join(
      ", ",
    )}`,
  );

  process.exit(1);
}

console.log("==========================================");
console.log(" Railway AI - Combined Backend + ML");
console.log("==========================================");
console.log(`Python: ${pythonCommand}`);
console.log(`ML port: ${ML_PORT}`);
console.log("Starting ML service...");
console.log("Starting Node backend...");
console.log("==========================================");

//
// Start ML
//
const mlProcess = spawn(pythonCommand, [ML_SCRIPT, ML_PORT], {
  cwd: ROOT,
  env: {
    ...process.env,
  },
  stdio: "inherit",
});

//
// Start Backend
//
// Force the ML URL to localhost because both services
// now live inside the same deployment/container.
//
const backendEnv = {
  ...process.env,
  ML_SERVICE_URL: `http://127.0.0.1:${ML_PORT}`,
  ML_API_URL: `http://127.0.0.1:${ML_PORT}`,
};

const backendProcess = spawn(process.execPath, ["src/server.js"], {
  cwd: BACKEND_DIR,
  env: backendEnv,
  stdio: "inherit",
});

let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;

  shuttingDown = true;

  console.log(`\n[start-production] Received ${signal}`);
  console.log("[start-production] Shutting down services...");

  if (mlProcess && !mlProcess.killed) {
    mlProcess.kill("SIGTERM");
  }

  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill("SIGTERM");
  }

  setTimeout(() => {
    if (mlProcess && !mlProcess.killed) {
      mlProcess.kill("SIGKILL");
    }

    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill("SIGKILL");
    }

    process.exit(0);
  }, 5000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

mlProcess.on("exit", (code, signal) => {
  console.log(
    `[start-production] ML process exited. code=${code}, signal=${signal}`,
  );

  if (!shuttingDown) {
    console.error(
      "[start-production] ML stopped unexpectedly. Stopping combined service.",
    );

    shutdown("ML_EXIT");
  }
});

backendProcess.on("exit", (code, signal) => {
  console.log(
    `[start-production] Backend process exited. code=${code}, signal=${signal}`,
  );

  if (!shuttingDown) {
    console.error(
      "[start-production] Backend stopped unexpectedly. Stopping combined service.",
    );

    shutdown("BACKEND_EXIT");
  }
});
