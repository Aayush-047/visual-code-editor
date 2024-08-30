import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Play, Rewind } from 'lucide-react';
import CatSprite from './CatSprite';
import Block from './Block';
import DroppableArea from './DroppableArea';
import SpeechBubble from './SpeechBubble';
import { MOTION, LOOKS } from '../constants/BlockTypes';
import { BACKDROPS } from '../data/BackDrops';
import useExecuteAction from '../hooks/useExecuteAction';
import * as actionTypes from '../constants/ActionTypes';

const VisualCodeEditor = () => {
  const [blocks, setBlocks] = useState([]);
  const [history, setHistory] = useState([]);
  const spriteRef = useRef(null);
  const [spriteState, setSpriteState] = useState({ x: 0, y: 0, rotation: -90, size: 100 });
  const [isRunning, setIsRunning] = useState(false);
  const [spriteColor, setSpriteColor] = useState('#FFAB19');
  const [backdropIndex, setBackdropIndex] = useState(0);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [speechBubble, setSpeechBubble] = useState({ message: '', isThinking: false });
  const [sidebarBlocks, setSidebarBlocks] = useState([
    { id: 'sidebar-move-x', type: MOTION, action: actionTypes.MOVE_X, value: 10 },
    { id: 'sidebar-move-y', type: MOTION, action: actionTypes.MOVE_Y, value: 10 },
    { id: 'sidebar-turn-right', type: MOTION, action: actionTypes.TURN_RIGHT, value: 15 },
    { id: 'sidebar-turn-left', type: MOTION, action: actionTypes.TURN_LEFT, value: 15 },
    { id: 'sidebar-goto', type: MOTION, action: actionTypes.GOTO, value: [0, 0] },
    { id: 'sidebar-goto-random', type: MOTION, action: actionTypes.GOTO_RANDOM, value: null },
    { id: 'sidebar-point-in-direction', type: MOTION, action: actionTypes.POINT_IN_DIRECTION, value: 90 },
    { id: 'sidebar-point-towards-random', type: MOTION, action: actionTypes.POINT_TOWARDS_RANDOM, value: null },
    { id: 'sidebar-say', type: LOOKS, action: actionTypes.SAY, value: '' },
    { id: 'sidebar-think', type: LOOKS, action: actionTypes.THINK, value: '' },
    { id: 'sidebar-say-timer', type: LOOKS, action: actionTypes.SAY_TIMER, value: { message: '', duration: 2 } },
    { id: 'sidebar-think-timer', type: LOOKS, action: actionTypes.THINK_TIMER, value: { message: '', duration: 2 } },
    { id: 'sidebar-change-size-to', type: LOOKS, action: actionTypes.CHANGE_SIZE_TO, value: 100 },
    { id: 'sidebar-change-size-by', type: LOOKS, action: actionTypes.CHANGE_SIZE_BY, value: 10 },
    { id: 'sidebar-change-color', type: LOOKS, action: actionTypes.CHANGE_COLOR, value: '#FFAB19' },
    { id: 'sidebar-change-backdrop', type: LOOKS, action: actionTypes.CHANGE_BACKDROP, value: 0 },
    { id: 'sidebar-hide', type: LOOKS, action: actionTypes.HIDE, value: null },
    { id: 'sidebar-show', type: LOOKS, action: actionTypes.SHOW, value: null },
  ]);

  const executeAction = useExecuteAction(spriteRef);

  const handleSidebarBlockChange = useCallback((id, action, value) => {
    setSidebarBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id ? { ...block, value } : block
      )
    );
  }, []);

  const handleDrop = useCallback((item) => {
    const newBlock = { ...item, id: Date.now() };
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    setHistory((prevHistory) => [...prevHistory, newBlock]);
  }, []);

  const handleBlockChange = useCallback((id, action, value) => {
    setBlocks((prevBlocks) =>
      prevBlocks.map((block) =>
        block.id === id ? { ...block, value } : block
      )
    );
  }, []);

  const handleRemoveBlock = useCallback((id) => {
    setBlocks((prevBlocks) => prevBlocks.filter((block) => block.id !== id));
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const runActions = async () => {
      if (isRunning && currentActionIndex < blocks.length) {
        await executeAction(blocks[currentActionIndex], setSpriteState, setSpeechBubble, setSpriteColor, setBackdropIndex);
        if (!isCancelled) {
          setCurrentActionIndex((prevIndex) => prevIndex + 1);
        }
      } else if (currentActionIndex >= blocks.length) {
        setIsRunning(false);
        setCurrentActionIndex(0);
        setSpeechBubble({ message: '', isThinking: false });
      }
    };

    runActions();

    return () => {
      isCancelled = true;
    };
  }, [isRunning, currentActionIndex, blocks, executeAction]);

  const runCode = useCallback(() => {
    if (isRunning) return;
    setCurrentActionIndex(0);
    setSpeechBubble({ message: '', isThinking: false });
    setIsRunning(true);
  }, [isRunning]);

  const replayNthAction = useCallback((n) => {
    if (n > 0 && n <= history.length) {
      executeAction(history[n - 1], setSpriteState, setSpeechBubble, setSpriteColor, setBackdropIndex);
    }
  }, [history, executeAction]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
        <h1 className="text-xl font-bold mb-4">Blocks</h1>
          <h2 className="text-lg font-bold mb-2">Motion</h2>
          {sidebarBlocks.filter(block => block.type === MOTION).map((block) => (
            <Block
              key={block.id}
              id={block.id}
              type={block.type}
              action={block.action}
              value={block.value}
              onChange={handleSidebarBlockChange}
              isDraggable={true}
            />
          ))}
          <h2 className="text-lg font-bold mb-2 mt-4">Looks</h2>
          {sidebarBlocks.filter(block => block.type === LOOKS).map((block) => (
            <Block
              key={block.id}
              id={block.id}
              type={block.type}
              action={block.action}
              value={block.value}
              onChange={handleSidebarBlockChange}
              isDraggable={true}
            />
          ))}
        </div>

        {/* Droppable Area */}
        <div className="w-3/6 p-4 h-[100%]">
        <h1 className="text-xl font-bold mb-4 text-center">Workspace</h1>
        <p className="text-center mb-2 font-semibold">
          Drag blocks into the center area and press "Run Code" to run your code.
        </p>
          <DroppableArea onDrop={handleDrop}>
            {blocks.map((block) => (
              <Block
                key={block.id}
                id={block.id}
                type={block.type}
                action={block.action}
                value={block.value}
                onChange={handleBlockChange}
                onRemove={handleRemoveBlock}
                isDraggable={true}
              />
            ))}
          </DroppableArea>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={runCode}
              disabled={isRunning}
              className={`bg-green-500 text-white p-2 rounded flex items-center ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Play size={16} className="mr-1" /> Run Code
            </button>
            <button
              onClick={() => replayNthAction(prompt('Enter action number to replay:'))}
              className="bg-blue-500 text-white p-2 rounded flex items-center"
            >
              <Rewind size={16} className="mr-1" /> Replay Action
            </button>
            
          </div>
        </div>

        {/* Preview Area */}
        <div className="w-3/6 p-4 border-l">
        <h1 className="text-xl font-bold mb-4 text-center">Preview</h1>
          <div className="border p-4 h-[600px] relative min-h-[600px] overflow-x-auto overflow-y-auto" style={{
            backgroundColor: backdropIndex === 0 ? 'white' : undefined,
            backgroundImage: backdropIndex !== 0 ? `url(${BACKDROPS[backdropIndex].url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            <div
              ref={spriteRef}
              className="w-24 h-24 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ transform: `translate(${spriteState.x}px, ${spriteState.y}px) rotate(${spriteState.rotation + 90}deg) scale(${spriteState.size / 100})` }}
            >
              {speechBubble.message && (
                <SpeechBubble message={speechBubble.message} isThinking={speechBubble.isThinking} />
              )}
              <CatSprite color={spriteColor} />
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default VisualCodeEditor;