import * as CodeMirror from 'codemirror';
import { CodeMirrorInstance, CodeMirrorEditor, Editors } from './types';
import { runCode, formatCode } from './runner';
import { debounce } from './utils';
import Split from 'split.js';
import { state, saveState } from './state';

// Initialize editors
export let editors: Editors = {
    html: null as unknown as CodeMirrorEditor,
    css: null as unknown as CodeMirrorEditor,
    js: null as unknown as CodeMirrorEditor
};

export let darkMode: boolean = localStorage.getItem('darkMode') === 'true';
export let autoRun: boolean = localStorage.getItem('autoRun') === 'true';

export function initializeEditors(): void {
    const htmlContainer = document.getElementById('html-editor-container');
    const cssContainer = document.getElementById('css-editor-container');
    const jsContainer = document.getElementById('js-editor-container');

    if (!htmlContainer || !cssContainer || !jsContainer) {
        throw new Error('Editor containers not found');
    }

    const cm = CodeMirror as unknown as CodeMirrorInstance;

    editors.html = createEditor(cm, htmlContainer, 'htmlmixed');
    editors.css = createEditor(cm, cssContainer, 'css');
    editors.js = createEditor(cm, jsContainer, 'javascript', { lint: true });

    // Auto-run on change
    if (autoRun) {
        Object.values(editors).forEach(editor => {
            editor.on('change', debounce(runCode, 1000));
        });
    }

    // Initialize Split.js
    Split(['#editor-panel', '#output-panel'], {
        sizes: state.splitSizes || [50, 50],
        minSize: 200,
        gutterSize: 8,
        direction: window.innerWidth <= 768 ? 'vertical' : 'horizontal',
        onDragEnd: (sizes) => {
            state.splitSizes = sizes;
            saveState();
        }
    });
}

function createEditor(cm: CodeMirrorInstance, container: HTMLElement, mode: string, additionalOptions = {}): CodeMirrorEditor {
    return cm(container, {
        mode,
        theme: darkMode ? 'monokai' : 'default',
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        indentWithTabs: false,
        lineWrapping: true,
        extraKeys: {
            'Tab': (cm: CodeMirrorEditor) => cm.execCommand('indentMore'),
            'Shift-Tab': (cm: CodeMirrorEditor) => cm.execCommand('indentLess'),
            'Ctrl-Enter': () => runCode(),
            'Ctrl-F': () => void formatCode(),
            'Ctrl-/': 'toggleComment'
        },
        ...additionalOptions
    });
}

export function setDarkMode(value: boolean): void {
    darkMode = value;
}

export function setAutoRun(value: boolean): void {
    autoRun = value;
}
