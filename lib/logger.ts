import { appendFileSync, existsSync, mkdirSync } from "fs";
import { dirname } from "path";

const LOG_DIR = process.env.LOG_DIR || "./logs";
const LOG_FILE = `${LOG_DIR}/agent.log`;

function ensureLogDir() {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function log(level: "INFO" | "ERROR" | "DEBUG", message: string, data?: unknown) {
  ensureLogDir();
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}${data ? ` ${JSON.stringify(data)}` : ""}\n`;
  appendFileSync(LOG_FILE, logEntry);
  if (level === "ERROR") {
    console.error(logEntry);
  } else {
    console.log(logEntry);
  }
}

export const logger = {
  info: (msg: string, data?: unknown) => log("INFO", msg, data),
  error: (msg: string, data?: unknown) => log("ERROR", msg, data),
  debug: (msg: string, data?: unknown) => log("DEBUG", msg, data),
};
