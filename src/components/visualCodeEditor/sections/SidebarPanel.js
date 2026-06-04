import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Settings2, X } from 'lucide-react';
import * as actionTypes from '../../../constants/ActionTypes';
import Block from '../block/Block';
import SpriteGraphic from '../components/SpriteGraphic';
import { CONTROLS, EVENTS, LOOKS, MOTION, OPERATORS, SOUND, SPRITE, VARIABLES } from '../../../constants/BlockTypes';
import { BackdropSwatch, MobileBottomSheet, MobileControlComposer } from '../primitives';
import { describeBlock, EDITOR_PANEL_HEIGHT, isControlContainerAction, isEventTriggerAction, isOperatorAction, isVariableReporterAction } from '../config';

const MOBILE_BLOCK_CATEGORIES = [
  { id: MOTION, label: 'Motion' },
  { id: LOOKS, label: 'Looks' },
  { id: SOUND, label: 'Sound' },
  { id: EVENTS, label: 'Events' },
  { id: CONTROLS, label: 'Control' },
  { id: OPERATORS, label: 'Operators' },
  { id: VARIABLES, label: 'Variables' },
];
const BLOCK_HINT_KEY = 'vce_mobile_block_fab_hint_dismissed';
const MOBILE_UNSUPPORTED_ACTIONS = new Set([
  actionTypes.WHEN_KEY_PRESSED,
]);
const requiresMobileComposer = (block) =>
  isControlContainerAction(block?.action)
  || isEventTriggerAction(block?.action)
  || block?.action === actionTypes.WAIT_UNTIL
  || isOperatorAction(block?.action);

const SidebarBlockList = ({
  title,
  blocks,
  sounds,
  variableNames,
  listNames,
  availableBackdrops,
  isRecordingSound,
  handleSidebarBlockChange,
  handleSoundMenuAction,
  handleBackdropMenuAction,
  handleDeleteVariableEntity,
  showToast,
}) => (
  <>
    <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">{title}</h2>
    {blocks.map((block) => (
      <Block
        key={block.id}
        id={block.id}
        type={block.type}
        action={block.action}
        value={block.value}
        onChange={handleSidebarBlockChange}
        isDraggable={true}
        availableSounds={sounds}
        availableVariables={variableNames}
        availableLists={listNames}
        availableBackdrops={availableBackdrops}
        isRecordingSound={isRecordingSound}
        onSoundMenuAction={handleSoundMenuAction}
        onBackdropMenuAction={handleBackdropMenuAction}
        onOperatorValidationMessage={showToast}
        onDeleteVariableEntity={handleDeleteVariableEntity}
      />
    ))}
  </>
);

const SidebarPanel = ({
  isMobile = false,
  activeSidebarTab,
  setActiveSidebarTab,
  selectedSprite,
  selectedBackdrop,
  sidebarBlocks,
  sounds,
  variableNames,
  listNames,
  availableBackdrops,
  isRecordingSound,
  handleSidebarBlockChange,
  handleSoundMenuAction,
  handleBackdropMenuAction,
  handleDeleteVariableEntity,
  showToast,
  openVariableModal,
  openListModal,
  openSpriteLibrary,
  sprites,
  selectedSpriteId,
  setSelectedSpriteId,
  handleRemoveSprite,
  openBackdropLibrary,
  backdropValue,
  handleSelectBackdrop,
  handleAddBlock,
  blocks = [],
  runCode,
  isRunning = false,
  handleNestedDrop,
  handleNestedBlockChange,
  handleOperatorSlotChange,
  handleOperatorSlotDrop,
  selectedBlockId = '',
  setSelectedBlockId,
  requestRemoveBlock,
  removingBlockIds = [],
  recentlyAddedBlockIds = [],
  showMobileTrigger = true,
  mobileOpenRequest = 0,
}) => {
  const [isMobileBlockPickerOpen, setIsMobileBlockPickerOpen] = useState(false);
  const [mobileBlockCategory, setMobileBlockCategory] = useState(MOTION);
  const [mobileComposerState, setMobileComposerState] = useState({
    isOpen: false,
    sourceBlock: null,
    initialBlock: null,
  });
  const [showBlockHint, setShowBlockHint] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(BLOCK_HINT_KEY) !== 'true';
  });

  const mobileCategoryBlocks = useMemo(
    () =>
      sidebarBlocks.filter(
        (block) =>
          block.type === mobileBlockCategory
          && !MOBILE_UNSUPPORTED_ACTIONS.has(block.action)
      ),
    [mobileBlockCategory, sidebarBlocks]
  );

  useEffect(() => {
    if (!isMobile || mobileOpenRequest === 0) {
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(BLOCK_HINT_KEY, 'true');
    }
    setShowBlockHint(false);
    setActiveSidebarTab('blocks');
    setIsMobileBlockPickerOpen(true);
  }, [isMobile, mobileOpenRequest, setActiveSidebarTab]);

  if (isMobile) {
    return (
      <>
        {showMobileTrigger ? (
          <div className="mobile-block-fab-shell lg:hidden">
            {showBlockHint ? <span className="mobile-fab-hint">Add block</span> : null}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem(BLOCK_HINT_KEY, 'true');
                }
                setShowBlockHint(false);
                setActiveSidebarTab('blocks');
                setIsMobileBlockPickerOpen(true);
              }}
              className="mobile-fab"
              aria-label="Open block picker"
            >
              <Plus size={24} />
            </button>
          </div>
        ) : null}
        <MobileBottomSheet
          isOpen={isMobileBlockPickerOpen}
          title="Build Sequence"
          onClose={() => setIsMobileBlockPickerOpen(false)}
          className="top-[116px] max-h-[calc(100vh-116px)]"
          overlayClassName="top-[116px]"
          overlayVisible={false}
          closeMode="back"
        >
          <>
            <div className="space-y-4 pb-24">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {blocks.length > 0 ? (
                  blocks.map((block, index) => (
                    <div
                      key={block.id}
                      className="flex flex-shrink-0 items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--surface-chip)] px-3 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="max-w-[120px] truncate text-sm font-medium text-[var(--text-primary)]">
                        {describeBlock(block)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddBlock({ id: block.sourceSidebarId }, null, { removeBlockId: block.id })}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-[var(--text-muted)]"
                        aria-label={`Remove ${describeBlock(block)}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--text-muted)]">
                    Tap blocks to build a sequence
                  </div>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {MOBILE_BLOCK_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setMobileBlockCategory(category.id)}
                    className={`mobile-filter-pill ${
                      mobileBlockCategory === category.id ? 'mobile-filter-pill-active' : ''
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
              {mobileBlockCategory === VARIABLES ? (
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={openVariableModal} className="btn-create-variable min-h-[44px] w-full">
                    Create Variable
                  </button>
                  <button type="button" onClick={openListModal} className="btn-create-list min-h-[44px] w-full">
                    Create List
                  </button>
                </div>
              ) : null}
              <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
                {mobileCategoryBlocks.map((block) => {
                  const queuedCount =
                    blocks.filter((workspaceBlock) => workspaceBlock.sourceSidebarId === block.id).length;
                  const isQueued = queuedCount > 0;

                  return (
                    <div
                      key={block.id}
                      className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1 overflow-x-auto">
                          <Block
                            id={block.id}
                            type={block.type}
                            action={block.action}
                            value={block.value}
                            onChange={handleSidebarBlockChange}
                            isDraggable={false}
                            availableSounds={sounds}
                            availableVariables={variableNames}
                            availableLists={listNames}
                            availableBackdrops={availableBackdrops}
                            isRecordingSound={isRecordingSound}
                            onSoundMenuAction={handleSoundMenuAction}
                            onBackdropMenuAction={handleBackdropMenuAction}
                            onNestedDrop={handleNestedDrop}
                            onNestedBlockChange={handleNestedBlockChange}
                            onOperatorSlotChange={handleOperatorSlotChange}
                            onOperatorSlotDrop={handleOperatorSlotDrop}
                            onOperatorValidationMessage={showToast}
                            onDeleteVariableEntity={handleDeleteVariableEntity}
                            selectedBlockId={selectedBlockId}
                            onSelect={setSelectedBlockId}
                            onRequestRemove={requestRemoveBlock}
                            removingBlockIds={removingBlockIds}
                            recentlyAddedBlockIds={recentlyAddedBlockIds}
                          />
                          {requiresMobileComposer(block) ? (
                            <p className="mt-2 text-xs text-[var(--text-muted)]">
                              Opens a builder for nested block inputs before adding.
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (requiresMobileComposer(block)) {
                              setMobileComposerState({
                                isOpen: true,
                                sourceBlock: block,
                                initialBlock: null,
                              });
                              return;
                            }

                            handleAddBlock(block);
                          }}
                          className={`mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                            isQueued
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-[var(--panel-border)] bg-white text-blue-600'
                          }`}
                          aria-label={
                            requiresMobileComposer(block)
                              ? `Build and add ${describeBlock(block)} to sequence`
                              : `Add ${describeBlock(block)} to sequence`
                          }
                        >
                          {requiresMobileComposer(block) && !isQueued ? (
                            <Settings2 size={16} />
                          ) : isQueued ? (
                            <span className="text-xs font-bold">
                              {queuedCount}
                            </span>
                          ) : (
                            <span className="text-lg leading-none">+</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {mobileCategoryBlocks.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                    No blocks available in this category yet.
                  </div>
                ) : null}
              </div>
            </div>
            <div className="-mx-4 sticky bottom-0 border-t border-[var(--panel-border)] bg-[var(--surface-modal)]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  setIsMobileBlockPickerOpen(false);
                  void runCode();
                }}
                disabled={blocks.length === 0 || isRunning}
                className={`flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-green-600 px-4 text-sm font-semibold text-white ${
                  blocks.length === 0 || isRunning ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                Run {blocks.length} block{blocks.length === 1 ? '' : 's'} in order
              </button>
            </div>
          </>
        </MobileBottomSheet>
        <MobileControlComposer
          isOpen={mobileComposerState.isOpen}
          onClose={() =>
            setMobileComposerState({
              isOpen: false,
              sourceBlock: null,
              initialBlock: null,
            })
          }
          sourceBlock={mobileComposerState.sourceBlock}
          initialBlock={mobileComposerState.initialBlock}
          sidebarBlocks={sidebarBlocks}
          sounds={sounds}
          variableNames={variableNames}
          listNames={listNames}
          availableBackdrops={availableBackdrops}
          isRecordingSound={isRecordingSound}
          handleSoundMenuAction={handleSoundMenuAction}
          handleBackdropMenuAction={handleBackdropMenuAction}
          handleDeleteVariableEntity={handleDeleteVariableEntity}
          showToast={showToast}
          onSave={(draftBlock) => {
            if (mobileComposerState.sourceBlock) {
              handleAddBlock(mobileComposerState.sourceBlock, draftBlock);
            }
            setMobileComposerState({
              isOpen: false,
              sourceBlock: null,
              initialBlock: null,
            });
          }}
        />
      </>
    );
  }

  return (
    <div className="sidebar-shell flex w-1/4 flex-col px-2 py-4">
    <div className="mb-4 overflow-x-auto pb-1">
      <div className="inline-flex min-w-max items-center gap-2 px-0.5">
        <button draggable="false" data-tab="blocks" onClick={() => setActiveSidebarTab('blocks')} className={`tab tab-button flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${activeSidebarTab === 'blocks' ? 'tab-active' : ''}`}>
          <span className="tab-icon-chip flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold">{'</>'}</span>
          Code
        </button>
        <button draggable="false" data-tab="sprite" onClick={() => setActiveSidebarTab('sprite')} className={`tab tab-button flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${activeSidebarTab === 'sprite' ? 'tab-active' : ''}`}>
          {selectedSprite ? (
            <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-orange-200 bg-white">
              <SpriteGraphic src={selectedSprite.src} markup={selectedSprite.svgMarkup} color={selectedSprite.color} width="14" height="14" className="block" />
            </span>
          ) : null}
          Sprite
        </button>
        <button draggable="false" data-tab="backdrops" onClick={() => setActiveSidebarTab('backdrops')} className={`tab tab-button flex flex-shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 text-sm font-semibold transition ${activeSidebarTab === 'backdrops' ? 'tab-active' : ''}`}>
          {selectedBackdrop ? <BackdropSwatch backdrop={selectedBackdrop} className="h-5 w-5 rounded-md border border-emerald-200" /> : null}
          Backdrops
        </button>
      </div>
    </div>
    <div className="overflow-x-auto overflow-y-auto pr-0" style={{ height: EDITOR_PANEL_HEIGHT, minHeight: EDITOR_PANEL_HEIGHT }}>
      {activeSidebarTab === 'blocks' && (
        <div className="block-palette sidebar-panel min-h-full rounded-xl border px-2 py-3 shadow-sm">
          <SidebarBlockList title="Motion" blocks={sidebarBlocks.filter((block) => block.type === MOTION)} sounds={sounds} variableNames={variableNames} listNames={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} handleSidebarBlockChange={handleSidebarBlockChange} handleSoundMenuAction={handleSoundMenuAction} handleBackdropMenuAction={handleBackdropMenuAction} handleDeleteVariableEntity={handleDeleteVariableEntity} showToast={showToast} />
          <SidebarBlockList title="Looks" blocks={sidebarBlocks.filter((block) => block.type === LOOKS)} sounds={sounds} variableNames={variableNames} listNames={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} handleSidebarBlockChange={handleSidebarBlockChange} handleSoundMenuAction={handleSoundMenuAction} handleBackdropMenuAction={handleBackdropMenuAction} handleDeleteVariableEntity={handleDeleteVariableEntity} showToast={showToast} />
          <SidebarBlockList title="Sound" blocks={sidebarBlocks.filter((block) => block.type === SOUND)} sounds={sounds} variableNames={variableNames} listNames={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} handleSidebarBlockChange={handleSidebarBlockChange} handleSoundMenuAction={handleSoundMenuAction} handleBackdropMenuAction={handleBackdropMenuAction} handleDeleteVariableEntity={handleDeleteVariableEntity} showToast={showToast} />
          <SidebarBlockList title="Events" blocks={sidebarBlocks.filter((block) => block.type === EVENTS)} sounds={sounds} variableNames={variableNames} listNames={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} handleSidebarBlockChange={handleSidebarBlockChange} handleSoundMenuAction={handleSoundMenuAction} handleBackdropMenuAction={handleBackdropMenuAction} handleDeleteVariableEntity={handleDeleteVariableEntity} showToast={showToast} />
          <SidebarBlockList title="Control" blocks={sidebarBlocks.filter((block) => block.type === CONTROLS)} sounds={sounds} variableNames={variableNames} listNames={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} handleSidebarBlockChange={handleSidebarBlockChange} handleSoundMenuAction={handleSoundMenuAction} handleBackdropMenuAction={handleBackdropMenuAction} handleDeleteVariableEntity={handleDeleteVariableEntity} showToast={showToast} />
          <SidebarBlockList title="Operators" blocks={sidebarBlocks.filter((block) => block.type === OPERATORS)} sounds={sounds} variableNames={variableNames} listNames={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} handleSidebarBlockChange={handleSidebarBlockChange} handleSoundMenuAction={handleSoundMenuAction} handleBackdropMenuAction={handleBackdropMenuAction} handleDeleteVariableEntity={handleDeleteVariableEntity} showToast={showToast} />
          <h2 className="sidebar-section-heading mb-2 mt-2 border-b pb-2 pt-2 text-lg font-bold">Variables</h2>
          <div className="mb-2 ml-1 flex flex-col gap-2">
            <button type="button" onClick={openVariableModal} className="btn-create-variable w-36 rounded-lg border-2 border-orange-500 bg-transparent px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-500 hover:text-white">Create Variable</button>
            <button type="button" onClick={openListModal} className="btn-create-list w-36 rounded-lg border-2 border-orange-500 bg-transparent px-3 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-500 hover:text-white">Create List</button>
          </div>
          {sidebarBlocks.filter((block) => block.type === VARIABLES).length === 0 && <div className="rounded bg-white px-3 py-2 text-sm text-gray-500">Create a variable or list to get started.</div>}
          {sidebarBlocks.filter((block) => block.type === VARIABLES && isVariableReporterAction(block.action)).map((block) => (
            <Block key={block.id} id={block.id} type={block.type} action={block.action} value={block.value} onChange={handleSidebarBlockChange} isDraggable={true} availableSounds={sounds} availableVariables={variableNames} availableLists={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} onSoundMenuAction={handleSoundMenuAction} onBackdropMenuAction={handleBackdropMenuAction} onOperatorValidationMessage={showToast} onDeleteVariableEntity={handleDeleteVariableEntity} />
          ))}
          {sidebarBlocks.filter((block) => block.type === VARIABLES && !isVariableReporterAction(block.action)).map((block) => (
            <Block key={block.id} id={block.id} type={block.type} action={block.action} value={block.value} onChange={handleSidebarBlockChange} isDraggable={true} availableSounds={sounds} availableVariables={variableNames} availableLists={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} onSoundMenuAction={handleSoundMenuAction} onBackdropMenuAction={handleBackdropMenuAction} onOperatorValidationMessage={showToast} onDeleteVariableEntity={handleDeleteVariableEntity} />
          ))}
        </div>
      )}
      {activeSidebarTab === 'sprite' && (
        <div className="rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-3">
            <button type="button" onClick={openSpriteLibrary} className="flex min-h-[10rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-sky-300 bg-sky-50 text-sky-700 transition hover:border-sky-400 hover:bg-sky-100">
              <span className="text-4xl font-light leading-none">+</span>
              <span className="mt-2 text-sm font-semibold">Add Sprite</span>
            </button>
            {sprites.map((sprite) => (
              <div key={sprite.id} onClick={() => setSelectedSpriteId(sprite.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedSpriteId(sprite.id); } }} role="button" tabIndex={0} className={`rounded border bg-white p-2 text-sm font-semibold ${selectedSpriteId === sprite.id ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200'}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span>{sprite.name}</span>
                  <button type="button" onClick={(event) => { event.stopPropagation(); handleRemoveSprite(sprite.id); }} className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200">Remove</button>
                </div>
                <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded border bg-gray-50">
                  <div className="h-28 w-28">
                    <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} width="112" height="112" className="block" />
                  </div>
                </div>
                <div className="mt-2 text-left text-xs text-gray-500">{(sprite.blocks || []).length} blocks in workspace</div>
              </div>
            ))}
          </div>
          {sidebarBlocks.filter((block) => block.type === SPRITE).map((block) => (
            <Block key={block.id} id={block.id} type={block.type} action={block.action} value={block.value} onChange={handleSidebarBlockChange} isDraggable={true} availableSounds={sounds} availableVariables={variableNames} availableLists={listNames} availableBackdrops={availableBackdrops} isRecordingSound={isRecordingSound} onSoundMenuAction={handleSoundMenuAction} onBackdropMenuAction={handleBackdropMenuAction} onDeleteVariableEntity={handleDeleteVariableEntity} />
          ))}
        </div>
      )}
      {activeSidebarTab === 'backdrops' && (
        <div className="rounded-xl border border-gray-200 bg-white/70 p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-3">
            <button type="button" onClick={openBackdropLibrary} className="flex min-h-[10rem] flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-100">
              <span className="text-4xl font-light leading-none">+</span>
              <span className="mt-2 text-sm font-semibold">Add Backdrop</span>
            </button>
            {availableBackdrops.map((backdrop) => {
              const isActiveBackdrop = String(backdrop.id) === String(backdropValue);
              return (
                <button key={backdrop.id} type="button" onClick={() => handleSelectBackdrop(backdrop.id)} className={`overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${isActiveBackdrop ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200'}`}>
                  <div className="flex h-28 items-center justify-center border-b bg-gray-50" style={{ backgroundImage: backdrop.url ? `url(${backdrop.url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {!backdrop.url && <span className="text-sm font-semibold text-gray-500">White Space</span>}
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{backdrop.name}</div>
                      <div className="text-xs text-gray-500">{isActiveBackdrop ? 'Current initial backdrop' : 'Click to set as initial'}</div>
                    </div>
                    {isActiveBackdrop && <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default SidebarPanel;
