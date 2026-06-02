import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import { PreviewControls, StagePreview } from '../primitives';

const PreviewPanel = ({
  isPreviewExpanded,
  setIsPreviewExpanded,
  previewRef,
  spriteRef,
  sprites,
  activeSpriteId,
  selectedBackdrop,
  handleSpritePointerDown,
  handleSpritePointerMove,
  handleSpritePointerUp,
  handleSpriteClick,
  isRunning,
  replayableBlocks,
  selectedReplayBlockId,
  setSelectedReplayBlockId,
  runCode,
  replaySelectedBlock,
  stopCurrentSprite,
  stopAllCode,
  hasDismissedRunNudge,
}) => (
  <>
    {!isPreviewExpanded && (
      <div className="w-3/6 border-l border-slate-200/80 p-4">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="w-24" />
          <h1 className="text-center text-xl font-bold">Preview</h1>
          <Tooltip content="Fullscreen preview">
            <button type="button" onClick={() => setIsPreviewExpanded(true)} className="tooltip-trigger-button rounded border border-[var(--border-preview)] bg-white p-2 text-gray-800" aria-label="Full screen preview" title="Fullscreen preview">
              <Maximize2 size={16} />
            </button>
          </Tooltip>
        </div>
        <StagePreview
          previewRef={previewRef}
          spriteRef={spriteRef}
          sprites={sprites}
          selectedSpriteId={activeSpriteId}
          selectedBackdrop={selectedBackdrop}
          onSpritePointerDown={handleSpritePointerDown}
          onSpritePointerMove={handleSpritePointerMove}
          onSpritePointerUp={handleSpritePointerUp}
          onSpriteClick={handleSpriteClick}
          className="preview-surface relative overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 p-4"
        />
        <PreviewControls
          isRunning={isRunning}
          replayableBlocks={replayableBlocks}
          selectedReplayBlockId={selectedReplayBlockId}
          setSelectedReplayBlockId={setSelectedReplayBlockId}
          runCode={runCode}
          replaySelectedBlock={replaySelectedBlock}
          stopCurrentSprite={stopCurrentSprite}
          stopAllCode={stopAllCode}
          shouldPulseRun={!hasDismissedRunNudge}
        />
      </div>
    )}
    {isPreviewExpanded && (
      <div className="fixed bottom-4 left-4 right-4 top-20 z-40 flex flex-col rounded-2xl bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b px-5">
          <h1 className="text-lg font-bold">Preview</h1>
          <button type="button" onClick={() => setIsPreviewExpanded(false)} className="rounded bg-gray-900 p-2 text-white" aria-label="Small screen preview" title="Small screen">
            <Minimize2 size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 p-5">
          <StagePreview
            previewRef={previewRef}
            spriteRef={spriteRef}
            sprites={sprites}
            selectedSpriteId={activeSpriteId}
            selectedBackdrop={selectedBackdrop}
            onSpritePointerDown={handleSpritePointerDown}
            onSpritePointerMove={handleSpritePointerMove}
            onSpritePointerUp={handleSpritePointerUp}
            onSpriteClick={handleSpriteClick}
            panelHeight="100%"
            className="preview-surface relative overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 p-4"
          />
        </div>
        <div className="flex-shrink-0 border-t px-5 py-4">
          <PreviewControls
            isRunning={isRunning}
            replayableBlocks={replayableBlocks}
            selectedReplayBlockId={selectedReplayBlockId}
            setSelectedReplayBlockId={setSelectedReplayBlockId}
            runCode={runCode}
            replaySelectedBlock={replaySelectedBlock}
            stopCurrentSprite={stopCurrentSprite}
            stopAllCode={stopAllCode}
            compact
            shouldPulseRun={!hasDismissedRunNudge}
          />
        </div>
      </div>
    )}
  </>
);

export default PreviewPanel;
