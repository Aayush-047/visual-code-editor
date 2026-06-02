import React from 'react';
import Block from '../block/Block';
import SpriteGraphic from '../components/SpriteGraphic';
import { CONTROLS, EVENTS, LOOKS, MOTION, OPERATORS, SOUND, SPRITE, VARIABLES } from '../../../constants/BlockTypes';
import { BackdropSwatch } from '../primitives';
import { EDITOR_PANEL_HEIGHT, isVariableReporterAction } from '../config';

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
}) => (
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

export default SidebarPanel;
