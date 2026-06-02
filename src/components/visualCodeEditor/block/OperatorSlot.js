import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';
import { OPERATORS } from '../../../constants/BlockTypes';
import {
  getOperatorInputWidth,
  isOperatorBlockValue,
} from './blockConstants';

const OperatorSlot = ({
  BlockComponent,
  ownerId,
  slotName,
  slotValue,
  onNumberChange,
  onOperatorDrop,
  onNestedBlockChange,
  onNestedBlockRemove,
  availableSounds,
  availableVariables,
  availableLists,
  availableBackdrops,
  isRecordingSound,
  onSoundMenuAction,
  onBackdropMenuAction,
  onNestedDrop,
  onOperatorSlotChange,
  onOperatorSlotDrop,
  onOperatorValidationMessage,
  min,
  max,
  inputType = 'number',
  minCharsOverride,
  compact = false,
  selectedBlockId = '',
  onSelect,
  onRequestRemove,
  removingBlockIds = [],
  recentlyAddedBlockIds = [],
}) => {
  const slotRef = useRef(null);
  const slotBlock = isOperatorBlockValue(slotValue) ? slotValue : null;
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: 'block',
      canDrop: (item) => item.type === OPERATORS && item.id !== ownerId,
      drop: (item, monitor) => {
        if (monitor.didDrop() || !monitor.canDrop()) {
          return undefined;
        }

        onOperatorDrop(ownerId, slotName, item);
        return { dropped: true };
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver({ shallow: true }) && monitor.canDrop(),
      }),
    }),
    [ownerId, slotName, onOperatorDrop]
  );

  drop(slotRef);

  if (slotBlock) {
    return (
      <div
        ref={slotRef}
        className={`min-h-8 min-w-16 rounded-full bg-white/20 p-1 ${isOver ? 'ring-2 ring-white' : ''}`}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <BlockComponent
          id={slotBlock.id}
          parentId={ownerId}
          parentSlot={slotName}
          type={slotBlock.type}
          action={slotBlock.action}
          value={slotBlock.value}
          childrenBlocks={slotBlock.children || []}
          onChange={onNestedBlockChange}
          onRemove={onNestedBlockRemove}
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
          selectedBlockId={selectedBlockId}
          onSelect={onSelect}
          onRequestRemove={onRequestRemove}
          removingBlockIds={removingBlockIds}
          recentlyAddedBlockIds={recentlyAddedBlockIds}
        />
      </div>
    );
  }

  return (
    <input
      ref={slotRef}
      type={inputType}
      min={inputType === 'number' ? min : undefined}
      max={inputType === 'number' ? max : undefined}
      value={slotValue}
      onChange={(event) => onNumberChange(slotName, event.target.value)}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      className={`${compact ? 'px-1 py-0.5' : 'p-1'} rounded-full text-black ${isOver ? 'ring-2 ring-white' : ''}`}
      style={{
        fontSize: compact ? '0.65rem' : '0.75rem',
        width: getOperatorInputWidth(slotValue, compact, minCharsOverride),
      }}
    />
  );
};

export default OperatorSlot;
