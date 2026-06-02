import React from 'react';
import Block from './Block';

const NestedBlockDropZone = ({
  innerRef,
  isOver,
  blocks,
  parentId,
  parentSlot,
  onChange,
  onRemove,
  availableSounds,
  availableVariables,
  availableLists,
  availableBackdrops,
  isRecordingSound,
  onSoundMenuAction,
  onBackdropMenuAction,
  onNestedDrop,
  onNestedBlockChange,
  onNestedBlockRemove,
  onOperatorSlotChange,
  onOperatorSlotDrop,
  onOperatorValidationMessage,
  onDeleteVariableEntity,
  selectedBlockId,
  onSelect,
  onRequestRemove,
  removingBlockIds,
  recentlyAddedBlockIds,
  emptyLabel = 'Drop blocks here',
  heading = '',
}) => (
  <div
    ref={innerRef}
    className={`ml-4 mt-2 min-h-16 rounded border-2 border-dashed p-2 ${
      isOver ? 'bg-amber-300 border-white' : 'bg-amber-400 border-amber-200'
    }`}
  >
    {heading ? <div className="mb-1 text-xs font-semibold text-amber-900">{heading}</div> : null}
    {blocks.length === 0 ? (
      <div className="px-1 py-3 text-xs text-amber-900">{emptyLabel}</div>
    ) : (
      blocks.map((childBlock, childIndex) => (
        <Block
          key={childBlock.id}
          id={childBlock.id}
          index={childIndex}
          parentId={parentId}
          parentSlot={parentSlot}
          type={childBlock.type}
          action={childBlock.action}
          value={childBlock.value}
          childrenBlocks={childBlock.children || []}
          elseChildrenBlocks={childBlock.elseChildren || []}
          onChange={onChange}
          onRemove={onRemove}
          isWorkspaceBlock={true}
          isDraggable={true}
          availableSounds={availableSounds}
          availableVariables={availableVariables}
          availableLists={availableLists}
          availableBackdrops={availableBackdrops}
          isRecordingSound={isRecordingSound}
          onSoundMenuAction={onSoundMenuAction}
          onBackdropMenuAction={onBackdropMenuAction}
          onNestedDrop={onNestedDrop}
          onNestedBlockChange={onNestedBlockChange}
          onNestedBlockRemove={onNestedBlockRemove}
          onOperatorSlotChange={onOperatorSlotChange}
          onOperatorSlotDrop={onOperatorSlotDrop}
          onOperatorValidationMessage={onOperatorValidationMessage}
          onDeleteVariableEntity={onDeleteVariableEntity}
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
          onRequestRemove={onRequestRemove}
          removingBlockIds={removingBlockIds}
          recentlyAddedBlockIds={recentlyAddedBlockIds}
        />
      ))
    )}
  </div>
);

export default NestedBlockDropZone;
