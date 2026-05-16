import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

function resolveOp(ref, account) {
  const args = ["read", ref];
  if (account) args.push("--account", account);
  return execFileSync("op", args, { encoding: "utf-8" }).trim();
}

function findArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return null;
}

function selectSite(profile, site) {
  const pairs = profile.auth_pairs || [];
  if (pairs.length === 0) {
    throw new Error("Profile has no auth_pairs");
  }

  if (site) {
    const normalized = site.replace(/\/+$/, "");
    const match = pairs.find(
      (p) => p.site.replace(/\/+$/, "") === normalized,
    );
    if (!match) {
      const available = pairs.map((p) => p.site).join(", ");
      throw new Error(
        `Site "${site}" not found in auth_pairs. Available: ${available}`,
      );
    }
    return match;
  }

  if (pairs.length === 1) return pairs[0];

  throw new Error(
    "Multiple auth_pairs found — use --site to select one. " +
      `Available: ${pairs.map((p) => p.site).join(", ")}`,
  );
}

function loadProfile(path) {
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  const site = findArg("--site");
  const pair = selectSite(raw, site);

  let llmApiKey = raw.llm_api_key || "";
  if (!llmApiKey && raw.llm_api_key_op) {
    llmApiKey = resolveOp(raw.llm_api_key_op, raw.op_account);
  }

  return {
    discourseUrl: pair.site,
    discourseUserApiKey: pair.user_api_key,
    discourseUserApiClientId:
      pair.user_api_client_id || "discourse-mcp",
    discourseApiKey: pair.api_key,
    discourseApiUsername: pair.api_username || "system",
    llmBaseUrl: raw.llm_base_url,
    llmModel: raw.llm_model,
    llmApiKey,
  };
}

function loadFromEnv() {
  return {
    discourseUrl: process.env.DISCOURSE_URL,
    discourseApiKey: process.env.DISCOURSE_API_KEY,
    discourseApiUsername: process.env.DISCOURSE_API_USERNAME || "system",
    discourseUserApiKey: process.env.DISCOURSE_USER_API_KEY,
    discourseUserApiClientId:
      process.env.DISCOURSE_USER_API_CLIENT_ID || "discourse-mcp",
    llmBaseUrl: process.env.LLM_BASE_URL,
    llmModel: process.env.LLM_MODEL,
    llmApiKey: process.env.LLM_API_KEY || "",
  };
}

export function loadConfig() {
  const profilePath = findArg("--profile");
  const config = profilePath ? loadProfile(profilePath) : loadFromEnv();

  const missing = [];
  if (!config.discourseUrl) missing.push("discourse_url / site");
  if (!config.llmBaseUrl) missing.push("llm_base_url / LLM_BASE_URL");
  if (!config.llmModel) missing.push("llm_model / LLM_MODEL");
  if (!config.discourseApiKey && !config.discourseUserApiKey) {
    missing.push("user_api_key or api_key");
  }

  if (missing.length > 0) {
    const source = profilePath ? `profile ${profilePath}` : "env vars";
    throw new Error(
      `Missing required config in ${source}: ${missing.join(", ")}`,
    );
  }

  return config;
}
