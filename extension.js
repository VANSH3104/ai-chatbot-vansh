const { GObject, St, Clutter, Gio, GLib, Soup, Shell, Pango } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const MODELS = {
    openrouter: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/api/v1/chat/completions',
        headers: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/yourusername/your-extension',
            'X-Title': 'GNOME AI Chatbot'
        }),
        models: [
            'deepseek/deepseek-prover-v2:free',
            'deepseek/deepseek-r1-0528:free',
            'moonshotai/kimi-dev-72b:free',
            'deepseek/deepseek-r1-0528-qwen3-8b:free',
            'microsoft/mai-ds-r1:free',
            'google/gemma-3n-e4b-it:free',
            'meta-llama/llama-3.3-8b-instruct:free'
        ]
    },
    openai: {
        name: 'OpenAI GPT',
        url: 'https://api.openai.com/v1/chat/completions',
        headers: (apiKey) => ({
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }),
        models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo']
    },
    anthropic: {
        name: 'Anthropic Claude',
        url: 'https://api.anthropic.com/v1/messages',
        headers: (apiKey) => ({
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        }),
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307']
    },
    ollama: {
        name: 'Ollama',
        url: 'http://localhost:11434/api/chat',
        headers: () => ({
            'Content-Type': 'application/json'
        }),
        models: ['llama2', 'mistral', 'codellama', 'vicuna']
    },
    lmstudio: {
        name: 'LM Studio',
        url: 'http://localhost:1234/v1/chat/completions',
        headers: () => ({
            'Content-Type': 'application/json'
        }),
        models: ['local-model']
    }
};

// Enhanced markdown-like text processor
class MarkdownProcessor {
    static process(text) {
        // Convert markdown-like formatting to styled text
        let processedText = text;
        
        // Handle code blocks (```code```)
        processedText = processedText.replace(/```([^`]+)```/g, (match, code) => {
            return `[CODE]\n${code.trim()}\n[/CODE]`;
        });
        
        // Handle inline code (`code`)
        processedText = processedText.replace(/`([^`]+)`/g, '[INLINE_CODE]$1[/INLINE_CODE]');
        
        // Handle bold (**text** or __text__)
        processedText = processedText.replace(/\*\*([^*]+)\*\*/g, '[BOLD]$1[/BOLD]');
        processedText = processedText.replace(/__([^_]+)__/g, '[BOLD]$1[/BOLD]');
        
        // Handle italic (*text* or _text_)
        processedText = processedText.replace(/\*([^*]+)\*/g, '[ITALIC]$1[/ITALIC]');
        processedText = processedText.replace(/_([^_]+)_/g, '[ITALIC]$1[/ITALIC]');
        
        // Handle headers (# ## ###)
        processedText = processedText.replace(/^### (.+)$/gm, '[H3]$1[/H3]');
        processedText = processedText.replace(/^## (.+)$/gm, '[H2]$1[/H2]');
        processedText = processedText.replace(/^# (.+)$/gm, '[H1]$1[/H1]');
        
        // Handle bullet points
        processedText = processedText.replace(/^- (.+)$/gm, '• $1');
        processedText = processedText.replace(/^\* (.+)$/gm, '• $1');
        
        // Handle numbered lists
        processedText = processedText.replace(/^(\d+)\. (.+)$/gm, '$1. $2');
        
        return processedText;
    }
    
    static createStyledLabel(text, styleClass = '') {
        const processedText = this.process(text);
        const label = new St.Label({
            style_class: styleClass,
            x_expand: true,
            y_expand: false
        });
        
        // Create ClutterText for advanced formatting
        const clutterText = label.clutter_text;
        clutterText.set_line_wrap(true);
        clutterText.set_line_wrap_mode(Pango.WrapMode.WORD_CHAR);
        clutterText.set_ellipsize(Pango.EllipsizeMode.NONE);
        clutterText.set_use_markup(true);
        
        // Apply basic markup conversion
        let markupText = processedText;
        markupText = markupText.replace(/\[BOLD\](.*?)\[\/BOLD\]/g, '<b>$1</b>');
        markupText = markupText.replace(/\[ITALIC\](.*?)\[\/ITALIC\]/g, '<i>$1</i>');
        markupText = markupText.replace(/\[H1\](.*?)\[\/H1\]/g, '<big><b>$1</b></big>');
        markupText = markupText.replace(/\[H2\](.*?)\[\/H2\]/g, '<big>$1</big>');
        markupText = markupText.replace(/\[H3\](.*?)\[\/H3\]/g, '<b>$1</b>');
        markupText = markupText.replace(/\[INLINE_CODE\](.*?)\[\/INLINE_CODE\]/g, '<tt>$1</tt>');
        
        // Handle code blocks separately
        const codeBlocks = [];
        markupText = markupText.replace(/\[CODE\]\n(.*?)\n\[\/CODE\]/gs, (match, code) => {
            codeBlocks.push(code);
            return `[CODE_BLOCK_${codeBlocks.length - 1}]`;
        });
        
        // Escape any remaining markup
        markupText = markupText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Restore our custom markup
        markupText = markupText.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/g, '<b>$1</b>');
        markupText = markupText.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/g, '<i>$1</i>');
        markupText = markupText.replace(/&lt;big&gt;(.*?)&lt;\/big&gt;/g, '<big>$1</big>');
        markupText = markupText.replace(/&lt;tt&gt;(.*?)&lt;\/tt&gt;/g, '<tt>$1</tt>');
        
        // Handle code blocks
        codeBlocks.forEach((code, index) => {
            const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            markupText = markupText.replace(`[CODE_BLOCK_${index}]`, `<tt>${escapedCode}</tt>`);
        });
        
        try {
            clutterText.set_markup(markupText);
        } catch (e) {
            // Fallback to plain text if markup fails
            clutterText.set_text(text);
        }
        
        return label;
    }
}

class ChatMessage extends St.BoxLayout {
    static {
        GObject.registerClass(this);
    }

    constructor(text, isUser = false) {
        super({
            vertical: false,
            style_class: isUser ? 'chat-message-user' : 'chat-message-ai',
            x_expand: true,
            y_expand: false
        });

        const avatar = new St.Icon({
            icon_name: isUser ? 'avatar-default-symbolic' : 'applications-science-symbolic',
            icon_size: 24,
            style_class: 'chat-avatar'
        });

        const messageBox = new St.BoxLayout({
            vertical: true,
            x_expand: true,
            y_expand: false,
            style_class: 'chat-message-box'
        });

        // Use enhanced markdown processor
        const messageText = MarkdownProcessor.createStyledLabel(text, 'chat-message-text');
        messageBox.add_child(messageText);

        if (isUser) {
            this.add_child(messageBox);
            this.add_child(avatar);
        } else {
            this.add_child(avatar);
            this.add_child(messageBox);
        }
    }
}

class AIChatbot extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    constructor() {
        super(0.0, 'AI Chatbot');
        
        this.settings = ExtensionUtils.getSettings();
        this.currentModelIndex = 0;
        this.chatHistory = [];
        this.isProcessing = false;
        
        this._initUI();
        this._loadSettings();
    }

    _initUI() {
        // Panel button
        const icon = new St.Icon({
            icon_name: 'applications-science-symbolic',
            style_class: 'system-status-icon'
        });
        this.add_child(icon);

        // Main container with dynamic sizing
        this.mainBox = new St.BoxLayout({
            vertical: true,
            style_class: 'ai-chatbot-container'
        });

        // Header
        const headerBox = new St.BoxLayout({
            vertical: false,
            style_class: 'ai-chatbot-header'
        });

        const titleLabel = new St.Label({
            text: 'AI Chatbot',
            style_class: 'ai-chatbot-title'
        });

        this.modelLabel = new St.Label({
            text: 'Model: Loading...',
            style_class: 'ai-chatbot-model'
        });

        const settingsButton = new St.Button({
            style_class: 'ai-chatbot-settings-btn',
            child: new St.Icon({
                icon_name: 'emblem-system-symbolic',
                icon_size: 16
            })
        });
        settingsButton.connect('clicked', () => {
            ExtensionUtils.openPrefs();
        });

        headerBox.add_child(titleLabel);
        headerBox.add_child(this.modelLabel);
        headerBox.add_child(settingsButton);

        // Chat area with improved scrolling
        this.chatScrollView = new St.ScrollView({
            style_class: 'ai-chatbot-chat-area',
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            x_expand: true,
            y_expand: true,
            overlay_scrollbars: true
        });

        this.chatBox = new St.BoxLayout({
            vertical: true,
            style_class: 'ai-chatbot-chat-box',
            x_expand: true,
            y_expand: false
        });

        this.chatScrollView.add_actor(this.chatBox);

        // Input area
        const inputBox = new St.BoxLayout({
            vertical: false,
            style_class: 'ai-chatbot-input-box'
        });

        this.textEntry = new St.Entry({
            style_class: 'ai-chatbot-input',
            hint_text: 'Type your message...',
            x_expand: true,
            can_focus: true
        });

        this.sendButton = new St.Button({
            style_class: 'ai-chatbot-send-btn',
            child: new St.Icon({
                icon_name: 'mail-send-symbolic',
                icon_size: 16
            })
        });

        this.clearButton = new St.Button({
            style_class: 'ai-chatbot-clear-btn',
            child: new St.Icon({
                icon_name: 'edit-clear-symbolic',
                icon_size: 16
            })
        });

        inputBox.add_child(this.textEntry);
        inputBox.add_child(this.sendButton);
        inputBox.add_child(this.clearButton);

        // Status bar
        this.statusLabel = new St.Label({
            text: 'Ready',
            style_class: 'ai-chatbot-status'
        });

        // Assemble UI
        this.mainBox.add_child(headerBox);
        this.mainBox.add_child(this.chatScrollView);
        this.mainBox.add_child(inputBox);
        this.mainBox.add_child(this.statusLabel);

        // Add to menu with better sizing
        const menuItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false
        });
        menuItem.actor.add_child(this.mainBox);
        this.menu.addMenuItem(menuItem);

        // Connect signals
        this.textEntry.clutter_text.connect('activate', () => {
            this._sendMessage();
        });
        this.sendButton.connect('clicked', () => {
            this._sendMessage();
        });
        this.clearButton.connect('clicked', () => {
            this._clearChat();
        });

        // Welcome message
        this._addMessage('Hello! I\'m your AI assistant. How can I help you today?', false);
    }

    _loadSettings() {
        this.enabledModels = this.settings.get_strv('enabled-models');
        this.selectedModels = this.settings.get_strv('selected-models');
        this.apiKeys = {
            openai: this.settings.get_string('openai-api-key'),
            anthropic: this.settings.get_string('anthropic-api-key'),
            openrouter: this.settings.get_string('openrouter-api-key')
        };
        this.ollamaUrl = this.settings.get_string('ollama-url') || 'http://localhost:11434';
        this.lmstudioUrl = this.settings.get_string('lmstudio-url') || 'http://localhost:1234';
        this.maxTokens = this.settings.get_int('max-tokens');
        this.temperature = this.settings.get_double('temperature');
        
        this._updateModelLabel();
    }

    _updateModelLabel() {
        if (this.selectedModels.length > 0) {
            const currentModel = this.selectedModels[this.currentModelIndex] || this.selectedModels[0];
            this.modelLabel.text = `Model: ${currentModel}`;
        } else {
            this.modelLabel.text = 'Model: None selected';
        }
    }

    _addMessage(text, isUser = false) {
        const message = new ChatMessage(text, isUser);
        this.chatBox.add_child(message);
        
        // Improved scroll to bottom with delay
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            const vscroll = this.chatScrollView.get_vscroll_bar();
            if (vscroll) {
                const adjustment = vscroll.get_adjustment();
                const maxValue = adjustment.get_upper() - adjustment.get_page_size();
                adjustment.set_value(Math.max(0, maxValue));
            }
            return GLib.SOURCE_REMOVE;
        });

        this.chatHistory.push({ text, isUser });
    }

    _clearChat() {
        this.chatBox.destroy_all_children();
        this.chatHistory = [];
        this._addMessage('Chat cleared. How can I help you?', false);
    }

    async _sendMessage() {
        if (this.isProcessing) return;
        
        const text = this.textEntry.get_text().trim();
        if (!text) return;

        this.textEntry.set_text('');
        this._addMessage(text, true);
        this.isProcessing = true;
        this.statusLabel.text = 'Thinking...';

        try {
            const response = await this._queryAI(text);
            this._addMessage(response, false);
            this.statusLabel.text = 'Ready';
        } catch (error) {
            this._addMessage(`Error: ${error.message}`, false);
            this.statusLabel.text = 'Error occurred';
            
            // Try next model if available
            if (this.selectedModels.length > 1) {
                this.currentModelIndex = (this.currentModelIndex + 1) % this.selectedModels.length;
                this._updateModelLabel();
                this.statusLabel.text = `Switched to ${this.selectedModels[this.currentModelIndex]}`;
            }
        }

        this.isProcessing = false;
    }

    async _queryAI(message) {
        if (!this.selectedModels.length) {
            throw new Error('No models selected. Please configure in settings.');
        }

        const currentModel = this.selectedModels[this.currentModelIndex];
        const modelType = this._getModelType(currentModel);
        
        if (!modelType) {
            throw new Error(`Unknown model: ${currentModel}`);
        }

        const modelConfig = MODELS[modelType];
        let url = modelConfig.url;
        
        // Update URLs for local models
        if (modelType === 'ollama') {
            url = `${this.ollamaUrl}/api/chat`;
        } else if (modelType === 'lmstudio') {
            url = `${this.lmstudioUrl}/v1/chat/completions`;
        }

        const headers = modelConfig.headers(this.apiKeys[modelType] || '');
        const payload = this._buildPayload(modelType, currentModel, message);

        return new Promise((resolve, reject) => {
            const session = new Soup.Session();
            const msg = Soup.Message.new('POST', url);
            
            // Set headers
            Object.entries(headers).forEach(([key, value]) => {
                msg.request_headers.append(key, value);
            });

            msg.set_request('application/json', Soup.MemoryUse.COPY, JSON.stringify(payload));

            session.queue_message(msg, (session, message) => {
                if (message.status_code === 200) {
                    try {
                        const response = JSON.parse(message.response_body.data);
                        const content = this._extractContent(modelType, response);
                        resolve(content);
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${error.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${message.status_code}: ${message.reason_phrase}`));
                }
            });
        });
    }

    _getModelType(model) {
        for (const [type, config] of Object.entries(MODELS)) {
            if (config.models.includes(model)) {
                return type;
            }
        }
        return null;
    }

    _buildPayload(modelType, model, message) {
        const messages = [
            { role: 'system', content: 'You are a helpful AI assistant integrated into the GNOME desktop environment. You can use markdown formatting in your responses.' },
            ...this.chatHistory.slice(-10).map(msg => ({
                role: msg.isUser ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        switch (modelType) {
            case 'openai':
            case 'lmstudio':
                return {
                    model: model,
                    messages: messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                };
            case 'anthropic':
                return {
                    model: model,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    messages: messages.slice(1) // Remove system message for Anthropic
                };
            case 'openrouter':
                return {
                    model: model,
                    messages: messages,
                    max_tokens: this.maxTokens,
                    temperature: this.temperature
                };
            case 'ollama':
                return {
                    model: model,
                    messages: messages,
                    stream: false,
                    options: {
                        temperature: this.temperature,
                        num_predict: this.maxTokens
                    }
                };
            default:
                throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    _extractContent(modelType, response) {
        switch (modelType) {
            case 'openai':
            case 'lmstudio':
                return response.choices[0].message.content;
            case 'anthropic':
                return response.content[0].text;
            case 'openrouter':
                return response.choices[0].message.content;
            case 'ollama':
                return response.message.content;
            default:
                throw new Error(`Unsupported model type: ${modelType}`);
        }
    }

    destroy() {
        super.destroy();
    }
}

class Extension {
    constructor() {
        this.chatbot = null;
    }

    enable() {
        this.chatbot = new AIChatbot();
        Main.panel.addToStatusArea('ai-chatbot', this.chatbot);
    }

    disable() {
        if (this.chatbot) {
            this.chatbot.destroy();
            this.chatbot = null;
        }
    }
}

function init() {
    return new Extension();
}