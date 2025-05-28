import { Editor, EditorConfiguration } from 'codemirror';

declare global {
    interface Window {
        prettierPlugins: any[];
    }
}

export interface CodeMirrorInstance {
    (element: HTMLElement, options?: EditorConfiguration): Editor;
}

export type CodeMirrorEditor = Editor;

export interface CodeMirrorEditorConfig extends EditorConfiguration {
    lint?: boolean | {
        async?: boolean;
        [key: string]: any;
    };
}

export interface Editors {
    html: CodeMirrorEditor;
    css: CodeMirrorEditor;
    js: CodeMirrorEditor;
    [key: string]: CodeMirrorEditor;
}

export interface State {
    html: string;
    css: string;
    js: string;
    activeTab: string;
    activeOutput: string;
    splitSizes: number[];
}

export interface ConsoleMessage {
    type: 'console';
    level: 'log' | 'error' | 'warn' | 'info';
    data: any[];
    timestamp: string;
}

export interface StackInfo {
    stack?: string;
}
