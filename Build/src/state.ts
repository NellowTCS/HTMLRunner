import { State } from './types';
import { editors } from './editor';
import { showError, switchTab, switchOutput } from './ui';
import { runCode } from './runner';

export const state: State = {
    html: '',
    css: '',
    js: '',
    activeTab: 'html',
    activeOutput: 'preview',
    splitSizes: [50, 50]
};

export function saveState(): void {
    state.html = editors.html.state.doc.toString();
    state.css = editors.css.state.doc.toString();
    state.js = editors.js.state.doc.toString();
    try {
        localStorage.setItem('htmlRunnerState', JSON.stringify(state));
    } catch (e: any) {
        showError('Failed to save state: ' + e.message);
    }
}

export function loadState(): void {
    try {
        const savedState = localStorage.getItem('htmlRunnerState');
        if (savedState) {
            const parsed = JSON.parse(savedState);

            if (parsed.html !== undefined) {
                editors.html.dispatch({
                    changes: { from: 0, to: editors.html.state.doc.length, insert: parsed.html }
                });
            }
            if (parsed.css !== undefined) {
                editors.css.dispatch({
                    changes: { from: 0, to: editors.css.state.doc.length, insert: parsed.css }
                });
            }
            if (parsed.js !== undefined) {
                editors.js.dispatch({
                    changes: { from: 0, to: editors.js.state.doc.length, insert: parsed.js }
                });
            }

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

export function resetCode(): void {
    if (confirm('Are you sure you want to reset all code?')) {
        editors.html.dispatch({
            changes: { from: 0, to: editors.html.state.doc.length, insert: `<!DOCTYPE html>
<html>
<head>
<title>My Page</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
<script src="main.js"></script>
<h1>Hello, HTMLRunner!</h1>
<p>This is a demo page.</p>
<button onclick="testFunction()">Click me!</button>
</body>
</html>` }
        });

        editors.css.dispatch({
            changes: { from: 0, to: editors.css.state.doc.length, insert: `body {
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
}` }
        });

        editors.js.dispatch({
            changes: { from: 0, to: editors.js.state.doc.length, insert: `function testFunction() {
console.log('Button clicked!');
console.warn('This is a warning');
console.error('This is an error');
console.info('This is an info');
console.log('Object:', { name: 'Alice', age: 25, hobbies: ['coding', 'reading'] });
}` }
        });

        runCode();
        saveState();
    }
}
