import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Play, Rewind } from 'lucide-react';
import CatSprite from './CatSprite';
import Block from './Block';
import DroppableArea from './DroppableArea';
import SpeechBubble from './SpeechBubble';
import { EVENTS, MOTION, LOOKS, SOUND, SPRITE, OPERATORS } from '../constants/BlockTypes';
import { BACKDROPS } from '../data/BackDrops';
import useExecuteAction from '../hooks/useExecuteAction';
import * as actionTypes from '../constants/ActionTypes';

const DEFAULT_SOUNDS = [
  { id: 'meow', name: 'Meow', type: 'builtin', url: '/sounds/Meow.mp3' },
];

const DEFAULT_SPRITES = [
  { id: 'cat', name: 'Cat' },
];

const RECORD_SOUND_OPTION = '__record_sound__';
const VisualCodeEditor = () => {
  const [blocks, setBlocks] = useState([]);
  const [history, setHistory] = useState([]);
  const spriteRef = useRef(null);
  const previewRef = useRef(null);
  const spriteDragRef = useRef({ isDragging: false, offsetX: 0, offsetY: 0 });
  const backdropFileInputRef = useRef(null);
  const pendingBackdropChangeRef = useRef(null);
  const uploadedBackdropsRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const activeAudiosRef = useRef([]);
  const [spriteState, setSpriteState] = useState({ x: 0, y: 0, rotation: -90, size: 100 });
  const [isRunning, setIsRunning] = useState(false);
  const [isRecordingSound, setIsRecordingSound] = useState(false);
  const [spriteColor, setSpriteColor] = useState('#FFAB19');
  const [backdropValue, setBackdropValue] = useState('0');
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [speechBubble, setSpeechBubble] = useState({ message: '', isThinking: false });
  const [broadcastMessage, setBroadcastMessage] = useState({ message: '', color: '#111111' });
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS);
  const [soundVolume, setSoundVolume] = useState(100);
  const [uploadedBackdrops, setUploadedBackdrops] = useState([]);
  const [recordingModalState, setRecordingModalState] = useState('closed');
  const [pendingRecordedSound, setPendingRecordedSound] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('blocks');
  const [selectedSpriteId, setSelectedSpriteId] = useState('cat');
  const [sidebarBlocks, setSidebarBlocks] = useState([
    { id: 'sidebar-move-x', type: MOTION, action: actionTypes.MOVE_X, value: 10 },
    { id: 'sidebar-move-y', type: MOTION, action: actionTypes.MOVE_Y, value: 10 },
    { id: 'sidebar-turn-right', type: MOTION, action: actionTypes.TURN_RIGHT, value: 15 },
    { id: 'sidebar-turn-left', type: MOTION, action: actionTypes.TURN_LEFT, value: 15 },
    { id: 'sidebar-goto', type: MOTION, action: actionTypes.GOTO, value: [0, 0] },
    { id: 'sidebar-goto-random', type: MOTION, action: actionTypes.GOTO_RANDOM, value: null },
    { id: 'sidebar-point-in-direction', type: MOTION, action: actionTypes.POINT_IN_DIRECTION, value: 90 },
    { id: 'sidebar-point-towards-random', type: MOTION, action: actionTypes.POINT_TOWARDS_RANDOM, value: null },
    { id: 'sidebar-say', type: LOOKS, action: actionTypes.SAY, value: 'Hello!' },
    { id: 'sidebar-think', type: LOOKS, action: actionTypes.THINK, value: 'Hmm...' },
    { id: 'sidebar-say-timer', type: LOOKS, action: actionTypes.SAY_TIMER, value: { message: 'Hello!', duration: 2 } },
    { id: 'sidebar-think-timer', type: LOOKS, action: actionTypes.THINK_TIMER, value: { message: 'Hmm...', duration: 2 } },
    { id: 'sidebar-change-size-to', type: LOOKS, action: actionTypes.CHANGE_SIZE_TO, value: 100 },
    { id: 'sidebar-change-size-by', type: LOOKS, action: actionTypes.CHANGE_SIZE_BY, value: 10 },
    { id: 'sidebar-change-color', type: LOOKS, action: actionTypes.CHANGE_COLOR, value: '#FFAB19' },
    { id: 'sidebar-change-backdrop', type: LOOKS, action: actionTypes.CHANGE_BACKDROP, value: 0 },
    { id: 'sidebar-hide', type: LOOKS, action: actionTypes.HIDE, value: null },
    { id: 'sidebar-show', type: LOOKS, action: actionTypes.SHOW, value: null },
    { id: 'sidebar-play-sound', type: SOUND, action: actionTypes.PLAY_SOUND, value: 'meow' },
    { id: 'sidebar-set-volume', type: SOUND, action: actionTypes.SET_VOLUME, value: 100 },
    { id: 'sidebar-change-volume-by', type: SOUND, action: actionTypes.CHANGE_VOLUME_BY, value: 10 },
    { id: 'sidebar-clear-all-sounds', type: SOUND, action: actionTypes.CLEAR_ALL_SOUNDS, value: null },
    { id: 'sidebar-when-key-pressed', type: EVENTS, action: actionTypes.WHEN_KEY_PRESSED, value: 'Space' },
    { id: 'sidebar-when-sprite-clicked', type: EVENTS, action: actionTypes.WHEN_SPRITE_CLICKED, value: null },
    { id: 'sidebar-when-backdrop-switches-to', type: EVENTS, action: actionTypes.WHEN_BACKDROP_SWITCHES_TO, value: 0 },
    { id: 'sidebar-when-loudness-greater-than', type: EVENTS, action: actionTypes.WHEN_LOUDNESS_GREATER_THAN, value: 10 },
    { id: 'sidebar-broadcast-message-for', type: EVENTS, action: actionTypes.BROADCAST_MESSAGE_FOR, value: { message: 'Hello!', duration: 2, color: '#111111' } },
  ]);

  const executeAction = useExecuteAction(spriteRef);
  const availableBackdrops = [
    ...BACKDROPS.map((backdrop, index) => ({ ...backdrop, id: String(index) })),
    ...uploadedBackdrops,
  ];
  const selectedBackdrop = availableBackdrops.find(({ id }) => id === String(backdropValue)) || availableBackdrops[0];

  const handleSidebarBlockChange = useCallback((id, action, value) => {
    setSidebarBlocks(prevBlocks => 
      prevBlocks.map(block => 
        block.id === id ? { ...block, value } : block
      )
    );
  }, []);

  const handleDrop = useCallback((item) => {
    if (item.isWorkspaceBlock) {
      return;
    }

    const newBlock = { ...item, id: `${Date.now()}-${Math.random()}` };
    setBlocks((prevBlocks) => [...prevBlocks, newBlock]);
    setHistory((prevHistory) => [...prevHistory, newBlock]);
  }, []);

  const moveBlock = useCallback((fromIndex, toIndex) => {
    setBlocks((prevBlocks) => {
      const nextBlocks = [...prevBlocks];
      const [movedBlock] = nextBlocks.splice(fromIndex, 1);

      if (!movedBlock) {
        return prevBlocks;
      }

      nextBlocks.splice(toIndex, 0, movedBlock);
      return nextBlocks;
    });
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

  const getPointerSpritePosition = useCallback((event) => {
    const preview = previewRef.current;
    if (!preview) return null;

    const previewRect = preview.getBoundingClientRect();

    return {
      x: event.clientX - previewRect.left - (previewRect.width / 2) - spriteDragRef.current.offsetX,
      y: event.clientY - previewRect.top - (previewRect.height / 2) - spriteDragRef.current.offsetY,
    };
  }, []);

  const handleSpritePointerDown = useCallback((event) => {
    if (isRunning || event.button > 0) return;

    const preview = previewRef.current;
    if (!preview) return;

    const previewRect = preview.getBoundingClientRect();
    spriteDragRef.current = {
      isDragging: true,
      offsetX: event.clientX - previewRect.left - (previewRect.width / 2) - spriteState.x,
      offsetY: event.clientY - previewRect.top - (previewRect.height / 2) - spriteState.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }, [isRunning, spriteState.x, spriteState.y]);

  const handleSpritePointerMove = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    const nextPosition = getPointerSpritePosition(event);
    if (!nextPosition) return;

    setSpriteState((prevState) => ({
      ...prevState,
      x: nextPosition.x,
      y: nextPosition.y,
    }));
  }, [getPointerSpritePosition]);

  const handleSpritePointerUp = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    spriteDragRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const runActions = async () => {
      if (isRunning && currentActionIndex < blocks.length) {
        await executeAction(blocks[currentActionIndex], sounds, soundVolume, activeAudiosRef, setSpriteState, setSpeechBubble, setSpriteColor, setBackdropValue, setSoundVolume, setBroadcastMessage);
        if (!isCancelled) {
          setCurrentActionIndex((prevIndex) => prevIndex + 1);
        }
      } else if (currentActionIndex >= blocks.length) {
        setIsRunning(false);
        setCurrentActionIndex(0);
        setSpeechBubble({ message: '', isThinking: false });
        setBroadcastMessage({ message: '', color: '#111111' });
      }
    };

    runActions();

    return () => {
      isCancelled = true;
    };
  }, [isRunning, currentActionIndex, blocks, executeAction, sounds, soundVolume]);

  const runCode = useCallback(() => {
    if (isRunning) return;
    setCurrentActionIndex(0);
    setSpeechBubble({ message: '', isThinking: false });
    setBroadcastMessage({ message: '', color: '#111111' });
    setIsRunning(true);
  }, [isRunning]);

  const replayNthAction = useCallback((n) => {
    if (n > 0 && n <= history.length) {
      executeAction(history[n - 1], sounds, soundVolume, activeAudiosRef, setSpriteState, setSpeechBubble, setSpriteColor, setBackdropValue, setSoundVolume, setBroadcastMessage);
    }
  }, [history, executeAction, sounds, soundVolume]);

  const handleBackdropMenuAction = useCallback((id, action, onChange) => {
    pendingBackdropChangeRef.current = { id, action, onChange };
    backdropFileInputRef.current?.click();
  }, []);

  const handleBackdropUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      window.alert('Please upload an image file.');
      return;
    }

    const uploadedBackdrop = {
      id: `uploaded-backdrop-${Date.now()}`,
      name: file.name || 'Uploaded image',
      type: 'uploaded',
      url: URL.createObjectURL(file),
    };
    const pendingChange = pendingBackdropChangeRef.current;

    setUploadedBackdrops((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);

    if (pendingChange) {
      pendingChange.onChange(pendingChange.id, pendingChange.action, uploadedBackdrop.id);
      pendingBackdropChangeRef.current = null;
    }
  }, []);

  useEffect(() => {
    uploadedBackdropsRef.current = uploadedBackdrops;
  }, [uploadedBackdrops]);

  useEffect(() => {
    return () => {
      uploadedBackdropsRef.current.forEach((backdrop) => {
        if (backdrop.type === 'uploaded') {
          URL.revokeObjectURL(backdrop.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    const hasUnsavedChanges = blocks.length > 0 || uploadedBackdrops.length > 0 || sounds.some(({ type }) => type === 'recorded');

    if (!hasUnsavedChanges) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [blocks.length, uploadedBackdrops.length, sounds]);

  const startSoundRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      window.alert('Sound recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingStreamRef.current = stream;
      recordedChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPendingRecordedSound({ blob, url });

        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        recordedChunksRef.current = [];
        setIsRecordingSound(false);
        setRecordingModalState('review');
      };

      recorder.start();
      setIsRecordingSound(true);
      setRecordingModalState('recording');
    } catch (error) {
      window.alert('Microphone access is required to record a sound.');
      setRecordingModalState('closed');
    }
  }, []);

  const stopSoundRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleSoundMenuAction = useCallback((menuAction) => {
    if (menuAction === RECORD_SOUND_OPTION) {
      setRecordingModalState('confirm');
    }
  }, []);

  const closeRecordingModal = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
    }

    if (pendingRecordedSound?.url) {
      URL.revokeObjectURL(pendingRecordedSound.url);
    }

    mediaRecorderRef.current = null;
    recordedChunksRef.current = [];
    setPendingRecordedSound(null);
    setIsRecordingSound(false);
    setRecordingModalState('closed');
  }, [pendingRecordedSound]);

  const saveRecordedSound = useCallback(() => {
    if (!pendingRecordedSound) return;

    setSounds((prevSounds) => {
      const soundCount = prevSounds.filter(({ type }) => type === 'recorded').length + 1;
      return [
        ...prevSounds,
        {
          id: `recording-${Date.now()}`,
          name: `Recording ${soundCount}`,
          type: 'recorded',
          url: pendingRecordedSound.url,
        },
      ];
    });

    setPendingRecordedSound(null);
    setRecordingModalState('closed');
  }, [pendingRecordedSound]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveSidebarTab('blocks')}
              className={`px-3 py-2 rounded text-sm font-semibold ${
                activeSidebarTab === 'blocks' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Code
            </button>
            <button
              onClick={() => setActiveSidebarTab('sprite')}
              className={`px-3 py-2 rounded text-sm font-semibold ${
                activeSidebarTab === 'sprite' ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              Sprite
            </button>
          </div>

          {activeSidebarTab === 'blocks' && (
            <>
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
                  availableSounds={sounds}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
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
                  availableSounds={sounds}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Sound</h2>
              {sidebarBlocks.filter(block => block.type === SOUND).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Events</h2>
              {sidebarBlocks.filter(block => block.type === EVENTS).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                />
              ))}
              <h2 className="text-lg font-bold mb-2 mt-4">Operators</h2>
              {sidebarBlocks.filter(block => block.type === OPERATORS).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                />
              ))}
            </>
          )}

          {activeSidebarTab === 'sprite' && (
            <>
              <div className="grid grid-cols-1 gap-3 mb-4">
                {DEFAULT_SPRITES.map((sprite) => (
                  <button
                    key={sprite.id}
                    type="button"
                    onClick={() => setSelectedSpriteId(sprite.id)}
                    className={`bg-white border p-2 rounded text-sm font-semibold ${
                      selectedSpriteId === sprite.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="w-full h-28 mb-2 bg-gray-50 border rounded flex items-center justify-center overflow-hidden">
                      <div className="w-28 h-28">
                        <CatSprite color={spriteColor} />
                      </div>
                    </div>
                    {sprite.name}
                  </button>
                ))}
              </div>
              {sidebarBlocks.filter(block => block.type === SPRITE).map((block) => (
                <Block
                  key={block.id}
                  id={block.id}
                  type={block.type}
                  action={block.action}
                  value={block.value}
                  onChange={handleSidebarBlockChange}
                  isDraggable={true}
                  availableSounds={sounds}
                  availableBackdrops={availableBackdrops}
                  isRecordingSound={isRecordingSound}
                  onSoundMenuAction={handleSoundMenuAction}
                  onBackdropMenuAction={handleBackdropMenuAction}
                />
              ))}
            </>
          )}
        </div>

        {/* Droppable Area */}
        <div className="w-3/6 p-4 h-[100%]">
        <h1 className="text-xl font-bold mb-4 text-center">Workspace</h1>
        <p className="text-center mb-2 font-semibold">
          Drag blocks into the center area and press "Run Code" to run your code.
        </p>
          <DroppableArea onDrop={handleDrop}>
            {blocks.map((block, index) => (
              <Block
                key={block.id}
                id={block.id}
                index={index}
                type={block.type}
                action={block.action}
                value={block.value}
                onChange={handleBlockChange}
                onRemove={handleRemoveBlock}
                moveBlock={moveBlock}
                isWorkspaceBlock={true}
                isDraggable={true}
                availableSounds={sounds}
                availableBackdrops={availableBackdrops}
                isRecordingSound={isRecordingSound}
                onSoundMenuAction={handleSoundMenuAction}
                onBackdropMenuAction={handleBackdropMenuAction}
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
          <div ref={previewRef} className="border p-4 h-[600px] relative min-h-[600px] overflow-x-auto overflow-y-auto" style={{
            backgroundColor: selectedBackdrop?.url ? undefined : 'white',
            backgroundImage: selectedBackdrop?.url ? `url(${selectedBackdrop.url})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}>
            {broadcastMessage.message && (
              <div
                className="absolute left-1/2 top-8 -translate-x-1/2 z-20 w-72 max-w-[80%] text-2xl font-bold text-center px-4 py-2 bg-white/80 rounded shadow whitespace-normal break-words"
                style={{ color: broadcastMessage.color }}
              >
                {broadcastMessage.message}
              </div>
            )}
            <div
              ref={spriteRef}
              className="w-24 h-24 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 cursor-grab active:cursor-grabbing select-none"
              onPointerDown={handleSpritePointerDown}
              onPointerMove={handleSpritePointerMove}
              onPointerUp={handleSpritePointerUp}
              onPointerCancel={handleSpritePointerUp}
              style={{
                touchAction: 'none',
                transform: `translate(${spriteState.x}px, ${spriteState.y}px) rotate(${spriteState.rotation + 90}deg) scale(${spriteState.size / 100})`,
              }}
            >
              {speechBubble.message && (
                <SpeechBubble message={speechBubble.message} isThinking={speechBubble.isThinking} />
              )}
              <CatSprite color={spriteColor} />
            </div>
          </div>
        </div>
      </div>
      <input
        ref={backdropFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleBackdropUpload}
        className="hidden"
      />
      {recordingModalState !== 'closed' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-[360px] max-w-[90vw]">
            <h2 className="text-lg font-bold mb-2">Record Sound</h2>
            {recordingModalState === 'confirm' && (
              <>
                <p className="text-sm text-gray-600 mb-4">Start recording a new sound clip?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeRecordingModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => void startSoundRecording()}
                    className="px-4 py-2 rounded bg-pink-500 text-white"
                  >
                    Start Record
                  </button>
                </div>
              </>
            )}
            {recordingModalState === 'recording' && (
              <>
                <p className="text-sm text-gray-600 mb-4">Recording in progress. Stop when you are done.</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeRecordingModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={stopSoundRecording}
                    className="px-4 py-2 rounded bg-red-500 text-white"
                  >
                    Stop Recording
                  </button>
                </div>
              </>
            )}
            {recordingModalState === 'review' && (
              <>
                <p className="text-sm text-gray-600 mb-4">Recording captured. Save it to the sound list?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={closeRecordingModal}
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRecordedSound}
                    className="px-4 py-2 rounded bg-pink-500 text-white"
                  >
                    Save
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DndProvider>
  );
};

export default VisualCodeEditor;
