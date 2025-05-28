import { editors, darkMode as isDarkMode, autoRun as isAutoRun, setDarkMode, setAutoRun } from './editor';
import { saveState } from './state';
import { runCode } from './runner';
import { debounce } from './utils';

export const loadingEl = document.getElementById('loading') as HTMLDivElement;
export const errorEl = document.getElementById('error-message') as HTMLDivElement;

let currentTab = 'html';
let currentOutput = 'preview';

export function showLoading(): void { 
    loadingEl.classList.add('active'); 
}

export function hideLoading(): void { 
    loadingEl.classList.remove('active'); 
}

export function showError(message: string): void {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => errorEl.style.display = 'none', 5000);
}

export function switchTab(tab: string): void {
    currentTab = tab;
    document.querySelectorAll('.editor-container').forEach(c => {
        const container = c as HTMLElement;
        container.style.display = 'none';
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
    saveState();
}

export function switchOutput(output: string): void {
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

export function toggleAutoRun(): void {
    setAutoRun(!isAutoRun);
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

export function updateAutoRunStatus(): void {
    const statusEl = document.getElementById('auto-run-status');
    if (statusEl) {
        statusEl.textContent = isAutoRun ? 'On' : 'Off';
    }
}

export function toggleDarkMode(): void {
    setDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', String(isDarkMode));
    Object.values(editors).forEach(editor => {
        editor.setOption('theme', isDarkMode ? 'monokai' : 'default');
    });
    updateThemeIcon();
}

export function updateThemeIcon(): void {
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
