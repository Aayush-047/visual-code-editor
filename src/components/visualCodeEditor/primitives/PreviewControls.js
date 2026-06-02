import React, { useEffect, useState } from 'react';
import { Loader2, Play, Rewind } from 'lucide-react';
import { describeBlock } from '../config';

const PreviewControls = ({
  isRunning,
  replayableBlocks,
  selectedReplayBlockId,
  setSelectedReplayBlockId,
  runCode,
  replaySelectedBlock,
  stopCurrentSprite,
  stopAllCode,
  compact = false,
  shouldPulseRun = false,
}) => {
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);
  const [pendingReplayBlockId, setPendingReplayBlockId] = useState(selectedReplayBlockId);

  useEffect(() => {
    if (replayableBlocks.length === 0 || isRunning) {
      setIsReplayModalOpen(false);
    }
  }, [isRunning, replayableBlocks.length]);

  useEffect(() => {
    if (!isReplayModalOpen) return undefined;
    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsReplayModalOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isReplayModalOpen]);

  useEffect(() => {
    setPendingReplayBlockId(selectedReplayBlockId || replayableBlocks[0]?.id || '');
  }, [replayableBlocks, selectedReplayBlockId]);

  return (
    <>
      <div className={`bottom-bar ${compact ? '' : 'mt-4 justify-start'} max-[479px]:justify-start`}>
        <button
          type="button"
          onClick={runCode}
          disabled={isRunning}
          className={`btn-run-code flex items-center rounded-xl bg-green-500 text-white ${isRunning ? 'cursor-not-allowed opacity-50' : ''} ${shouldPulseRun ? 'run-pulse' : ''}`}
        >
          {isRunning ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Play size={16} className="mr-2" />}
          Run Code
        </button>
        <button
          type="button"
          onClick={() => setIsReplayModalOpen(true)}
          disabled={replayableBlocks.length === 0 || isRunning}
          className={`flex items-center rounded bg-blue-500 px-3 py-2 text-white ${replayableBlocks.length === 0 || isRunning ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Rewind size={16} className="mr-1" /> Replay
        </button>
        <button
          type="button"
          onClick={stopCurrentSprite}
          disabled={!isRunning}
          className={`preview-stop-current rounded px-3 py-2 text-white ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Stop Sprite
        </button>
        <button
          type="button"
          onClick={stopAllCode}
          disabled={!isRunning}
          className={`preview-stop-all rounded px-3 py-2 text-white ${!isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Stop All
        </button>
      </div>
      {isReplayModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-3">
              <h2 className="text-base font-bold text-slate-900">Replay Block</h2>
              <p className="text-sm text-slate-500">Choose which block to replay.</p>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {replayableBlocks.map((block, blockIndex) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setPendingReplayBlockId(block.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm transition ${
                    pendingReplayBlockId === block.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{describeBlock(block)}</span>
                  <span className="ml-3 text-xs font-semibold text-slate-400">{blockIndex + 1}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setIsReplayModalOpen(false)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const blockToReplay =
                    replayableBlocks.find((block) => block.id === pendingReplayBlockId) ||
                    replayableBlocks[0];
                  setSelectedReplayBlockId(blockToReplay?.id || '');
                  setIsReplayModalOpen(false);
                  void replaySelectedBlock(blockToReplay);
                }}
                disabled={!pendingReplayBlockId}
                className={`rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white ${!pendingReplayBlockId ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PreviewControls;
