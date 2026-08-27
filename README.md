# Free AI Commit Message

A VS Code extension to automatically generate clean, structured Conventional Commit messages from your staged Git changes.

Bring your own key: works seamlessly with local models (Ollama), generous free endpoints (Google AI Studio Gemini, OpenRouter Free, Groq, GitHub Models), as well as DeepSeek, OpenAI, and Anthropic Claude.

## Features

- **Profile-Based Providers:** Easily switch between Gemini, OpenRouter, Groq, Ollama, GitHub Models, DeepSeek, OpenAI, Claude, or any OpenAI-compatible endpoint.
- **Secure Key Storage:** API keys are stored securely in VS Code's `SecretStorage`, never in plaintext settings files or repository commits.
- **Conventional Commits First:** Generates standard Conventional Commit messages (`<type>(<scope>): <subject>`) by default. Optional Gitmoji prefix toggle available.
- **Diff Safety & Truncation:** Configurable diff limit (`maxDiffCharacters`) and overflow strategies (`truncate` or `fail`) protect context windows and token budgets.
- **Serve-Web & Remote Safe:** Pure Node-targeted extension fully compatible with VS Code Server / serve-web environments.
- **Multi-language Support:** Supports commit messages in 19 languages.

## Default Provider Presets (Tailored for Free Tiers)

| Profile | Kind | Default Base URL | Default Model | Free Tier Details |
| :--- | :--- | :--- | :--- | :--- |
| `gemini` | `gemini` | N/A | `gemini-2.0-flash-lite` | Google AI Studio free tier: 30 RPM, 1,500 requests/day, 1M TPM |
| `openrouter` | `openai-compatible` | `https://openrouter.ai/api/v1` | `openrouter/free` | Auto-routes to currently available zero-cost free models on OpenRouter |
| `groq` | `openai-compatible` | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | Groq Cloud free tier: 30 RPM, 14,400 requests/day, sub-second latency |
| `ollama` | `openai-compatible` | `http://localhost:11434/v1` | `qwen2.5-coder:3b` | 100% offline, private, zero cost, coding specialist model |
| `github` | `openai-compatible` | `https://models.inference.ai.azure.com` | `gpt-4o-mini` | GitHub Models free tier: uses standard GitHub Personal Access Token |
| `deepseek` | `openai-compatible` | `https://api.deepseek.com` | `deepseek-chat` | Official DeepSeek V3 chat endpoint |
| `openai` | `openai-compatible` | `https://api.openai.com/v1` | `gpt-4o-mini` | OpenAI Chat Completions endpoint |
| `claude` | `claude` | N/A | `claude-3-5-haiku-20241022` | Anthropic Messages API endpoint |

Custom profiles can be configured via `aiCommitMessage.profiles`.

## Setup & Quick Start

1. **Stage your changes:**
   ```bash
   git add <files...>
   ```
2. **Select your active profile:**
   Run command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):
   `Free AI Commit: Select Provider Profile` (command `aiCommitMessage.selectProfile`)
3. **Set your API key (if required by provider):**
   Run `Free AI Commit: Set API Key for Active Profile` (command `aiCommitMessage.setApiKey`).
   *Note: Local Ollama on localhost does not require an API key.*
4. **Generate commit message:**
   Click the commit icon in the Source Control (SCM) title bar or run `Free AI Commit: Generate Commit Message` (`aiCommitMessage.generateMessage`).

## Configuration Options

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `aiCommitMessage.activeProfile` | `string` | `"gemini"` | Name of active profile in `aiCommitMessage.profiles` or default presets |
| `aiCommitMessage.profiles` | `object` | `{}` | Custom profile overrides or additions |
| `aiCommitMessage.language` | `string` | `"English"` | Commit message language (19 choices) |
| `aiCommitMessage.enableGitmoji` | `boolean` | `false` | Prefix commit type with Gitmoji emoji |
| `aiCommitMessage.customSystemPrompt` | `string` | `""` | Optional system prompt overriding the default template |
| `aiCommitMessage.maxDiffCharacters` | `number` | `60000` | Maximum diff character count sent to model |
| `aiCommitMessage.diffOverflowStrategy` | `string` | `"truncate"` | Action when diff exceeds limit (`truncate` or `fail`) |
| `aiCommitMessage.temperature` | `number` | `0.7` | Model sampling temperature (0.0 to 2.0) |

## Data & Privacy

- Staged diffs are sent exclusively to the endpoint configured in your active profile.
- API keys are stored in VS Code `SecretStorage` and are never written to repository files or settings JSON.

## License

MIT License — see [LICENSE](license.txt) for details. Forked with gratitude from `sitoi/ai-commit`.
