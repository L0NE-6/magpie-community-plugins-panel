import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Lang } from "../vendor/cam/core/lang.ts";
import { MAX_FETCH_CHARS } from "./retrieval.ts";

export type CamOptions = {
  dataDir: string;
  panelDir: string;
  language: Lang;
  auto: boolean;
  allowRemote: boolean;
  gatewayTimeoutMs: number;
  maxFetchImages: number;
  maxFetchBytes: number;
};

const integer = (value: unknown, fallback: number, min: number, max: number) =>
  Number.isInteger(value) ? Math.min(max, Math.max(min, Number(value))) : fallback;

export function defaultDataDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.MAGPIE_CAM_DATA_DIR?.trim() || join(homedir(), ".config", "magpie", "cam");
}

export function defaultPanelDir(env: NodeJS.ProcessEnv = process.env): string {
  return env.MAGPIE_CAM_PANEL_DIR?.trim() || join(import.meta.dirname, "..", "panel");
}

export function resolveOptions(raw: Record<string, unknown> = {}, env: NodeJS.ProcessEnv = process.env): CamOptions {
  const dataDir = typeof raw.dataDir === "string" && raw.dataDir.trim() ? raw.dataDir.trim() : defaultDataDir(env);
  const panelDir = typeof raw.panelDir === "string" && raw.panelDir.trim() ? raw.panelDir.trim() : defaultPanelDir(env);
  return {
    dataDir: resolve(dataDir),
    panelDir: resolve(panelDir),
    language: raw.language === "en" ? "en" : "zh",
    auto: raw.auto !== false,
    allowRemote: raw.allowRemote === true,
    gatewayTimeoutMs: integer(raw.gatewayTimeoutMs, 10_000, 100, 30_000),
    maxFetchImages: integer(raw.maxFetchImages, 4, 1, 8),
    maxFetchBytes: integer(raw.maxFetchBytes, 12 * 1024 * 1024, 1024, MAX_FETCH_CHARS),
  };
}
