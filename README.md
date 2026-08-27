<div align="center">

# Free AI Commit Message

**Generate clean, conventional Git commit messages using free AI provider tiers (Gemini, Groq, OpenRouter), local Ollama, or bring your own key (DeepSeek, OpenAI, Claude).**

Works out-of-the-box with **Gemini (1,500 req/day free)**, **Groq (14,400 req/day free)**, **GitHub Models**, **OpenRouter**, and **100% offline local Ollama**, as well as DeepSeek, OpenAI, and Anthropic Claude.

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/christiangennari.free-ai-commit-message?logo=visualstudiocode&label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=christiangennari.free-ai-commit-message)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](license.txt)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/Christian-Gennari/vscode-extension-free-ai-commit-message)

</div>

> **Using a JetBrains IDE?** (Rider, IntelliJ IDEA, PyCharm, WebStorm, etc.) Check out the sibling plugin: [Free AI Commit Message for JetBrains IDEs](https://github.com/Christian-Gennari/jetbrains-plugin-free-ai-commit-message).

---

## Quick Start

1. **Stage your Git changes:**
   ```bash
   git add <files...>
   ```
2. **Set your API Key:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Select **`Free AI Commit: Set API Key for Active Profile`**
   - Paste your key *(saved securely in VS Code's OS-encrypted keychain)*.
3. **Generate your Commit Message:**
   - Click the **Sparkle icon** (`✨`) in the Source Control (SCM) title bar, or run **`Free AI Commit: Generate AI Commit Message`** (`Ctrl+Shift+P`).

---

## Provider Recommendations

Providers ranked by speed, reliability, and free daily quota:

| Rank | Provider | Default Model | Speed & Characteristics | Free Daily Quota | Key Source |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **#1** | **Google Gemini** *(Default)* | `gemini-3.5-flash-lite` | Highest reliability & quality | **1,500 req/day** (30 RPM) | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **#2** | **Groq Cloud** | `openai/gpt-oss-120b` | Fastest (~300ms LPU latency) | **14,400 req/day** (30 RPM) | [Groq Console](https://console.groq.com/keys) |
| **#3** | **Ollama** | `qwen2.5-coder:3b` | 100% offline, zero data leaves machine | **Unlimited** (Local) | [Ollama](https://ollama.com) |
| **#4** | **OpenRouter Free** | `cohere/north-mini-code:free` | Dedicated free code model | Free community tier | [OpenRouter Keys](https://openrouter.ai/keys) |
| **#5** | **GitHub Models** | `gpt-4o-mini` | Stable OpenAI endpoint via GitHub PAT | **150 req/day** (15 RPM) | [GitHub PAT Tokens](https://github.com/settings/tokens) |
| — | **DeepSeek** | `deepseek-chat` | High reasoning, low cost | BYOK / Pay-as-you-go | [DeepSeek Platform](https://platform.deepseek.com) |
| — | **OpenAI** | `gpt-4o-mini` | Direct OpenAI API | BYOK / Pay-as-you-go | [OpenAI Platform](https://platform.openai.com) |
| — | **Anthropic Claude** | `claude-3-5-haiku` | Direct Anthropic API | BYOK / Pay-as-you-go | [Anthropic Console](https://console.anthropic.com) |

> **Recommendation:** Start with **Google Gemini** for the best balance of speed and reliability, or switch to **Groq Cloud** for near-instant LPU completions. For offline development, install [Ollama](https://ollama.com) and run `ollama run qwen2.5-coder:3b` with no API key required.

---

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- **`Free AI Commit: Generate AI Commit Message`**: Generates and populates commit message from staged changes.
- **`Free AI Commit: Switch Active AI Profile`**: Quickly switch between configured providers.
- **`Free AI Commit: Set API Key for Active Profile`**: Securely save or update your API key in the OS keychain.
- **`Free AI Commit: Delete API Key for Active Profile`**: Remove stored credential for active profile from keychain.
- **`Free AI Commit: Select Model for Active Profile`**: Browse and select available models for OpenAI-compatible providers.

---

## Configuration

Open VS Code Settings (`Ctrl+,` / `Cmd+,`) and search for **`Free AI Commit`**:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `aiCommitMessage.activeProfile` | `"gemini"` | Active provider preset (`gemini`, `groq`, `github`, `openrouter`, `ollama`, `deepseek`, `openai`, `claude`). |
| `aiCommitMessage.language` | `"English"` | Output language (supports 19 languages). |
| `aiCommitMessage.enableGitmoji` | `false` | Prefix conventional commit types with Gitmoji symbols (e.g. `feat:`, `fix:`). |
| `aiCommitMessage.customSystemPrompt` | `""` | Optional system prompt override. |
| `aiCommitMessage.maxDiffCharacters` | `60000` | Safety limit on diff size sent to LLM (minimum 1000). |
| `aiCommitMessage.diffOverflowStrategy` | `"truncate"` | `truncate` keeps diff head+tail; `fail` aborts with error. |
| `aiCommitMessage.temperature` | `0.7` | Sampling temperature (0.0 to 2.0). |
| `aiCommitMessage.requestTimeoutMs` | `120000` | Request timeout in milliseconds (1s to 600s). |
| `aiCommitMessage.profiles` | `{}` | Custom endpoints and model overrides. |

### Custom Endpoints (vLLM, LM Studio, Private Proxies)

Add custom profiles to your `settings.json`:

```json
{
  "aiCommitMessage.profiles": {
    "lmstudio": {
      "kind": "openai-compatible",
      "baseUrl": "http://localhost:1234/v1",
      "model": "local-model"
    }
  }
}
```

---

## Security & Privacy

- **Encrypted Secret Storage:** API keys are stored exclusively in your operating system's native credential store (`SecretStorage`). They are never written to `settings.json` or committed to source control.
- **Direct Client-to-API:** Diff data travels directly from your workstation to the chosen provider API over TLS. No intermediate telemetry, tracking, or middleman proxy servers are used.
- **Local Isolation with Ollama:** When complete privacy is required, select the **Ollama** profile (`http://localhost:11434/v1`). Zero code or metadata leaves your local workstation.
- **Prompt Isolation:** Staged diffs, file lists, and user notes are strictly delimited and marked as untrusted input to defend against prompt injection.

---

## License

MIT License — see [license.txt](license.txt) for details. Forked from `sitoi/ai-commit`.
