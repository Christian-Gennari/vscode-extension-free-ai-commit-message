<div align="center">

# Free AI Commit Message

**Generate clean, conventional Git commit messages out of the box with zero setup, or connect your own free BYOK providers (Gemini, Groq, OpenRouter) and offline local Ollama.**

Works instantly upon installation with zero API key configuration, or connect directly using your own API keys to leverage generous free daily quotas from **Gemini (1,500 req/day)**, **Groq (14,400 req/day)**, **GitHub Models**, and **OpenRouter**, or run **100% offline with local Ollama** (no key required). Also supports DeepSeek, OpenAI, and Anthropic Claude.

[![Visual Studio Marketplace](https://img.shields.io/badge/VS%20Marketplace-Install-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=christiangennari.free-ai-commit-message)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](license.txt)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/Christian-Gennari/vscode-extension-free-ai-commit-message)

</div>

> **Using a JetBrains IDE?** (Rider, IntelliJ IDEA, PyCharm, WebStorm, etc.) Check out the sibling plugin: [Free AI Commit Message for JetBrains IDEs](https://github.com/Christian-Gennari/jetbrains-plugin-free-ai-commit-message).

---

## Quick Start (Zero Setup Required)

1. **Stage your Git changes:**
   ```bash
   git add <files...>
   ```
2. **Generate your Commit Message:**
   - Click the **Sparkle icon** (`✨`) in the Source Control (SCM) title bar, or press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and run **`Free AI Commit: Generate AI Commit Message`**.
   - Your conventional commit message will be generated and placed directly in your commit message box.

*(Optional)* **Want higher rate limits or custom models?**
- Press `Ctrl+Shift+P` -> **`Free AI Commit: Switch Active AI Profile`** to select Gemini, Groq, Ollama, etc.
- Run **`Free AI Commit: Set API Key for Active Profile`** to enter your personal free tier key (stored securely in VS Code's OS-encrypted keychain).

---

## Provider Profiles & Recommendations

| Rank | Provider Profile | Default Model | Setup Required | Speed & Limits | Key Source |
| :---: | :--- | :--- | :---: | :--- | :--- |
| **#1** | **Free Cloud** *(Default)* | `auto` | **None (Zero Setup)** | Instant quick-start, daily free pool | Built-in |
| **#2** | **Google Gemini** | `gemini-3.5-flash-lite` | Free API Key | **1,500 req/day** (30 RPM) | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **#3** | **Groq Cloud** | `openai/gpt-oss-120b` | Free API Key | **14,400 req/day** (30 RPM, ~300ms latency) | [Groq Console](https://console.groq.com/keys) |
| **#4** | **Ollama** | `qwen2.5-coder:3b` | Local Server | **Unlimited** (100% offline, zero data leaves machine) | [Ollama](https://ollama.com) |
| **#5** | **OpenRouter Free** | `openrouter/free` | Free API Key | Free community tier | [OpenRouter Keys](https://openrouter.ai/keys) |
| **#6** | **GitHub Models** | `gpt-4o-mini` | GitHub PAT | **150 req/day** (15 RPM) | [GitHub PAT Tokens](https://github.com/settings/tokens) |
| — | **DeepSeek** | `deepseek-chat` | BYOK | High reasoning, low cost | [DeepSeek Platform](https://platform.deepseek.com) |
| — | **OpenAI** | `gpt-4o-mini` | BYOK | Direct OpenAI API | [OpenAI Platform](https://platform.openai.com) |
| — | **Anthropic Claude** | `claude-3-5-haiku` | BYOK | Direct Anthropic API | [Anthropic Console](https://console.anthropic.com) |

> **Recommendation:** Keep **Free (No Setup Required)** for effortless commits right after installing. For heavy day-to-day use with massive diffs, switch to your own free **Google Gemini** or **Groq Cloud** key for up to 14,400 requests/day.

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
| `aiCommitMessage.activeProfile` | `"free"` | Active provider preset (`free`, `gemini`, `groq`, `github`, `openrouter`, `ollama`, `deepseek`, `openai`, `claude`). |
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

- **Zero-Setup Quick Start:** The default `free` profile connects securely over HTTPS to the proxy with server-side prompt isolation, input diff truncation, and zero tracking.
- **Encrypted Secret Storage:** Personal API keys are stored exclusively in VS Code's OS-encrypted SecretStorage keychain. They are never written to settings JSON files or extension logs.
- **Local Isolation with Ollama:** When absolute offline privacy is required, select the **Ollama** profile (`http://localhost:11434/v1`). Zero code or metadata leaves your local workstation.
- **Prompt Isolation:** Staged diffs, file lists, and user notes are strictly delimited and marked as untrusted input to defend against prompt injection.

---

## License

MIT © [Christian Gennari](https://github.com/Christian-Gennari)
