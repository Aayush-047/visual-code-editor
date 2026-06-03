import React, { useState } from 'react';
import { GripVertical, X } from 'lucide-react';
import Block from '../block/Block';
import DroppableArea from '../components/DroppableArea';
import SpritePaintEditor from '../components/SpritePaintEditor';
import { describeBlock } from '../config';

const WorkspacePanel = ({
  isMobile = false,
  activeSidebarTab,
  selectedSprite,
  spriteEditorMarkup,
  spriteEditorError,
  handleApplySpriteMarkup,
  handleResetSpriteMarkup,
  handleSelectedSpriteSizeChange,
  handleDrop,
  setSelectedBlockId,
  hasBlocks,
  blocks,
  handleBlockChange,
  handleRemoveBlock,
  moveBlock,
  sounds,
  variableNames,
  listNames,
  availableBackdrops,
  isRecordingSound,
  handleSoundMenuAction,
  handleBackdropMenuAction,
  handleNestedDrop,
  handleNestedBlockChange,
  handleOperatorSlotChange,
  handleOperatorSlotDrop,
  showToast,
  handleDeleteVariableEntity,
  selectedBlockId,
  requestRemoveBlock,
  removingBlockIds,
  recentlyAddedBlockIds,
  hasDismissedRunNudge,
  setMobileQueueOrder,
}) => {
  const [draggedBlockId, setDraggedBlockId] = useState('');

  const mobileQueueView = (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-center gap-3">
        <h1 className="text-xl font-bold">Sequence</h1>
      </div>
      <p className="mb-2 text-center font-semibold">
        {selectedSprite
          ? `${selectedSprite.name} will run these blocks in order.`
          : 'Add a sprite from the navbar to start building.'}
      </p>
      {blocks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
          Tap the + button to choose blocks for your sequence.
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={() => setDraggedBlockId(block.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (!draggedBlockId || draggedBlockId === block.id) {
                  return;
                }

                const nextIds = [...blocks.map((entry) => entry.id)];
                const fromIndex = nextIds.indexOf(draggedBlockId);
                const toIndex = nextIds.indexOf(block.id);

                if (fromIndex === -1 || toIndex === -1) {
                  return;
                }

                const [movedId] = nextIds.splice(fromIndex, 1);
                nextIds.splice(toIndex, 0, movedId);
                setMobileQueueOrder(nextIds);
                setDraggedBlockId('');
              }}
              onDragEnd={() => setDraggedBlockId('')}
              className="flex items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-3 py-3"
            >
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {describeBlock(block)}
                </div>
              </div>
              <GripVertical size={18} className="flex-shrink-0 text-[var(--text-muted)]" />
              <button
                type="button"
                onClick={() => requestRemoveBlock(block.id)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-transparent text-[var(--text-muted)]"
                aria-label={`Remove ${describeBlock(block)}`}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
  <div className={`h-[100%] ${isMobile ? 'w-full px-4 pb-28 pt-4' : 'w-3/6 p-4'}`}>
    <div className="mb-4 flex items-center justify-center gap-3">
      <h1 className="text-xl font-bold">Workspace</h1>
    </div>
    <p className="mb-2 text-center font-semibold">
      {activeSidebarTab === 'sprite'
        ? selectedSprite
          ? `${selectedSprite.name} sprite editor. Update the SVG and apply it to this sprite.`
          : 'Add a sprite from the navbar to start building.'
        : selectedSprite
          ? `${selectedSprite.name} workspace. Drag blocks here and press Run Code.`
          : 'Add a sprite from the navbar to start building.'}
    </p>
    {activeSidebarTab === 'sprite' ? (
      selectedSprite ? (
        <SpritePaintEditor
          sprite={selectedSprite}
          markup={spriteEditorMarkup || selectedSprite.svgMarkup || ''}
          size={selectedSprite.spriteState?.size ?? 100}
          loadError={spriteEditorError}
          onApply={handleApplySpriteMarkup}
          onReset={handleResetSpriteMarkup}
          onSizeChange={handleSelectedSpriteSizeChange}
        />
      ) : null
    ) : isMobile ? (
      mobileQueueView
    ) : (
      <DroppableArea
        onDrop={handleDrop}
        onBackgroundClick={() => setSelectedBlockId('')}
        isEmpty={!hasBlocks}
        emptyState={
          <div className="pointer-events-none text-center">
            <div className="hint-circle">+</div>
            <p className="empty-hint-text text-base font-medium">Drag blocks here and press Run Code</p>
          </div>
        }
      >
        {blocks.map((block, index) => (
          <Block
            key={block.id}
            id={block.id}
            index={index}
            type={block.type}
            action={block.action}
            value={block.value}
            childrenBlocks={block.children || []}
            elseChildrenBlocks={block.elseChildren || []}
            onChange={handleBlockChange}
            onRemove={handleRemoveBlock}
            moveBlock={moveBlock}
            isWorkspaceBlock={true}
            isDraggable={true}
            availableSounds={sounds}
            availableVariables={variableNames}
            availableLists={listNames}
            availableBackdrops={availableBackdrops}
            isRecordingSound={isRecordingSound}
            onSoundMenuAction={handleSoundMenuAction}
            onBackdropMenuAction={handleBackdropMenuAction}
            onNestedDrop={handleNestedDrop}
            onNestedBlockChange={handleNestedBlockChange}
            onNestedBlockRemove={handleRemoveBlock}
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
        ))}
        {hasBlocks && !hasDismissedRunNudge && (
          <div className="mt-1">
            <span className="workspace-nudge">Press Run Code</span>
          </div>
        )}
      </DroppableArea>
    )}
  </div>
  );
};

export default WorkspacePanel;
