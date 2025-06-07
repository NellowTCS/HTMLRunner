# HTMLRunner

![GitHub License](https://img.shields.io/github/license/NellowTCS/HTMLRunner)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/NellowTCS/HTMLRunner/webpack.yml)

</br>
</br>
</br>

# HTMLRunner has a new home! 
(Don't worry, it wasn't sold or anything)</br>
https://github.com/HTMLToolkit/HTMLRunner

</br>
</br>
</br>

A powerful, browser-based HTML/CSS/JavaScript code editor and live preview tool. Write, test, and debug your web code with real-time execution and an integrated console.

(I learned TypeScript finally, yay!!!)

## Features

### **Web Code Editor**
- **HTML Editor** with syntax highlighting and auto-completion
- **CSS Editor** with live styling preview
- **JavaScript Editor** with linting and error detection
- **Syntax Highlighting** powered by CodeMirror
- **Auto-indentation** and bracket matching

### **Live Code Execution**
- **Real-time Preview** of your HTML/CSS/JS code
- **Auto-run Mode** for instant feedback as you type
- **Error Handling** with detailed stack traces
- **Console Integration** for debugging

### **Developer Tools**
- **Integrated Console** with log filtering (log, error, warn, info)
- **Code Formatting** using Prettier
- **Export Functionality** - Download your project as a ZIP file
- **Copy to Clipboard** for individual editors or console output
- **Responsive Split-Panel** layout

### **User Experience**
- **Dark/Light Mode** toggle
- **Tabbed Interface** for easy navigation
- **Persistent State** - Your work is automatically saved
- **Keyboard Shortcuts** for power users
- **Mobile Responsive** design

### **Console Features**
- Real-time JavaScript console output
- Object inspection with expandable views
- Stack trace display for errors
- Filter logs by type (log, error, warn, info)
- Copy individual messages or entire console
- Timestamp for each log entry

## Gallery
<img width="1280" alt="Screenshot 2025-06-01 at 8 49 54 PM" src="https://github.com/user-attachments/assets/117236d9-2496-4fd0-acf5-6709ff5bf777" />
<img width="1280" alt="Screenshot 2025-06-01 at 8 48 57 PM" src="https://github.com/user-attachments/assets/8355f015-fca2-4986-a0aa-8cc6c03220c0" />
<img width="1280" alt="Screenshot 2025-06-01 at 8 49 26 PM" src="https://github.com/user-attachments/assets/ee1024ee-5cb6-4ebc-8736-3e0948238309" />

## Getting Started

### Online Version
Visit the live version at: [https://nellowtcs.github.io/HTMLRunner/](https://nellowtcs.github.io/HTMLRunner/)

### Single File
Due to the Webpack build being rather large, I recommend using the website, but you do you :D. </br>
However, formatting your code isn't working in the Web Version currently.

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/NellowTCS/HTMLRunner.git
   cd HTMLRunner/Build
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

3. **Or Build and auto serve locally**
   ```bash
   npm start
   ```

## Usage

### Basic Workflow
1. **Write HTML** in the HTML editor tab
2. **Style with CSS** in the CSS editor tab  
3. **Add JavaScript** in the JS editor tab
4. **Click "Run"** or enable Auto-run for live preview
5. **Debug** using the integrated console
6. **Export** your project when ready

### Keyboard Shortcuts
- `Ctrl/Cmd + Enter` - Run code
- `Ctrl/Cmd + F` - Format current editor
- `Ctrl/Cmd + /` - Toggle comment
- `Tab` / `Shift + Tab` - Indent / Unindent

### Sample Code
HTMLRunner comes with a demo project to get you started:

**HTML:**
```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Page</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <script src="main.js"></script>
    <h1>Hello, HTMLRunner!</h1>
    <p>This is a demo page.</p>
    <button onclick="testFunction()">Click me!</button>
  </body>
</html>
```

**CSS:**
```css
body {
  font-family: Arial, sans-serif;
  margin: 20px;
  line-height: 1.6;
}
button {
  background: #2196f3;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}
button:hover {
  background: #1976d2;
}
```

**JavaScript:**
```javascript
function testFunction() {
  console.log('Button clicked!');
  console.warn('This is a warning');
  console.error('This is an error');
  console.info('This is an info');
  console.log('Object:', { name: 'Alice', age: 25, hobbies: ['coding', 'reading'] });
}

```

## Dependencies

- **Code Editor:** CodeMirror 5
- **Code Formatting:** Prettier
- **UI Layout:** Split.js for resizable panels
- **Webpack:** for compacting the code

## 🔧 Development

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Development Setup
```bash
git clone https://github.com/NellowTCS/HTMLRunner.git

cd HTMLRunner/Build

# Install dependencies
npm install

# Build for production
npm run build

# Test
npm test [ Your Tests ]
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Browser Support

HTMLRunner works on all modern browsers:
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## Future Features

- [ ] **File System Integration** - Save/Load projects from Folders or IndexedDB
- [ ] **Multiple Projects/Files**
- [ ] **Importing Files**
- [ ] **Collaboration Features** - Share code with others
- [ ] **Plugin System** - Extend functionality
- [ ] **More Language Support** - TypeScript, WASM, etc.
- [ ] **Version Control** - Built-in Git integration?
- [ ] **Template Library** - Pre-built code snippets
- [ ] **Performance Profiler** - Analyze code performance
- [ ] **Auto Completion** (using the built in CodeMirror tools)
- [ ] **Code Folding**
- [ ] **Clickable Stack Traces**

## License

This project is licensed under the GNU GPL v3.0 License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

---

**⭐ If you find HTMLRunner useful, please consider giving it a star on GitHub!**

For questions, suggestions, or issues, please [open an issue](https://github.com/NellowTCS/HTMLRunner/issues) on GitHub.
