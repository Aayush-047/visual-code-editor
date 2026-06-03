import React, { useEffect, useState } from 'react';
import { ChevronDown, Link2, Maximize2, Minimize2, Plus } from 'lucide-react';
import Tooltip from '../components/Tooltip';
import SpriteGraphic from '../components/SpriteGraphic';
import { BackdropSwatch, MobileBottomSheet, PreviewControls, StagePreview } from '../primitives';

const PreviewPanel = ({
  isMobile = false,
  isPreviewExpanded,
  setIsPreviewExpanded,
  previewRef,
  spriteRef,
  sprites,
  activeSpriteId,
  selectedSprite,
  selectedBackdrop,
  availableBackdrops,
  backdropValue,
  setSelectedSpriteId,
  handleSelectBackdrop,
  handleShareProject,
  openSpriteLibrary,
  openBackdropLibrary,
  onOpenBlockPicker,
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
}) => {
  const [mobilePicker, setMobilePicker] = useState(null);
  const [mobileSpriteScale, setMobileSpriteScale] = useState(() => {
    if (typeof window === 'undefined') {
      return 0.5;
    }

    return window.innerWidth >= 768 && window.innerWidth < 1024 ? 0.75 : 0.5;
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const updateMobileSpriteScale = () => {
      setMobileSpriteScale(window.innerWidth >= 768 && window.innerWidth < 1024 ? 0.75 : 0.5);
    };

    updateMobileSpriteScale();
    window.addEventListener('resize', updateMobileSpriteScale);

    return () => {
      window.removeEventListener('resize', updateMobileSpriteScale);
    };
  }, []);

  return (
  <>
    {!isPreviewExpanded && (
      <div className={`${isMobile ? 'flex min-h-[calc(100vh-72px)] flex-1 flex-col w-full border-b border-slate-200/80 px-4 pb-4 pt-3' : 'w-3/6 border-l border-slate-200/80 p-4'}`}>
        <div className={`mb-4 flex items-center ${isMobile ? 'justify-between' : 'justify-between gap-2'}`}>
          {!isMobile ? <div className="w-24" /> : null}
          {isMobile ? (
            <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center justify-start gap-2">
              {selectedSprite ? (
                <button
                  type="button"
                  onClick={() => setMobilePicker('sprite')}
                  className="mobile-preview-sprite-btn flex h-10 items-center gap-1.5 rounded-full border border-[var(--border-preview)] bg-white pl-3 pr-2 text-left shadow-sm"
                  aria-label={`Choose active sprite. Current: ${selectedSprite.name}`}
                  title={selectedSprite.name}
                >
                  <span className="flex h-5 w-5 items-center justify-center overflow-hidden">
                    <SpriteGraphic
                      src={selectedSprite.src}
                      markup={selectedSprite.svgMarkup}
                      color={selectedSprite.color}
                      width="14"
                      height="14"
                      className="block"
                    />
                  </span>
                  <span className="tablet-preview-name truncate text-sm font-semibold text-orange-900">
                    {selectedSprite.name}
                  </span>
                  <ChevronDown size={14} className="text-[var(--text-muted)]" />
                </button>
              ) : null}
              {selectedBackdrop ? (
                <button
                  type="button"
                  onClick={() => setMobilePicker('backdrop')}
                  className="mobile-preview-backdrop-btn flex h-10 items-center gap-1.5 rounded-full border border-[var(--border-preview)] bg-white pl-3 pr-2 text-left shadow-sm"
                  aria-label={`Choose active backdrop. Current: ${selectedBackdrop.name}`}
                  title={selectedBackdrop.name}
                >
                  <BackdropSwatch backdrop={selectedBackdrop} className="h-5 w-5 rounded-md border border-emerald-200" />
                  <span className="tablet-preview-name truncate text-sm font-semibold text-emerald-900">
                    {selectedBackdrop.name}
                  </span>
                  <ChevronDown size={14} className="text-[var(--text-muted)]" />
                </button>
              ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void handleShareProject?.();
                  }}
                  className="mobile-preview-action-btn flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-preview)] bg-white text-sky-600 shadow-sm"
                  aria-label="Share project"
                  title="Share"
                >
                  <Link2 size={18} />
                  <span className="tablet-action-label text-sm font-semibold">Share</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenBlockPicker}
                  className="mobile-preview-action-btn mobile-preview-add-btn flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-preview)] bg-white text-blue-600 shadow-sm"
                  aria-label="Open block picker"
                  title="Add block"
                >
                  <Plus size={18} />
                  <span className="tablet-action-label text-sm font-semibold">Add Blocks</span>
                </button>
              </div>
            </div>
          ) : (
            <h1 className="text-center text-xl font-bold">Preview</h1>
          )}
          {!isMobile ? (
            <Tooltip content="Fullscreen preview">
              <button type="button" onClick={() => setIsPreviewExpanded(true)} className="tooltip-trigger-button rounded border border-[var(--border-preview)] bg-white p-2 text-gray-800" aria-label="Full screen preview" title="Fullscreen preview">
                <Maximize2 size={16} />
              </button>
            </Tooltip>
          ) : null}
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
          isMobile={isMobile}
          mobileSpriteScale={mobileSpriteScale}
          panelHeight={isMobile ? '100%' : undefined}
          className={`preview-surface relative overflow-x-auto overflow-y-auto rounded-xl border border-slate-200 p-4 ${isMobile ? 'mobile-stage-strip flex-1 min-h-0' : ''}`}
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
    <MobileBottomSheet
      isOpen={isMobile && mobilePicker === 'sprite'}
      title="Choose Sprite"
      onClose={() => setMobilePicker(null)}
      className="top-[124px] max-h-[calc(100vh-124px)]"
      overlayClassName="top-[124px]"
      overlayVisible={false}
    >
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            setMobilePicker(null);
            openSpriteLibrary?.();
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-dashed border-sky-300 bg-sky-50 px-4 py-3 text-left text-sky-800"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-lg font-semibold text-sky-600">
            +
          </span>
          <span className="font-semibold">Add new from library</span>
        </button>
        {sprites.map((sprite) => (
          <button
            key={sprite.id}
            type="button"
            onClick={() => {
              setSelectedSpriteId(sprite.id);
              setMobilePicker(null);
            }}
            className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
              activeSpriteId === sprite.id
                ? 'border-orange-400 bg-orange-50 text-orange-900'
                : 'border-[var(--panel-border)] bg-[var(--surface-modal-soft)] text-[var(--text-primary)]'
            }`}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} width="20" height="20" className="block" />
            </div>
            <span className="truncate font-semibold">{sprite.name}</span>
          </button>
        ))}
      </div>
    </MobileBottomSheet>
    <MobileBottomSheet
      isOpen={isMobile && mobilePicker === 'backdrop'}
      title="Choose Backdrop"
      onClose={() => setMobilePicker(null)}
      className="top-[124px] max-h-[calc(100vh-124px)]"
      overlayClassName="top-[124px]"
      overlayVisible={false}
    >
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            setMobilePicker(null);
            openBackdropLibrary?.();
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-left text-emerald-800"
        >
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white text-lg font-semibold text-emerald-600">
            +
          </span>
          <span className="font-semibold">Add new from library</span>
        </button>
        {availableBackdrops.map((backdrop) => (
          <button
            key={backdrop.id}
            type="button"
            onClick={() => {
              handleSelectBackdrop(backdrop.id);
              setMobilePicker(null);
            }}
            className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
              String(backdrop.id) === String(backdropValue)
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                : 'border-[var(--panel-border)] bg-[var(--surface-modal-soft)] text-[var(--text-primary)]'
            }`}
          >
            <BackdropSwatch backdrop={backdrop} className="h-8 w-8 rounded-lg" />
            <span className="truncate font-semibold">{backdrop.name}</span>
          </button>
        ))}
      </div>
    </MobileBottomSheet>
  </>
  );
};

export default PreviewPanel;
