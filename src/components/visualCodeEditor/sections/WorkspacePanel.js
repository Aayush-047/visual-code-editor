import React from 'react';
import Block from '../block/Block';
import DroppableArea from '../components/DroppableArea';
import SpritePaintEditor from '../components/SpritePaintEditor';

const WorkspacePanel = ({
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
}) => (
  <div className="h-[100%] w-3/6 p-4">
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

export default WorkspacePanel;
