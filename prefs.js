const { Gtk, Gio, GObject, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const MODELS = {
    'OpenRouter': ['deepseek/deepseek-prover-v2:free', 'deepseek/deepseek-r1-0528:free', 'moonshotai/kimi-dev-72b:free', 'deepseek/deepseek-r1-0528-qwen3-8b:free', 'microsoft/mai-ds-r1:free', 'google/gemma-3n-e4b-it:free', 'meta-llama/llama-3.3-8b-instruct:free'],
    'OpenAI': ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
    'Anthropic': ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    'Ollama': ['llama2', 'mistral', 'codellama', 'vicuna', 'phi', 'neural-chat'],
    'LM Studio': ['local-model']
};

const AIChatbotPreferences = GObject.registerClass(
class AIChatbotPreferences extends Gtk.ScrolledWindow {
    _init() {
        super._init({
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
            hexpand: true,
            vexpand: true,
        });

        this.settings = ExtensionUtils.getSettings();
        this.modelSwitches = {};
        
        this._buildUI();
        this._loadSettings();
    }

    _buildUI() {
        const mainBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 20,
            margin_top: 20,
            margin_bottom: 20,
            margin_start: 20,
            margin_end: 20,
            hexpand: true,
            vexpand: true,
        });

        // Title
        const titleLabel = new Gtk.Label({
            label: '<b>AI Chatbot Preferences</b>',
            use_markup: true,
            halign: Gtk.Align.START,
            margin_bottom: 10,
        });
        mainBox.append(titleLabel);

        // Models Section
        const modelsFrame = new Gtk.Frame({
            label: 'Model Selection',
            margin_top: 10,
            hexpand: true,
        });
        
        const modelsBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            hexpand: true,
        });

        const modelsLabel = new Gtk.Label({
            label: 'Choose which AI models to use:',
            halign: Gtk.Align.START,
        });
        modelsBox.append(modelsLabel);

        // Add model switches
        Object.entries(MODELS).forEach(([provider, models]) => {
            const providerLabel = new Gtk.Label({
                label: `<b>${provider}</b>`,
                use_markup: true,
                halign: Gtk.Align.START,
                margin_top: 10,
            });
            modelsBox.append(providerLabel);

            models.forEach(model => {
                const modelBox = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 10,
                    margin_start: 20,
                    hexpand: true,
                });

                const modelSwitch = new Gtk.Switch({
                    valign: Gtk.Align.CENTER,
                });

                const modelLabel = new Gtk.Label({
                    label: model,
                    halign: Gtk.Align.START,
                    hexpand: true,
                });

                modelBox.append(modelSwitch);
                modelBox.append(modelLabel);
                modelsBox.append(modelBox);

                this.modelSwitches[model] = modelSwitch;
            });
        });

        modelsFrame.set_child(modelsBox);
        mainBox.append(modelsFrame);

        // API Keys Section
        const apiFrame = new Gtk.Frame({
            label: 'API Keys',
            margin_top: 10,
            hexpand: true,
        });

        const apiBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            hexpand: true,
        });

        // OpenRouter API Key
        const openrouterBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const openrouterLabel = new Gtk.Label({
            label: 'OpenRouter API Key:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.openrouterEntry = new Gtk.Entry({
            placeholder_text: 'Enter OpenRouter API key',
            hexpand: true,
            visibility: false,
        });
        openrouterBox.append(openrouterLabel);
        openrouterBox.append(this.openrouterEntry);
        apiBox.append(openrouterBox);

        // OpenAI API Key
        const openaiBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const openaiLabel = new Gtk.Label({
            label: 'OpenAI API Key:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.openaiEntry = new Gtk.Entry({
            placeholder_text: 'Enter OpenAI API key',
            hexpand: true,
            visibility: false,
        });
        openaiBox.append(openaiLabel);
        openaiBox.append(this.openaiEntry);
        apiBox.append(openaiBox);

        // Anthropic API Key
        const anthropicBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const anthropicLabel = new Gtk.Label({
            label: 'Anthropic API Key:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.anthropicEntry = new Gtk.Entry({
            placeholder_text: 'Enter Anthropic API key',
            hexpand: true,
            visibility: false,
        });
        anthropicBox.append(anthropicLabel);
        anthropicBox.append(this.anthropicEntry);
        apiBox.append(anthropicBox);

        // Ollama URL
        const ollamaBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const ollamaLabel = new Gtk.Label({
            label: 'Ollama Server URL:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.ollamaEntry = new Gtk.Entry({
            placeholder_text: 'http://localhost:11434',
            hexpand: true,
        });
        ollamaBox.append(ollamaLabel);
        ollamaBox.append(this.ollamaEntry);
        apiBox.append(ollamaBox);

        // LM Studio URL
        const lmstudioBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const lmstudioLabel = new Gtk.Label({
            label: 'LM Studio URL:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.lmstudioEntry = new Gtk.Entry({
            placeholder_text: 'http://localhost:1234',
            hexpand: true,
        });
        lmstudioBox.append(lmstudioLabel);
        lmstudioBox.append(this.lmstudioEntry);
        apiBox.append(lmstudioBox);

        apiFrame.set_child(apiBox);
        mainBox.append(apiFrame);

        // Settings Section
        const settingsFrame = new Gtk.Frame({
            label: 'Settings',
            margin_top: 10,
            hexpand: true,
        });

        const settingsBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            hexpand: true,
        });

        // Max Tokens
        const tokensBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const tokensLabel = new Gtk.Label({
            label: 'Max Tokens:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.tokensSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 100,
                upper: 4000,
                step_increment: 100,
                page_increment: 500,
                value: 2000,
            }),
            hexpand: true,
        });
        tokensBox.append(tokensLabel);
        tokensBox.append(this.tokensSpinButton);
        settingsBox.append(tokensBox);

        // Temperature
        const tempBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const tempLabel = new Gtk.Label({
            label: 'Temperature:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.tempSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 0.0,
                upper: 2.0,
                step_increment: 0.1,
                page_increment: 0.5,
                value: 0.7,
            }),
            digits: 1,
            hexpand: true,
        });
        tempBox.append(tempLabel);
        tempBox.append(this.tempSpinButton);
        settingsBox.append(tempBox);

        // Theme
        const themeBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const themeLabel = new Gtk.Label({
            label: 'Theme:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.themeCombo = new Gtk.ComboBoxText({
            hexpand: true,
        });
        this.themeCombo.append_text('Default');
        this.themeCombo.append_text('Dark');
        this.themeCombo.append_text('Light');
        this.themeCombo.append_text('Colorful');
        themeBox.append(themeLabel);
        themeBox.append(this.themeCombo);
        settingsBox.append(themeBox);

        // Auto-clear chat
        const autoClearBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const autoClearLabel = new Gtk.Label({
            label: 'Auto-clear Chat:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.autoClearSwitch = new Gtk.Switch({
            halign: Gtk.Align.END,
            hexpand: true,
        });
        autoClearBox.append(autoClearLabel);
        autoClearBox.append(this.autoClearSwitch);
        settingsBox.append(autoClearBox);

        // Show notifications
        const notifBox = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 10,
            hexpand: true,
        });
        const notifLabel = new Gtk.Label({
            label: 'Show Notifications:',
            halign: Gtk.Align.START,
            width_chars: 20,
        });
        this.notifSwitch = new Gtk.Switch({
            halign: Gtk.Align.END,
            hexpand: true,
        });
        notifBox.append(notifLabel);
        notifBox.append(this.notifSwitch);
        settingsBox.append(notifBox);

        settingsFrame.set_child(settingsBox);
        mainBox.append(settingsFrame);

        // About Section
        const aboutFrame = new Gtk.Frame({
            label: 'About',
            margin_top: 10,
            hexpand: true,
        });

        const aboutBox = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin_top: 10,
            margin_bottom: 10,
            margin_start: 10,
            margin_end: 10,
            hexpand: true,
        });

        const aboutLabel = new Gtk.Label({
            label: '<b>AI Chatbot Extension v1.0</b>\nMulti-model AI assistant for GNOME Shell',
            use_markup: true,
            halign: Gtk.Align.START,
        });
        aboutBox.append(aboutLabel);

        const githubButton = new Gtk.Button({
            label: 'Visit GitHub Repository',
            hexpand: true,
            margin_top: 10,
        });
        githubButton.connect('clicked', () => {
            try {
                GLib.spawn_command_line_async('xdg-open https://github.com/VANSH3104/ai-chatbot-vansh.git');
            } catch (e) {
                log('Error opening URL: ' + e.message);
            }
        });
        aboutBox.append(githubButton);

        aboutFrame.set_child(aboutBox);
        mainBox.append(aboutFrame);

        this.set_child(mainBox);
        this._connectSignals();
    }

    _connectSignals() {
        // Model switches
        Object.entries(this.modelSwitches).forEach(([model, switchWidget]) => {
            switchWidget.connect('notify::active', () => {
                this._updateSelectedModels();
            });
        });

        // API keys
        this.openrouterEntry.connect('changed', () => {
            this.settings.set_string('openrouter-api-key', this.openrouterEntry.get_text());
        });
        this.openaiEntry.connect('changed', () => {
            this.settings.set_string('openai-api-key', this.openaiEntry.get_text());
        });
        this.anthropicEntry.connect('changed', () => {
            this.settings.set_string('anthropic-api-key', this.anthropicEntry.get_text());
        });
        this.ollamaEntry.connect('changed', () => {
            this.settings.set_string('ollama-url', this.ollamaEntry.get_text());
        });
        this.lmstudioEntry.connect('changed', () => {
            this.settings.set_string('lmstudio-url', this.lmstudioEntry.get_text());
        });
        this.tokensSpinButton.connect('value-changed', () => {
            this.settings.set_int('max-tokens', this.tokensSpinButton.get_value());
        });
        this.tempSpinButton.connect('value-changed', () => {
            this.settings.set_double('temperature', this.tempSpinButton.get_value());
        });
        this.themeCombo.connect('changed', () => {
            this.settings.set_int('theme', this.themeCombo.get_active());
        });
        this.autoClearSwitch.connect('notify::active', () => {
            this.settings.set_boolean('auto-clear', this.autoClearSwitch.get_active());
        });
        this.notifSwitch.connect('notify::active', () => {
            this.settings.set_boolean('show-notifications', this.notifSwitch.get_active());
        });
    }

    _loadSettings() {
        try {
            const selectedModels = this.settings.get_strv('selected-models') || [];
            Object.entries(this.modelSwitches).forEach(([model, switchWidget]) => {
                switchWidget.set_active(selectedModels.includes(model));
            });

            // Load API keys
            this.openrouterEntry.set_text(this.settings.get_string('openrouter-api-key') || '');
            this.openaiEntry.set_text(this.settings.get_string('openai-api-key') || '');
            this.anthropicEntry.set_text(this.settings.get_string('anthropic-api-key') || '');
            this.ollamaEntry.set_text(this.settings.get_string('ollama-url') || 'http://localhost:11434');
            this.lmstudioEntry.set_text(this.settings.get_string('lmstudio-url') || 'http://localhost:1234');

            // Load settings
            this.tokensSpinButton.set_value(this.settings.get_int('max-tokens') || 2000);
            this.tempSpinButton.set_value(this.settings.get_double('temperature') || 0.7);
            this.themeCombo.set_active(this.settings.get_int('theme') || 0);
            this.autoClearSwitch.set_active(this.settings.get_boolean('auto-clear') || false);
            this.notifSwitch.set_active(this.settings.get_boolean('show-notifications') || true);
        } catch (e) {
            log('Error loading settings: ' + e.message);
        }
    }

    _updateSelectedModels() {
        const selectedModels = [];
        Object.entries(this.modelSwitches).forEach(([model, switchWidget]) => {
            if (switchWidget.get_active()) {
                selectedModels.push(model);
            }
        });
        this.settings.set_strv('selected-models', selectedModels);
    }
});

function init() {
}

function buildPrefsWidget() {
    return new AIChatbotPreferences();
}