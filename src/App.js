import React from 'react';
import VisualCodeEditor from './components/VisualCodeEditor';

function App() {
  return (
    <div className="App">
      <header className="bg-blue-600 text-white p-4 mb-4">
        <h1 className="text-2xl font-bold">Visual Code Editor</h1>
      </header>
      <main className="container mx-auto px-4">
        <VisualCodeEditor />
      </main>
      <footer className="bg-gray-200 p-4 mt-8 text-center text-gray-600">
        <p>Powered by Juspay</p>
      </footer>
    </div>
  );
}

export default App;