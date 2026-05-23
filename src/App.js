import React from 'react';
import VisualCodeEditor from './components/VisualCodeEditor';

function App() {
  return (
    <div className="App flex min-h-screen flex-col">
      <main className="flex-1">
        <VisualCodeEditor />
      </main>
      <footer className="bg-gray-200 p-4 mt-8 text-center text-gray-600">
        <p>Powered by Aayush Khunger</p>
      </footer>
    </div>
  );
}

export default App;
