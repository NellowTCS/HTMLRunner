import * as CodeMirror from 'codemirror';
import { CodeMirrorInstance, CodeMirrorEditor, Editors } from './types';
import { runCode, formatCode } from './runner';
import { toggleSearch } from './main';
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
            'Ctrl-F': (cm: CodeMirrorEditor) => {
                const wrapper = cm.getWrapperElement();
                const existingDialog = wrapper.querySelector('.CodeMirror-dialog');
                if (existingDialog) {
                    const isFind = existingDialog.querySelector('input[type="text"]')?.getAttribute('placeholder')?.includes('Replace') === false;
                    if (isFind) {
                        // If Find is open, close it
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                        }, 200);
                    } else {
                        // If Replace is open, close it and open Find
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                            toggleSearch('find');
                        }, 200);
                    }
                } else {
                    // If nothing is open, open Find
                    toggleSearch('find');
                }
            },
            'Cmd-F': (cm: CodeMirrorEditor) => {
                const wrapper = cm.getWrapperElement();
                const existingDialog = wrapper.querySelector('.CodeMirror-dialog');
                if (existingDialog) {
                    const isFind = existingDialog.querySelector('input[type="text"]')?.getAttribute('placeholder')?.includes('Replace') === false;
                    if (isFind) {
                        // If Find is open, close it
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                        }, 200);
                    } else {
                        // If Replace is open, close it and open Find
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                            toggleSearch('find');
                        }, 200);
                    }
                } else {
                    // If nothing is open, open Find
                    toggleSearch('find');
                }
            },
            'Ctrl-H': (cm: CodeMirrorEditor) => {
                const wrapper = cm.getWrapperElement();
                const existingDialog = wrapper.querySelector('.CodeMirror-dialog');
                if (existingDialog) {
                    const isReplace = existingDialog.querySelector('input[type="text"]')?.getAttribute('placeholder')?.includes('Replace') === true;
                    if (isReplace) {
                        // If Replace is open, close it (do not reopen)
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                        }, 200);
                    } else {
                        // If Find is open, close and open Replace
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                            toggleSearch('replace');
                        }, 200);
                    }
                } else {
                    // If nothing is open, open Replace
                    toggleSearch('replace');
                }
            },
            'Cmd-H': (cm: CodeMirrorEditor) => {
                const wrapper = cm.getWrapperElement();
                const existingDialog = wrapper.querySelector('.CodeMirror-dialog');
                if (existingDialog) {
                    const isReplace = existingDialog.querySelector('input[type="text"]')?.getAttribute('placeholder')?.includes('Replace') === true;
                    if (isReplace) {
                        // If Replace is open, close it (do not reopen)
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                        }, 200);
                    } else {
                        // If Find is open, close and open Replace
                        existingDialog.classList.remove('visible');
                        setTimeout(() => {
                            cm.execCommand('clearSearch');
                            existingDialog.remove();
                            toggleSearch('replace');
                        }, 200);
                    }
                } else {
                    // If nothing is open, open Replace
                    toggleSearch('replace');
                }
            },
            'Ctrl-/': 'toggleComment',
            'Cmd-/': 'toggleComment'
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
