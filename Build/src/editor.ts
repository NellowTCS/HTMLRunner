import { Compartment, EditorState, Extension } from "@codemirror/state";
import { EditorView, lineNumbers, keymap, ViewUpdate } from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { linter, lintGutter } from "@codemirror/lint";
import { monokai } from "@uiw/codemirror-theme-monokai";
import { bbedit } from "@uiw/codemirror-theme-bbedit";
import { CodeMirrorEditor, Editors } from "./types";
import { runCode } from "./runner";
import { toggleSearch } from "./main";
import { debounce } from "./utils";
import Split from "split.js";
import { state, saveState } from "./state";
import { search, openSearchPanel, closeSearchPanel } from "@codemirror/search";

// Initialize editors
export let editors: Editors = {
  html: null as unknown as CodeMirrorEditor,
  css: null as unknown as CodeMirrorEditor,
  js: null as unknown as CodeMirrorEditor,
};

export let darkMode: boolean =
  localStorage.getItem("darkMode") === "true" || false;
export let autoRun: boolean =
  localStorage.getItem("autoRun") === "true" || false;

export function initializeEditors(): void {
  const htmlContainer = document.getElementById("html-editor-container");
  const cssContainer = document.getElementById("css-editor-container");
  const jsContainer = document.getElementById("js-editor-container");

  if (!htmlContainer || !cssContainer || !jsContainer) {
    throw new Error("Editor containers not found");
  }

  editors.html = createEditor(htmlContainer, "htmlmixed");
  editors.css = createEditor(cssContainer, "css");
  editors.js = createEditor(jsContainer, "javascript", [
    javascript({ jsx: false, typescript: false }),
    linter((view) => []), // Placeholder linter; replace with actual linter later
    lintGutter(),
  ]);

  // Initialize Split.js
  Split(["#editor-panel", "#output-panel"], {
    sizes: state.splitSizes || [50, 50],
    minSize: 200,
    gutterSize: 8,
    direction: window.innerWidth <= 768 ? "vertical" : "horizontal",
    onDragEnd: (sizes) => {
      state.splitSizes = sizes;
      saveState();
    },
  });
}

// Create the editor using CodeMirror 6 API
function createEditor(
  container: HTMLElement,
  mode: string,
  additionalOptions: Extension[] = []
): CodeMirrorEditor {
  let language: Extension;
  switch (mode) {
    case "htmlmixed":
      language = html();
      break;
    case "css":
      language = css();
      break;
    case "javascript":
      language = javascript({ jsx: false, typescript: false });
      break;
    default:
      throw new Error(`Unsupported mode: ${mode}`);
  }

  // Create compartments for theme and auto-run
  const themeCompartment = new Compartment();
  const autoRunCompartment = new Compartment();

  const extensions: Extension[] = [
    language,
    themeCompartment.of(darkMode ? monokai : bbedit), // Use compartment for theme
    EditorView.lineWrapping,
    search(),
    lineNumbers(),
    keymap.of([
      {
        key: "Ctrl-F",
        run: () => {
          toggleSearch("find");
          return true;
        },
      },
      {
        key: "Ctrl-H",
        run: () => {
          toggleSearch("replace");
          return true;
        },
      },
      {
        key: "Ctrl-/",
        run: (view: EditorView) => {
          view.dispatch({
            changes: { from: 0, to: view.state.doc.length, insert: "" },
          });
          return true;
        },
      },
    ]),
    autoRunCompartment.of(
      autoRun
        ? EditorView.updateListener.of((update: ViewUpdate) => {
            if (update.docChanged) {
              debounce(runCode, 1000)();
            }
          })
        : []
    ),
    ...additionalOptions,
  ];

  const state = EditorState.create({
    doc: "",
    extensions,
  });

  const view = new EditorView({
    state,
    parent: container,
  });

  // Return the editor object with both compartments
  return { view, state, autoRunCompartment, themeCompartment };
}

export function setDarkMode(value: boolean): void {
  darkMode = value;
  Object.values(editors).forEach((editor) => {
    const theme = value ? monokai : bbedit;
    editor.view.dispatch({
      effects: editor.themeCompartment.reconfigure(theme),
    });
  });
}

export function setAutoRun(value: boolean): void {
  autoRun = value;
  // Dynamically reconfigure the auto-run listener for all editors
  Object.values(editors).forEach((editor) => {
    const listener = autoRun
      ? EditorView.updateListener.of((update: ViewUpdate) => {
          if (update.docChanged) {
            debounce(runCode, 1000)();
          }
        })
      : [];
    editor.view.dispatch({
      effects: editor.autoRunCompartment.reconfigure(listener),
    });
  });
}
