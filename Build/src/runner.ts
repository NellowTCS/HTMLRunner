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

export async function formatCode(): Promise<void> {
    try {
        const formattedHtml = await prettier.format(editors.html.getValue(), { 
            parser: 'html', 
            plugins: window.prettierPlugins 
        });
        const formattedCss = await prettier.format(editors.css.getValue(), { 
            parser: 'css', 
            plugins: window.prettierPlugins 
        });
        const formattedJs = await prettier.format(editors.js.getValue(), { 
            parser: 'babel', 
            plugins: window.prettierPlugins 
        });
        
        editors.html.setValue(formattedHtml);
        editors.css.setValue(formattedCss);
        editors.js.setValue(formattedJs);
        saveState();
    } catch (error: any) {
        showError(`Error formatting code: ${error.message}`);
    }
}
