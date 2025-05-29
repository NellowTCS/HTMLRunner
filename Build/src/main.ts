// Type declarations
declare global {
    interface Window {
        prettierPlugins: any[];
        runCode: () => void;
        clearConsole: () => void;
        resetCode: () => void;
        formatCode: () => Promise<void>;
        toggleAutoRun: () => void;
        toggleDarkMode: () => void;
        switchTab: (tab: string) => void;
        switchOutput: (output: string) => void;
    }
}

import { Editor, EditorConfiguration } from 'codemirror';
import * as CodeMirror from 'codemirror';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/css/css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/matchbrackets';
import 'codemirror/addon/comment/comment';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/javascript-lint';
import 'codemirror/addon/lint/css-lint';
import 'codemirror/addon/lint/html-lint';
import Split from 'split.js';
import * as prettier from 'prettier/standalone';
import * as parserHtml from 'prettier/plugins/html';
import * as parserCss from 'prettier/plugins/postcss';
import * as parserFlow from 'prettier/plugins/flow';
import * as prettierPluginEstree from "prettier/plugins/estree";
import { ModuleBlock } from 'typescript';

interface CodeMirrorInstance {
    (element: HTMLElement, options?: EditorConfiguration): Editor;
}

type CodeMirrorEditor = Editor;

interface CodeMirrorEditorConfig extends EditorConfiguration {
    lint?: boolean | {
        async?: boolean;
        [key: string]: any;
    };
}

interface Editors {
    html: CodeMirrorEditor;
    css: CodeMirrorEditor;
    js: CodeMirrorEditor;
    [key: string]: CodeMirrorEditor;
}

interface State {
    html: string;
    css: string;
    js: string;
    activeTab: string;
    activeOutput: string;
    splitSizes: number[];
}

interface ConsoleMessage {
    type: 'console';
    level: 'log' | 'error' | 'warn' | 'info';
    data: any[];
    timestamp: string;
}

interface StackInfo {
    stack?: string;
}

// Update variable declarations with type assertions
let editors: Editors = {
    html: null as unknown as CodeMirrorEditor,
    css: null as unknown as CodeMirrorEditor,
    js: null as unknown as CodeMirrorEditor
};

const state: State = {
    html: '',
    css: '',
    js: '',
    activeTab: 'html',
    activeOutput: 'preview',
    splitSizes: [50, 50]
};

// Register Prettier plugins
const plugins = [parserHtml, parserCss, parserFlow];
window.prettierPlugins = plugins;

// Global variables with type assertions
let currentTab: string = 'html';
let currentOutput: string = 'preview';
let isDarkMode: boolean = localStorage.getItem('darkMode') === 'true';
let isAutoRun: boolean = localStorage.getItem('autoRun') === 'true';
let splitInstance: Split.Instance; // Add Split instance variable
const consoleOutput = document.getElementById('console') as HTMLDivElement;
const loadingEl = document.getElementById('loading') as HTMLDivElement;
const errorEl = document.getElementById('error-message') as HTMLDivElement;
const preview = document.getElementById('preview') as HTMLIFrameElement;

if (!consoleOutput || !loadingEl || !errorEl || !preview) {
    throw new Error('Required DOM elements not found');
}

// Console interceptor
const consoleInterceptor = `
    const originalConsole = { log: console.log, error: console.error, warn: console.warn, info: console.info };
    function sendToConsole(level, ...args) {
        window.parent.postMessage({ type: 'console', level, data: args, timestamp: new Date().toISOString() }, '*');
        originalConsole[level].apply(console, args);
    }
    console.log = (...args) => sendToConsole('log', ...args);
    console.error = (...args) => sendToConsole('error', ...args);
    console.warn = (...args) => sendToConsole('warn', ...args);
    console.info = (...args) => sendToConsole('info', ...args);
    window.onerror = (message, source, lineno, colno, error) => {
        sendToConsole('error', error || message, { stack: error?.stack });
        return true;
    };
    window.onunhandledrejection = (event) => {
        sendToConsole('error', event.reason, { stack: event.reason?.stack });
    };
`;

// Initialize Split.js
function initializeSplit() {
    if (splitInstance) {
        splitInstance.destroy();
    }

    const elements = ['#editor-panel', '#output-panel'];
    const direction = window.innerWidth <= 768 ? 'vertical' : 'horizontal';
    
    // Make sure the elements exist and are visible
    if (!elements.every(id => document.querySelector(id))) {
        console.error('Split.js elements not found');
        return;
    }

    splitInstance = Split(elements, {
        sizes: state.splitSizes || [50, 50],
        minSize: 200,
        gutterSize: 10,
        snapOffset: 0,
        dragInterval: 1,
        direction,
        elementStyle: (dimension, size, gutterSize) => ({
            'flex-basis': `calc(${size}% - ${gutterSize}px)`,
        }),
        gutterStyle: (dimension, gutterSize) => ({
            'flex-basis': `${gutterSize}px`,
        }),
        onDragStart: function() {
            document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
        },
        onDrag: function() {
            // Ensure CodeMirror updates its dimensions during drag
            Object.values(editors).forEach(editor => editor.refresh());
        },
        onDragEnd: function(sizes) {
            document.body.style.cursor = '';
            state.splitSizes = sizes;
            saveState();
            // Final refresh of editors
            Object.values(editors).forEach(editor => editor.refresh());
        }
    });

    // Trigger initial refresh of editors
    setTimeout(() => {
        Object.values(editors).forEach(editor => editor.refresh());
    }, 0);
}

// Handle window resize with proper cleanup
let resizeTimeout: number;
const handleResize = () => {
    if (resizeTimeout) {
        window.clearTimeout(resizeTimeout);
    }
    resizeTimeout = window.setTimeout(() => {
        // Always re-initialize on resize to ensure proper direction
        initializeSplit();
    }, 250);
};

// Clean up previous listener if it exists
window.removeEventListener('resize', handleResize);
window.addEventListener('resize', handleResize);

// Clean up Split.js instance when the page is unloaded
window.addEventListener('beforeunload', () => {
    if (splitInstance) {
        splitInstance.destroy();
    }
});

// Initialize editors
function initializeEditors(): void {
    const htmlContainer = document.getElementById('html-editor-container');
    const cssContainer = document.getElementById('css-editor-container');
    const jsContainer = document.getElementById('js-editor-container');

    if (!htmlContainer || !cssContainer || !jsContainer) {
        throw new Error('Editor containers not found');
    }

    const cm = CodeMirror as unknown as CodeMirrorInstance;

    editors.html = cm(htmlContainer, {
        mode: 'htmlmixed',
        theme: isDarkMode ? 'monokai' : 'default',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
        extraKeys: {
            'Tab': (cm: Editor) => cm.execCommand('indentMore'),
            'Shift-Tab': (cm: Editor) => cm.execCommand('indentLess'),
            'Ctrl-Enter': () => runCode(),
            'Ctrl-F': () => void formatCode(),
            'Ctrl-/': 'toggleComment'
        }
    });
    editors.css = cm(cssContainer, {
        mode: 'css',
        theme: isDarkMode ? 'monokai' : 'default',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
        extraKeys: {
            'Tab': (cm: Editor) => cm.execCommand('indentMore'),
            'Shift-Tab': (cm: Editor) => cm.execCommand('indentLess'),
            'Ctrl-Enter': () => runCode(),
            'Ctrl-F': () => void formatCode(),
            'Ctrl-/': 'toggleComment'
        }
    });
    editors.js = cm(jsContainer, {
        mode: 'javascript',
        theme: isDarkMode ? 'monokai' : 'default',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
        lint: true,
        extraKeys: {
            'Tab': (cm: Editor) => cm.execCommand('indentMore'),
            'Shift-Tab': (cm: Editor) => cm.execCommand('indentLess'),
            'Ctrl-Enter': () => runCode(),
            'Ctrl-F': () => void formatCode(),
            'Ctrl-/': 'toggleComment'
        }
    });

    // Auto-run on change
    if (isAutoRun) {
        Object.values(editors).forEach(editor => {
            editor.on('change', debounce(runCode, 1000));
        });
    }

    // Initialize Split.js
    initializeSplit();

    // Load state
    loadState();
    updateAutoRunStatus();
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        updateThemeIcon();
    }
}

// Console message handling
window.addEventListener('message', (event) => {
    if (event.data.type === 'console') {
        const entry = document.createElement('div');
        entry.className = 'console-entry';
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date(event.data.timestamp).toLocaleTimeString();
        const message = document.createElement('span');
        message.className = `console-${event.data.level}`;
        if (event.data.data && event.data.data.length) {
            event.data.data.forEach((item: any, i: any) => {
                if (i > 0) message.appendChild(document.createTextNode(' '));
                if (item && typeof item === 'object') {
                    message.appendChild(renderObject(item));
                } else {
                    message.appendChild(document.createTextNode(String(item)));
                }
            });
        }
        if (event.data.data[1]?.stack) {
            const stack = document.createElement('div');
            stack.className = 'console-stack';
            stack.textContent = event.data.data[1].stack;
            stack.addEventListener('click', () => stack.classList.toggle('expanded'));
            message.appendChild(stack);
        }
        entry.appendChild(timestamp);
        entry.appendChild(document.createTextNode(' '));
        entry.appendChild(message);
        consoleOutput.appendChild(entry);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
});

// Render objects with depth limit and circular reference handling
function renderObject(obj: any, level = 0, visited = new WeakSet()) {
    if (obj === null) return document.createTextNode('null');
    if (typeof obj !== 'object') return document.createTextNode(String(obj));
    if (visited.has(obj)) return document.createTextNode('[Circular]');
    if (level > 3) return document.createTextNode('[...]');
    visited.add(obj);

    const container = document.createElement('span');
    if (obj instanceof Error) {
        const errorEl = document.createElement('span');
        errorEl.className = 'console-error';
        errorEl.textContent = `${obj.name}: ${obj.message}`;
        if (obj.stack) errorEl.textContent += `\n${obj.stack.split('\n').slice(1).join('\n')}`;
        container.appendChild(errorEl);
        return container;
    }

    const preview = document.createElement('span');
    preview.className = 'console-object';
    preview.textContent = Array.isArray(obj) ? `Array(${obj.length})` : '{...}';
    const content = document.createElement('div');
    content.className = 'console-object-content';

    Object.entries(obj).forEach(([key, value]) => {
        const prop = document.createElement('div');
        prop.textContent = `${key}: `;
        prop.appendChild(renderObject(value, level + 1, visited));
        content.appendChild(prop);
    });

    preview.addEventListener('click', (e) => {
        e.stopPropagation();
        preview.classList.toggle('expanded');
    });

    container.appendChild(preview);
    container.appendChild(content);
    return container;
}

// Save state with fallback
function saveState() {
    state.html = editors.html.getValue();
    state.css = editors.css.getValue();
    state.js = editors.js.getValue();
    state.activeTab = currentTab;
    state.activeOutput = currentOutput;
    try {
        localStorage.setItem('htmlRunnerState', JSON.stringify(state));
    } catch (e: any) {
        showError('Failed to save state: ' + e.message);
    }
}

// Load state with fallback
function loadState() {
    try {
        const savedState = localStorage.getItem('htmlRunnerState');
        if (savedState) {
            const parsed = JSON.parse(savedState);
            editors.html.setValue(parsed.html || '');
            editors.css.setValue(parsed.css || '');
            editors.js.setValue(parsed.js || '');
            if (parsed.activeTab) switchTab(parsed.activeTab);
            if (parsed.activeOutput) switchOutput(parsed.activeOutput);
            if (parsed.splitSizes) state.splitSizes = parsed.splitSizes;
            runCode();
        } else {
            resetCode();
        }
    } catch (e: any) {
        showError('Failed to load state: ' + e.message);
        resetCode();
    }
}

// Run code
function runCode() {
    showLoading();
    clearConsole();
    try {
        const html = editors.html.getValue();
        const css = editors.css.getValue();
        const js = editors.js.getValue();

        // Pre-parse JS
        try {
            if (js.trim()) new Function(js);
        } catch (syntaxError: any) {
            logConsoleError(`SyntaxError: ${syntaxError.message}`);
            hideLoading();
            return;
        }

        let docContent;
        const isFullHtml = /<html[\s>]|<!doctype html/i.test(html);
        if (isFullHtml) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            if (!doc.head) doc.documentElement.insertBefore(document.createElement('head'), doc.body);
            const script = document.createElement('script');
            script.textContent = consoleInterceptor;
            doc.head.appendChild(script);
            if (css.trim()) {
                const style = document.createElement('style');
                style.textContent = css;
                doc.head.appendChild(style);
            }
            if (js.trim()) {
                const script = document.createElement('script');
                script.textContent = js;
                doc.body.appendChild(script);
            }
            docContent = doc.documentElement.outerHTML;
        } else {
            docContent = [
                '<!DOCTYPE html><html><head><meta charset="UTF-8">',
                '<style>', css, '</style>',
                '<script>', consoleInterceptor, '<\/script>',
                '</head><body>', html, '</body>',
                '<script>', js, '<\/script></html>'
            ].join('');
        }

        const blob = new Blob([docContent], { type: 'text/html; charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const preview = document.getElementById('preview');
        if (!preview || !(preview instanceof HTMLIFrameElement)) {
            throw new Error('Preview element not found or is not an iframe');
        }
        preview.src = url;
        preview.addEventListener('load', () => URL.revokeObjectURL(url));
        switchOutput('preview');
        saveState();
    } catch (error: any) {
        showError(`Error running code: ${error.message}`);
    } finally {
        hideLoading();
    }
}

// Format code
async function formatCode() {
    try {
        const formattedHtml = await prettier.format(editors.html.getValue(), { 
            parser: 'html',
            plugins: [parserHtml],
            printWidth: 100,
            tabWidth: 2,
            htmlWhitespaceSensitivity: 'css'
        });
        const formattedCss = await prettier.format(editors.css.getValue(), { 
            parser: 'css',
            plugins: [parserCss],
            printWidth: 100,
            tabWidth: 2
        });
        const formattedJs = await prettier.format(editors.js.getValue(), { 
            parser: 'flow',
            plugins: [parserFlow, (prettierPluginEstree as any).default || prettierPluginEstree],
            printWidth: 100,
            tabWidth: 2,
            semi: true,
            singleQuote: true,
            trailingComma: 'es5',
            bracketSpacing: true
        });
        
        editors.html.setValue(formattedHtml);
        editors.css.setValue(formattedCss);
        editors.js.setValue(formattedJs);
        saveState();
    } catch (error: any) {
        showError(`Error formatting code: ${error.message}`);
    }
}

// Switch editor tab
function switchTab(tab: string): void {
    currentTab = tab;
    // Hide all containers and remove active class from all tabs
    document.querySelectorAll('.editor-container').forEach(c => {
        const container = c as HTMLElement;
        container.style.display = 'none';
    });
    document.querySelectorAll('.editor-tabs .tab').forEach(t => {
        t.classList.remove('active');
    });
    
    const editorContainer = document.getElementById(`${tab}-editor-container`);
    const tabElement = document.querySelector(`.editor-tabs .tab[data-tab="${tab}"]`);
    
    if (!editorContainer || !tabElement || !editors[tab]) {
        console.error(`Invalid tab: ${tab}`);
        return;
    }

    editorContainer.style.display = 'block';
    tabElement.classList.add('active');
    editors[tab].focus();

    // Ensure proper rendering after tab switch
    setTimeout(() => {
        // Refresh all editors to ensure proper sizing
        Object.values(editors).forEach(editor => editor.refresh());
    }, 0);
    
    saveState();
}

// Switch output tab
function switchOutput(output: string): void {
    currentOutput = output;
    const previewEl = document.getElementById('preview');
    const consoleEl = document.getElementById('console');
    const targetEl = document.getElementById(output);
    const tabEl = document.querySelector(`.output-tabs .tab[data-output="${output}"]`);

    if (!previewEl || !consoleEl || !targetEl || !tabEl) {
        console.error(`Invalid output: ${output}`);
        return;
    }

    previewEl.classList.remove('active');
    consoleEl.classList.remove('active');
    targetEl.classList.add('active');
    document.querySelectorAll('.output-tabs .tab').forEach(t => t.classList.remove('active'));
    tabEl.classList.add('active');
    saveState();
}

// Toggle auto-run
function toggleAutoRun(): void {
    isAutoRun = !isAutoRun;
    localStorage.setItem('autoRun', String(isAutoRun));
    Object.values(editors).forEach(editor => {
        const handler = debounce(runCode, 1000);
        editor.off('change', handler);
        if (isAutoRun) {
            editor.on('change', handler);
        }
    });
    updateAutoRunStatus();
}

function updateAutoRunStatus(): void {
    const statusEl = document.getElementById('auto-run-status');
    if (statusEl) {
        statusEl.textContent = isAutoRun ? 'On' : 'Off';
    }
}

// Clear console
function clearConsole() {
    consoleOutput.innerHTML = '';
}

// Reset code
function resetCode() {
    if (confirm('Are you sure you want to reset all code?')) {
        editors.html.setValue(`<!DOCTYPE html>
<html>
<head>
<title>My Page</title>
</head>
<body>
<h1>Hello, HTMLRunner!</h1>
<p>This is a demo page.</p>
<button onclick="testFunction()">Click me!</button>
</body>
</html>`);
        editors.css.setValue(`body {
font-family: Arial, sans-serif;
margin: 20px;
line-height: 1.6;
}
button {
background: #2196F3;
color: white;
border: none;
padding: 10px 15px;
border-radius: 4px;
cursor: pointer;
font-size: 16px;
}
button:hover {
background: #1976D2;
}`);
        editors.js.setValue(`function testFunction() {
console.log('Button clicked!');
console.warn('This is a warning');
console.error('This is an error');
console.info('This is an info');
console.log('Object:', { name: 'Alice', age: 25, hobbies: ['coding', 'reading'] });
}`);
        runCode();
        saveState();
    }
}

// Toggle dark mode
function toggleDarkMode(): void {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', String(isDarkMode));
    Object.values(editors).forEach(editor => {
        editor.setOption('theme', isDarkMode ? 'monokai' : 'default');
    });
    updateThemeIcon();
}

function updateThemeIcon(): void {
    const icon = document.querySelector('.theme-toggle i');
    const label = document.querySelector('.theme-toggle span');
    if (label) {
        label.textContent = isDarkMode ? 'Light Mode' : 'Dark Mode';
    }
    if (icon) {
        icon.classList.toggle('fa-moon', !isDarkMode);
        icon.classList.toggle('fa-sun', isDarkMode);
    }
}

// Utility functions
function showLoading() { loadingEl.classList.add('active'); }
function hideLoading() { loadingEl.classList.remove('active'); }

function showError(message: string): void {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => errorEl.style.display = 'none', 5000);
}

function logConsoleError(message: string, stack: { stack?: string } = {}): void {
    const entry = document.createElement('div');
    entry.className = 'console-entry';
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    const msg = document.createElement('span');
    msg.className = 'console-error';
    msg.textContent = message;
    if (stack.stack) {
        const stackEl = document.createElement('div');
        stackEl.className = 'console-stack';
        stackEl.textContent = stack.stack;
        stackEl.addEventListener('click', () => stackEl.classList.toggle('expanded'));
        msg.appendChild(stackEl);
    }
    entry.appendChild(timestamp);
    entry.appendChild(document.createTextNode(' '));
    entry.appendChild(msg);
    consoleOutput.appendChild(entry);
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: number | undefined;
    return function(this: any, ...args: Parameters<T>): void {
        if (timeout) window.clearTimeout(timeout);
        timeout = window.setTimeout(() => func.apply(this, args), wait);
    };
}

// Expose functions to window object
Object.assign(window, {
    runCode,
    clearConsole,
    resetCode,
    formatCode,
    toggleAutoRun,
    toggleDarkMode,
    switchTab,
    switchOutput
});

// Initialize
document.addEventListener('DOMContentLoaded', initializeEditors);
