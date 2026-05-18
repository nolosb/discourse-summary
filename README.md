# discourse-summary

MCP server that fetches Discourse data and summarizes it through a self-hosted LLM. Claude receives condensed analysis instead of raw posts — saving tokens on expensive models.

## Quick Start

### Step 1: Clone and Install

```bash
git clone https://github.com/nolosb/discourse-summary.git
cd discourse-summary
npm install
```

### Step 2: Get a Discourse API Key

Use the official Discourse MCP server to generate a User API Key:

```bash
npx @discourse/mcp@latest generate-user-api-key \
  --site https://your-site.example.com \
  --save-to ~/mcps/my_profile.json \
  --scopes "read" \
  --application-name "Discourse Summary"
```

### Step 3: Add LLM Config to Your Profile

Edit the profile file to add your LLM endpoint:

```json
{
  "auth_pairs": [{
    "site": "https://your-site.example.com",
    "user_api_key": "<your-user-api-key>",
    "user_api_client_id": "discourse-mcp"
  }],
  "llm_base_url": "https://your-llm-endpoint/v1",
  "llm_model": "your-model-name",
  "llm_api_key": "optional-if-needed"
}
```

The `auth_pairs` format is compatible with `@discourse/mcp` profiles — you just add the `llm_*` fields alongside.

Any OpenAI-compatible API works: vLLM, Ollama, llama.cpp, OpenRouter, etc.

### Step 4: Connect to Your MCP Client

**Claude Code:**

```bash
claude mcp add discourse-summary-dev --scope user \
  node -- /path/to/discourse-summary/src/index.js --profile ~/mcps/my_profile.json
```

**Claude Desktop** (`claude.json`):

```json
{
  "mcpServers": {
    "discourse-summary-dev": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/path/to/discourse-summary/src/index.js",
        "--profile",
        "/path/to/my_profile.json"
      ]
    }
  }
}
```

### Multiple Sites

Add multiple entries to `auth_pairs` and use `--site` to select:

```json
{
  "auth_pairs": [
    { "site": "https://first-site.example.com", "user_api_key": "..." },
    { "site": "https://second-site.example.com", "user_api_key": "..." }
  ],
  "llm_base_url": "...",
  "llm_model": "..."
}
```

```bash
claude mcp add discourse-summary-dev --scope user \
  node -- /path/to/discourse-summary/src/index.js \
  --profile ~/mcps/profile.json --site https://first-site.example.com
```

If the profile has only one `auth_pairs` entry, `--site` is optional.

## Usage

One tool, four scopes:

```
discourse_summary(scope, target, period?, focus?)
```

| Scope | Target | Example |
|---|---|---|
| `user` | Username | `discourse_summary(scope: "user", target: "harold")` |
| `topic` | Topic ID | `discourse_summary(scope: "topic", target: "12345")` |
| `query` | Search term | `discourse_summary(scope: "query", target: "design tokens")` |
| `group` | Group name | `discourse_summary(scope: "group", target: "team")` |

### Period

Flexible time ranges (ignored for topic scope):

- `"1 week"`, `"3 months"`, `"1 year"`
- `"2025-01-01 to 2025-06-01"`
- Default: 6 months

### Prompt

Each scope has a built-in analysis prompt tuned for that kind of data. The prompt can be overridden for more specific use cases.

## How It Works

1. Claude calls `discourse_summary` with a scope and target
2. The server fetches raw data from the Discourse REST API
3. The raw data goes to your self-hosted LLM for analysis
4. Claude receives only the condensed summary

Claude never sees the raw posts. The bulk of token processing happens on your LLM.

## Environment Variables

As an alternative to profiles, you can configure via env vars:

| Variable | Required | Description |
|---|---|---|
| `DISCOURSE_URL` | Yes | Discourse instance URL |
| `DISCOURSE_API_KEY` | * | Admin API key |
| `DISCOURSE_USER_API_KEY` | * | User API key (recommended) |
| `DISCOURSE_API_USERNAME` | No | API username (default: `system`) |
| `LLM_BASE_URL` | Yes | OpenAI-compatible API endpoint |
| `LLM_MODEL` | Yes | Model name |
| `LLM_API_KEY` | No | API key for the LLM endpoint |

\* One of `DISCOURSE_API_KEY` or `DISCOURSE_USER_API_KEY` is required.

## 1Password Integration

For profiles, you can use 1Password references instead of storing LLM keys in plaintext:

```json
{
  "llm_api_key_op": "op://Vault/Item/credential",
  "op_account": "your-team.1password.com"
}
```

The server resolves these via `op read` at startup.
