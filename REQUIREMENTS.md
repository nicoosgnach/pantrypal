# Setup Requirements

**Read this before you start the timer.** This assessment gives you a 3-hour timebox to build a TypeScript system from scratch. You scaffold it with the Vercel AI SDK. The system uses LLM tool-use, an external web-search tool, a chat frontend, and a Docker setup. Nothing is pre-installed, so put the toolchain and keys below in place first. Setup time is not working time. Budget about 20 minutes.

## Hardware & OS

- macOS (Apple Silicon or Intel), Linux, or Windows with WSL2.
- ~4 GB free RAM and ~4 GB free disk.

## Required tools

| Tool | Version | Check | Install |
|------|---------|-------|---------|
| Node.js | 20 LTS or newer | `node --version` | https://nodejs.org (or `nvm`) |
| A package manager | npm (bundled), or pnpm/yarn | `npm --version` | n/a |
| Docker Desktop / Engine | Compose v2 (`docker compose`) | `docker compose version` | https://docs.docker.com/get-docker/ |
| Git | any recent | `git --version` | https://git-scm.com |

You choose the backend framework, such as Next.js, Hono, or Express, and the frontend approach. Have your preferred scaffolding tools ready.

## Accounts / keys: **required**

- **An LLM API key.** The Vercel AI SDK needs a provider. Bring your own **Anthropic** (https://console.anthropic.com) or **OpenAI** (https://platform.openai.com) key. PressW does not supply one.
  - These keys are paid, but this assessment uses only a few cents of tokens.
- **A web-search tool.** One deliverable is an external web-search tool. Decide your approach beforehand. A free or low-cost search API works well, such as [Tavily](https://tavily.com) or [Brave Search API](https://brave.com/search/api/). Get its key, which is also your own. You may use another approach if you prefer. Just do not discover the need for a key mid-assessment.

Put keys in a `.env` or `.env.local` file. Never commit them.

## Pre-flight check

Run this the day before, not when the timer starts:

```bash
node --version                         # expect v20+
npm --version
docker compose version                 # expect Compose v2.x
# confirm your LLM key works, e.g. for Anthropic:
curl https://api.anthropic.com/v1/models -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01"
```

If your toolchain runs and your API key returns a valid response, you are ready to scaffold.
