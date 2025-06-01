import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { bbedit } from '@uiw/codemirror-theme-bbedit';
import { keymap } from '@codemirror/view';
import { CodeMirrorEditor, Editors } from './types';
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

export let darkMode: boolean = localStorage.getItem('darkMode') === 'true' || false;
export let autoRun: boolean = localStorage.getItem('autoRun') === 'true' || false;

export function initializeEditors(): void {
    const htmlContainer = document.getElementById('html-editor-container');
    const cssContainer = document.getElementById('css-editor-container');
    const jsContainer = document.getElementById('js-editor-container');

    if (!htmlContainer || !cssContainer || !jsContainer) {
        throw new Error('Editor containers not found');
    }

    editors.html = createEditor(htmlContainer, 'htmlmixed');
    editors.css = createEditor(cssContainer, 'css');
    editors.js = createEditor(jsContainer, 'javascript', { lint: true });

    // Auto-run on change
    if (autoRun) {
        Object.values(editors).forEach(editor => {
            editor.view.dispatch({
                effects: editor.view.state.update({ docChanged: true })
            });
            editor.view.on('change', debounce(runCode, 1000));
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

// Create the editor using CodeMirror 6 API
function createEditor(container: HTMLElement, mode: string, additionalOptions = {}): CodeMirrorEditor {
    let language;
    switch (mode) {
        case 'htmlmixed':
            language = html();
            break;
        case 'css':
            language = css();
            break;
        case 'javascript':
            language = javascript();
            break;
    }

    const state = EditorState.create({
        doc: '',
        extensions: [
            language,
            // Apply theme correctly via EditorView.theme()
            darkMode ? monokai : bbedit,
            EditorView.lineWrapping,
            lineNumbers(),
            keymap.of([
                { key: 'Ctrl-F', run: () => { toggleSearch('find'); return true; } },
                { key: 'Ctrl-H', run: () => { toggleSearch('replace'); return true; } },
                { key: 'Ctrl-/', run: (view: any) => { 
                    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } });
                    return true;
                }},
            ]),
            ...additionalOptions
        ]
    });

    const view = new EditorView({
        state,
        parent: container
    });

    return { view, state };  // Return both view and state
}


export function setDarkMode(value: boolean): void {
    darkMode = value;
}

export function setAutoRun(value: boolean): void {
    autoRun = value;
}