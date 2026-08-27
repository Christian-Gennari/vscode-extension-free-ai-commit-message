<div align="center">

# Free AI Commit Message

**Generate Conventional Commit messages using generous free-tier AI models or local LLMs.**

Works out-of-the-box with **Google Gemini (1,500 req/day free)**, **Groq (14,400 req/day free)**, **GitHub Models**, **OpenRouter**, and **100% offline local Ollama**, as well as DeepSeek, OpenAI, and Anthropic Claude.

[![Visual Studio Marketplace](https://img.shields.io/badge/VS%20Marketplace-v0.1.6-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=christiangennari.free-ai-commit-message)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](license.txt)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?logo=github)](https://github.com/Christian-Gennari/vscode-extension-free-ai-commit-message)

</div>

---

## ⚡ Quick Start (Get Started in 30 Seconds)

1. **Stage your Git changes:**
   ```bash
   git add <files...>
   ```
2. **Set your API Key:**
   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS)
   - Type and select: **`Free AI Commit: Set API Key for Active Profile`**
   - Paste your free API key. *(Keys are stored securely in VS Code's encrypted OS keychain, not in plain text).*
3. **Generate your Commit Message:**
   - Click the **✨ Sparkle icon** in the Source Control (SCM) panel, or run **`Free AI Commit: Generate Commit Message`**.

---

## 🎁 Free Tier Providers (Get Free API Keys)

The extension defaults to **Google Gemini (`gemini-2.0-flash-lite`)** with zero payment required. You can easily switch between any of these pre-configured providers:

| Provider | Model | Free Daily Quota | Where to get Free Key |
| :--- | :--- | :--- | :--- |
| **Google Gemini** *(Default)* | `gemini-2.0-flash-lite` | **1,500 requests/day** (30 RPM) | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Groq Cloud** | `llama-3.3-70b-versatile` | **14,400 requests/day** (30 RPM, ultra-fast) | [Groq Console](https://console.groq.com/keys) |
| **GitHub Models** | `gpt-4o-mini` | **150 requests/day** (15 RPM) | [GitHub Personal Access Tokens](https://github.com/settings/tokens) |
| **OpenRouter Free** | `openrouter/free` | Auto-routes free models | [OpenRouter Keys](https://openrouter.ai/keys) |
| **Ollama (Local)** | `qwen2.5-coder:3b` | **Unlimited (100% offline & private)** | *No key required!* [Install Ollama](https://ollama.com) |
| **DeepSeek** | `deepseek-chat` | Pay-as-you-go / BYOK | [DeepSeek Platform](https://platform.deepseek.com) |
| **OpenAI** | `gpt-4o-mini` | Pay-as-you-go / BYOK | [OpenAI Platform](https://platform.openai.com) |
| **Anthropic Claude** | `claude-3-5-haiku` | Pay-as-you-go / BYOK | [Anthropic Console](https://console.anthropic.com) |

> 💡 **Tip:** If you run [Ollama](https://ollama.com) locally (`ollama run qwen2.5-coder:3b`), switch the profile to `ollama` and no API key or internet connection is required.

---

## 🎛️ Command Palette Cheatsheet

Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

- **`Free AI Commit: Generate Commit Message`**: Generates and inserts the commit message from staged changes.
- **`Free AI Commit: Select Provider Profile`**: Switch active provider (Gemini, Groq, GitHub, OpenRouter, Ollama, DeepSeek, OpenAI, Claude).
- **`Free AI Commit: Set API Key for Active Profile`**: Securely save or update your API key for the active provider.
- **`Free AI Commit: Show Available Models`**: Fetch and list available models directly from OpenAI-compatible endpoints.

---

## ⚙️ Configuration & Settings

Open VS Code Settings (`Ctrl+,` or `Cmd+,`) and search for **`Free AI Commit`**:

| Setting | Default | Description |
| :--- | :--- | :--- |
| `aiCommitMessage.activeProfile` | `"gemini"` | Active provider (`gemini`, `groq`, `github`, `openrouter`, `ollama`, `deepseek`, `openai`, `claude`). |
| `aiCommitMessage.language` | `"English"` | Output language (supports 19 languages including English, Spanish, German, French, Chinese, Japanese, Swedish, etc.). |
| `aiCommitMessage.enableGitmoji` | `false` | When enabled, prefixes conventional commit types with Gitmoji emojis (e.g., `✨ feat:`, `🐛 fix:`). |
| `aiCommitMessage.customSystemPrompt` | `""` | Optional prompt template override. |
| `aiCommitMessage.maxDiffCharacters` | `60000` | Safety limit on diff characters sent to LLM. |
| `aiCommitMessage.diffOverflowStrategy` | `"truncate"` | `truncate` safely keeps diff head+tail; `fail` aborts with warning. |
| `aiCommitMessage.temperature` | `0.7` | LLM sampling temperature (0.0 to 2.0). |
| `aiCommitMessage.profiles` | `{}` | Optional custom endpoints or model overrides. |

### Adding Custom Endpoints (e.g. Local vLLM, LM Studio, or Private Proxies)

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

## 🔒 Security & Privacy

- **Encrypted Secret Storage:** Your API keys are never saved in plain text in `settings.json` or committed to Git. They are stored inside VS Code's OS-encrypted keychain (`SecretStorage`).
- **Direct Requests:** Diff data is sent directly to the AI provider endpoint you selected. No intermediary third-party proxy servers are involved.

---

## 📄 License

MIT License — see [LICENSE](license.txt) for details. Forked with gratitude from `sitoi/ai-commit`.
