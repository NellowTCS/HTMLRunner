import { editors } from './editor';
import { consoleInterceptor } from './console';
import { showError, showLoading, hideLoading, switchOutput } from './ui';
import { clearConsole, logConsoleError } from './console';
import { saveState } from './state';
import prettier from 'prettier/standalone';

export function runCode(): void {
    showLoading();
    clearConsole();
    try {
        const html = editors.html.state.doc.toString();  // Updated for CodeMirror 6
        const css = editors.css.state.doc.toString();    // Updated for CodeMirror 6
        const js = editors.js.state.doc.toString();      // Updated for CodeMirror 6

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

export async function formatCode(): Promise<void> {
    try {
        const formattedHtml = await prettier.format(editors.html.state.doc.toString(), { 
            parser: 'html', 
            plugins: window.prettierPlugins 
        });
        const formattedCss = await prettier.format(editors.css.state.doc.toString(), { 
            parser: 'css', 
            plugins: window.prettierPlugins 
        });
        const formattedJs = await prettier.format(editors.js.state.doc.toString(), { 
            parser: 'babel', 
            plugins: window.prettierPlugins 
        });
        
        editors.html.dispatch({
            changes: { from: 0, to: editors.html.state.doc.length, insert: formattedHtml }
        });
        editors.css.dispatch({
            changes: { from: 0, to: editors.css.state.doc.length, insert: formattedCss }
        });
        editors.js.dispatch({
            changes: { from: 0, to: editors.js.state.doc.length, insert: formattedJs }
        });

        saveState();
    } catch (error: any) {
        showError(`Error formatting code: ${error.message}`);
    }
}
