import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Play, Rewind } from 'lucide-react';
import CatSprite from './components/CatSprite';

// Block types
const MOTION = 'motion';
const LOOKS = 'looks';

// Action types
const MOVE_X = 'move_x';
const MOVE_Y = 'move_y';
const TURN_RIGHT = 'turn_right';
const TURN_LEFT = 'turn_left';
const GOTO = 'goto';
const GOTO_RANDOM = 'goto_random';
const POINT_IN_DIRECTION = 'point_in_direction';
const POINT_TOWARDS_RANDOM = 'point_towards_random';
const SAY = 'say';
const THINK = 'think';
const SAY_TIMER = 'say_timer';
const THINK_TIMER = 'think_timer';
const CHANGE_SIZE_TO = 'change_size_to';
const CHANGE_SIZE_BY = 'change_size_by';
const CHANGE_COLOR = 'change_color';
const CHANGE_BACKDROP = 'change_backdrop';
const HIDE = 'hide';
const SHOW = 'show';

const BACKDROPS = [
  { name: 'White Space', url: '' },
  { name: 'Beach', url: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/c7d5ef67-9717-49af-938d-ac85ee485d88/d3413g5-dab62529-d5d3-4133-ad3d-6d424b68ca2e.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2M3ZDVlZjY3LTk3MTctNDlhZi05MzhkLWFjODVlZTQ4NWQ4OFwvZDM0MTNnNS1kYWI2MjUyOS1kNWQzLTQxMzMtYWQzZC02ZDQyNGI2OGNhMmUuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.QfjVqmTb8WgMzWpFeHHbRu60j6CJ2HOui1QgOCSWgv4' },
  { name: 'Forest', url: 'https://img.freepik.com/free-vector/forest-landscape-scene-day-time-with-many-different-trees_1308-69873.jpg?size=626&ext=jpg&ga=GA1.1.2008272138.1724803200&semt=ais_hybrid' },
  { name: 'City', url: 'https://img.freepik.com/free-photo/big-city_1127-3102.jpg' },
  { name: 'Space', url: 'https://images-cdn.ubuy.co.in/64268ed8338722132109242a-allenjoy-outer-space-rocket-astronaut.jpg' },
];

const SpeechBubble = ({ message, isThinking }) => (
  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border-2 border-black rounded-lg p-2 min-w-[100px] text-center">
    {message}
    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 rotate-45 bg-white border-r-2 border-b-2 border-black ${isThinking ? 'rounded-full' : ''}`}></div>
  </div>
);

const Block = ({ id, type, action, value, onChange, isDraggable = true,onRemove }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
  type: 'block',
  item: { id, type, action, value },
  end: (item, monitor) => {
  const dropResult = monitor.getDropResult();
  if (item && !dropResult && onRemove) {
    onRemove(id);
  }
},
  collect: (monitor) => ({
    isDragging: !!monitor.isDragging(),
  }),
}), [id, type, action, value, onRemove]);

  const handleInputChange = (e, field) => {
  let newValue;
  if (action === GOTO) {
    newValue = value.map((v, i) => i === field ? parseInt(e.target.value, 10) : v);
  } else if (action === SAY_TIMER || action === THINK_TIMER) {
    newValue = { ...value, [field]: field === 'duration' ? parseInt(e.target.value, 10) : e.target.value };
  } else {
    newValue = e.target.value;
  }
  onChange(id, action, newValue);
};

  return (
    <div
    style={{maxWidth:220}}
      ref={isDraggable ? drag : null}
      className={`p-1 m-1 rounded ${isDraggable ? 'cursor-move' : ''} flex items-center ${
        type === MOTION ? 'bg-blue-500' : 'bg-purple-500'
      } text-white ${isDragging ? 'opacity-50' : 'opacity-100'}`}
    >
      <span className="mr-2" style={{ fontSize: '0.75rem' }}>{action}</span>
      {(action === MOVE_X || action === MOVE_Y || action === TURN_RIGHT || action === TURN_LEFT || action === POINT_IN_DIRECTION || action === CHANGE_SIZE_TO || action === CHANGE_SIZE_BY) && (
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          className="w-12 p-1 text-black rounded-full"
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {action === GOTO_RANDOM && (
        <span style={{ fontSize: '0.75rem' }}>Random position</span>
      )}
      {action === GOTO && (
        <>
          <input
            type="number"
            value={value[0]}
            onChange={(e) => handleInputChange(e, 0)}
            className="w-12 p-1 text-black rounded-full mr-1"
            placeholder="X"
            style={{ fontSize: '0.75rem' }}
          />
          <input
            type="number"
            value={value[1]}
            onChange={(e) => handleInputChange(e, 1)}
            className="w-12 p-1 text-black rounded-full"
            placeholder="Y"
            style={{ fontSize: '0.75rem' }}
          />
        </>
      )}
      {(action === SAY || action === THINK) && (
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          className="w-16 p-1 text-black rounded-full"
          placeholder="message"
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {(action === SAY_TIMER || action === THINK_TIMER) && (
      <>
        <input
        type="text"
        value={value.message}
        onChange={(e) => handleInputChange(e, 'message')}
        className="w-16 p-1 text-black rounded-full mr-1"
        placeholder="message"
        style={{ fontSize: '0.75rem' }}
        />
        <input
        type="number"
        value={value.duration}
        onChange={(e) => handleInputChange(e, 'duration')}
        className="w-12 p-1 text-black rounded-full"
        placeholder="Seconds"
        style={{ fontSize: '0.75rem' }}
        />
      </>
      )}
      {action === CHANGE_COLOR && (
        <input
          type="color"
          value={value}
          onChange={handleInputChange}
          className="w-6 h-6 p-0 border-0"
          style={{ fontSize: '0.75rem' }}
        />
      )}
      {action === CHANGE_BACKDROP && (
        <select
          value={value}
          onChange={handleInputChange}
          className="bg-white text-black p-1 rounded-full"
          style={{ fontSize: '0.75rem' }}
        >
          {BACKDROPS.map((backdrop, index) => (
            <option key={index} value={index}>
              {backdrop.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

const DroppableArea = ({ onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'block',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        onDrop(item);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`border-2 border-dashed p-4 min-h-[calc(80vh-100px)] max-h-[calc(80vh-100px)] overflow-y-auto ${
        isOver ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      {children}
    </div>
  );
};

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
    { id: 'sidebar-move-x', type: MOTION, action: MOVE_X, value: 10 },
    { id: 'sidebar-move-y', type: MOTION, action: MOVE_Y, value: 10 },
    { id: 'sidebar-turn-right', type: MOTION, action: TURN_RIGHT, value: 15 },
    { id: 'sidebar-turn-left', type: MOTION, action: TURN_LEFT, value: 15 },
    { id: 'sidebar-goto', type: MOTION, action: GOTO, value: [0, 0] },
    { id: 'sidebar-goto-random', type: MOTION, action: GOTO_RANDOM, value: null },
    { id: 'sidebar-point-in-direction', type: MOTION, action: POINT_IN_DIRECTION, value: 90 },
    { id: 'sidebar-point-towards-random', type: MOTION, action: POINT_TOWARDS_RANDOM, value: null },
    { id: 'sidebar-say', type: LOOKS, action: SAY, value: '' },
    { id: 'sidebar-think', type: LOOKS, action: THINK, value: '' },
    { id: 'sidebar-say-timer', type: LOOKS, action: SAY_TIMER, value: { message: '', duration: 2 } },
    { id: 'sidebar-think-timer', type: LOOKS, action: THINK_TIMER, value: { message: '', duration: 2 } },
    { id: 'sidebar-change-size-to', type: LOOKS, action: CHANGE_SIZE_TO, value: 100 },
    { id: 'sidebar-change-size-by', type: LOOKS, action: CHANGE_SIZE_BY, value: 10 },
    { id: 'sidebar-change-color', type: LOOKS, action: CHANGE_COLOR, value: '#FFAB19' },
    { id: 'sidebar-change-backdrop', type: LOOKS, action: CHANGE_BACKDROP, value: 0 },
    { id: 'sidebar-hide', type: LOOKS, action: HIDE, value: null },
    { id: 'sidebar-show', type: LOOKS, action: SHOW, value: null },
  ]);

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

  const executeAction = useCallback((block) => {
  const sprite = spriteRef.current;
  if (!sprite) return;

  return new Promise((resolve) => {
    setSpriteState((prevState) => {
      let newState = { ...prevState };

      switch (block.action) {
        case MOVE_X:
          newState.x += parseInt(block.value, 10);
          break;
        case MOVE_Y:
          newState.y -= parseInt(block.value, 10); // Ensure Y moves up/down
          break;
        case TURN_RIGHT:
          newState.rotation += parseInt(block.value, 10);
          break;
        case TURN_LEFT:
          newState.rotation -= parseInt(block.value, 10);
          break;
        case GOTO:
          newState.x = block.value[0];
          newState.y = block.value[1];  // Ensure Y is not flipped here
          break;
        case GOTO_RANDOM:
          newState.x = Math.random() * window.innerWidth;
          newState.y = Math.random() * window.innerHeight;
          break;
        case POINT_IN_DIRECTION:
          newState.rotation = parseInt(block.value, 10);
          break;
        case POINT_TOWARDS_RANDOM:
          newState.rotation = Math.floor(Math.random() * 361);
          break;
        case SAY:
        case THINK:
          setSpeechBubble({ message: block.value || (block.action === SAY ? 'Hello!' : 'Hmm...'), isThinking: block.action === THINK });
          setTimeout(() => {
            setSpeechBubble({ message: '', isThinking: false });
            resolve();
          }, 2000);
          return prevState;
        case SAY_TIMER:
        case THINK_TIMER:
          setSpeechBubble({ message: block.value.message || (block.action === SAY_TIMER ? 'Hello!' : 'Hmm...'), isThinking: block.action === THINK_TIMER });
          setTimeout(() => {
            setSpeechBubble({ message: '', isThinking: false });
            resolve();
          }, block.value.duration * 1000);
          return prevState;
          case CHANGE_SIZE_TO:
            newState.size = parseInt(block.value, 10);
            break;
          case CHANGE_SIZE_BY:
            newState.size += parseInt(block.value, 10);
            break;
        case HIDE:
          sprite.style.opacity = 0;
          break;
        case SHOW:
          sprite.style.opacity = 1;
          break;
        case CHANGE_COLOR:
          setSpriteColor(block.value);
          break;
        case CHANGE_BACKDROP:
          setBackdropIndex(parseInt(block.value, 10));
          break;
        default:
          break;
      }

      sprite.style.transform = `translate(${newState.x}px, ${newState.y}px) rotate(${newState.rotation + 90}deg) scale(${newState.size / 100})`;
      return newState;
    });
    resolve();
  });
}, []);



  useEffect(() => {
    let isCancelled = false;

    const runActions = async () => {
      if (isRunning && currentActionIndex < blocks.length) {
        await executeAction(blocks[currentActionIndex]);
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
      executeAction(history[n - 1]);
    }
  }, [history, executeAction]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
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
          <DroppableArea onDrop={handleDrop} >
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
          <div className="mt-4 flex space-x-2">
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
        <div className="w-3/6 p-4 border-l ">
          <div className="border p-4 h-[600px] relative min-h-[600px] overflow-x-auto overflow-y-auto" style={{
            backgroundColor: backdropIndex === 0 ? 'white' : undefined,
            backgroundImage: backdropIndex !== 0 ? `url(${BACKDROPS[backdropIndex].url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            <div
              ref={spriteRef}
              className="w-24 h-24 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
              style={{ transform: 'translate(0px, 0px) rotate(0deg)' }}
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