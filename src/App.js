import React from 'react';
import VisualCodeEditor from './components/visualCodeEditor/VisualCodeEditor';

function App() {
  return (
    <div className="App editor-surface flex min-h-screen flex-col">
      <main className="flex-1">
        <VisualCodeEditor />
      </main>
      <footer className="app-footer theme-transition backdrop-blur-sm">
        <p>Powered by Aayush Khunger</p>
      </footer>
    </div>
  );
}

export default App;
