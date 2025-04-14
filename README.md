# 🔮 Modelarium

**Modelarium** is a sleek and powerful local AI assistant interface built with **ASP.NET Core (C#)** and **.NET 8**. It allows users to interact with **local Large Language Models (LLMs)** through a modern web interface using the power of **Ollama** under the hood.

Whether you want to run, switch, or manage your LLMs — Modelarium gives you full control with a beautiful, black & red themed UI. All conversations are stored locally via **SQLite**, ensuring privacy and full offline capability.

---

## Features

- Use any local LLM that runs with Ollama
- Chat with your models via a clean chatbot interface
- Conversation history saved locally (SQLite)
- Auto-detect pre-installed models on startup
- Offline Mode Detection
- Razor Pages based structure
- Lightweight & Fast

---

## Requirements

Make sure the following are installed before running the application:

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Ollama](https://ollama.com/download) (CLI + Local API enabled)
- Git
- Modern browser (Edge, Chrome, Firefox, etc.)

---

## 🛠️ Installation

# Current Release
- Download the latest release from the Releases section.
- Just run Modelarium.App.exe

Or

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/Modelarium.git
cd Modelarium

# 2. Run the application
dotnet run --project Modelarium.App
```
By default, the app runs on https://localhost:5001 or http://localhost:5000.
