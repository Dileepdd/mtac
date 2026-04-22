type LogLevel = "info" | "warn" | "error";

const log = (level: LogLevel, event: string, meta?: Record<string, unknown>) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...meta,
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
};

export const logger = {
  info: (event: string, meta?: Record<string, unknown>) => log("info", event, meta),
  warn: (event: string, meta?: Record<string, unknown>) => log("warn", event, meta),
  error: (event: string, meta?: Record<string, unknown>) => log("error", event, meta),
};
