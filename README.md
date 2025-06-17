# 🤖 AI Chatbot GNOME Shell Extension

A powerful, multi-model AI chatbot integration for GNOME Shell that brings AI assistance directly to your desktop.  
Supports: **OpenAI GPT**, **Anthropic Claude**, **OpenRouter**, **local Ollama models**, **LM Studio**, and more!

---

## 🛠 Installation Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/ai-chatbot@vansh.git
```
### 2. Move the Extension to GNOME Extensions Folder
```bash
mkdir -p ~/.local/share/gnome-shell/extensions/
cp -r ai-chatbot@vansh ~/.local/share/gnome-shell/extensions/
```
### 3. Rename the Folder (if necessary)
```bash
ai-chatbot@vansh
```
### 4. Compile GSettings Schema
```bash
cd ~/.local/share/gnome-shell/extensions/ai-chatbot@vansh
glib-compile-schemas schemas
```
### 5. Enable the Extension
```bash
gnome-extensions enable ai-chatbot@vansh
```
### 6. Restart GNOME Shell
- On X11: Press <kbd>Alt</kbd> + <kbd>F2</kbd>, type r, and press <kbd>Enter</kbd>.

- On Wayland: Log out and log back in.