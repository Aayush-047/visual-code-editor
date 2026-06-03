import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react';
import * as actionTypes from '../../../constants/ActionTypes';
import { OPERATORS } from '../../../constants/BlockTypes';
import Block from '../block/Block';
import {
  appendChildBlock,
  cloneBlocks,
  createWorkspaceBlock,
  describeBlock,
  findBlockById,
  isControlContainerAction,
  isEventTriggerAction,
  isOperatorAction,
  removeBlockById,
  updateBlockValueById,
  updateOperatorSlotById,
} from '../config';
import MobileBottomSheet from './MobileBottomSheet';

const CONDITION_ACTIONS = new Set([
  actionTypes.IF_THEN,
  actionTypes.IF_THEN_ELSE,
  actionTypes.WAIT_UNTIL,
  actionTypes.REPEAT_UNTIL,
]);
const BINARY_OPERATOR_ACTIONS = new Set([
  actionTypes.OPERATOR_ADD,
  actionTypes.OPERATOR_SUBTRACT,
  actionTypes.OPERATOR_MULTIPLY,
  actionTypes.OPERATOR_DIVIDE,
  actionTypes.OPERATOR_MODULO,
  actionTypes.OPERATOR_LESS_THAN,
  actionTypes.OPERATOR_EQUALS,
  actionTypes.OPERATOR_GREATER_THAN,
  actionTypes.OPERATOR_AND,
  actionTypes.OPERATOR_OR,
  actionTypes.OPERATOR_PICK_RANDOM,
]);

const hasConditionSlot = (block) => CONDITION_ACTIONS.has(block?.action);
const hasChildrenBranch = (block) =>
  isControlContainerAction(block?.action) || isEventTriggerAction(block?.action);
const hasElseBranch = (block) => block?.action === actionTypes.IF_THEN_ELSE;
const getOperatorSlotConfigs = (block) => {
  if (!block) {
    return [];
  }

  if (hasConditionSlot(block)) {
    return [{ slotName: 'condition', label: 'Condition' }];
  }

  if (BINARY_OPERATOR_ACTIONS.has(block.action)) {
    return [
      { slotName: 'left', label: 'Left input' },
      { slotName: 'right', label: 'Right input' },
    ];
  }

  switch (block.action) {
    case actionTypes.OPERATOR_NOT:
      return [{ slotName: 'operand', label: 'Operand' }];
    case actionTypes.OPERATOR_JOIN:
      return [
        { slotName: 'left', label: 'Left text' },
        { slotName: 'right', label: 'Right text' },
      ];
    case actionTypes.OPERATOR_LETTER_OF:
      return [
        { slotName: 'index', label: 'Letter index' },
        { slotName: 'source', label: 'Source text' },
      ];
    case actionTypes.OPERATOR_LENGTH_OF:
      return [{ slotName: 'source', label: 'Source text' }];
    case actionTypes.OPERATOR_CONTAINS:
      return [
        { slotName: 'source', label: 'Source text' },
        { slotName: 'target', label: 'Target text' },
      ];
    case actionTypes.OPERATOR_MATH_FUNCTION:
      return [{ slotName: 'operand', label: 'Operand' }];
    default:
      return [];
  }
};

const requiresComposer = (block) =>
  isControlContainerAction(block?.action)
  || isEventTriggerAction(block?.action)
  || block?.action === actionTypes.WAIT_UNTIL
  || (isOperatorAction(block?.action) && getOperatorSlotConfigs(block).length > 0);

const MobileControlComposer = ({
  isOpen,
  onClose,
  sourceBlock,
  initialBlock,
  sidebarBlocks,
  sounds,
  variableNames,
  listNames,
  availableBackdrops,
  isRecordingSound,
  handleSoundMenuAction,
  handleBackdropMenuAction,
  handleDeleteVariableEntity,
  showToast,
  onSave,
}) => {
  const [draftBlock, setDraftBlock] = useState(null);
  const [editorPath, setEditorPath] = useState([]);
  const [pickerState, setPickerState] = useState(null);
  const [pickerQueue, setPickerQueue] = useState([]);
  const [selectedDraftBlockId, setSelectedDraftBlockId] = useState('');
  const [showCurrentBlockSettings, setShowCurrentBlockSettings] = useState(false);

  const operatorTemplates = useMemo(
    () => sidebarBlocks.filter((block) => block.type === OPERATORS),
    [sidebarBlocks]
  );

  const statementTemplates = useMemo(
    () =>
      sidebarBlocks.filter(
        (block) => block.type !== OPERATORS && !isEventTriggerAction(block.action)
      ),
    [sidebarBlocks]
  );

  useEffect(() => {
    if (!isOpen || !sourceBlock) {
      return;
    }

    const nextDraftBlock = initialBlock
      ? cloneBlocks([initialBlock])[0]
      : createWorkspaceBlock(sourceBlock);

    setDraftBlock(nextDraftBlock);
    setEditorPath([nextDraftBlock.id]);
    setPickerState(null);
    setPickerQueue([]);
    setSelectedDraftBlockId(nextDraftBlock.id);
    setShowCurrentBlockSettings(false);
  }, [initialBlock, isOpen, sourceBlock]);

  const currentEditorId = editorPath[editorPath.length - 1] || '';
  const currentBlock = draftBlock ? findBlockById([draftBlock], currentEditorId) || draftBlock : null;
  const parentBlock =
    draftBlock && editorPath.length > 1
      ? findBlockById([draftBlock], editorPath[editorPath.length - 2]) || null
      : null;
  const currentSlotConfigs = getOperatorSlotConfigs(currentBlock);

  const updateDraft = (updater) => {
    setDraftBlock((prevDraftBlock) => {
      if (!prevDraftBlock) {
        return prevDraftBlock;
      }

      return updater(prevDraftBlock);
    });
  };

  const handleDraftBlockChange = (blockId, action, value) => {
    updateDraft((prevDraftBlock) => updateBlockValueById([prevDraftBlock], blockId, value)[0]);
  };

  const handleDraftOperatorSlotChange = (blockId, slotName, slotValue) => {
    updateDraft((prevDraftBlock) =>
      updateOperatorSlotById([prevDraftBlock], blockId, slotName, slotValue)[0]
    );
  };

  const handleDraftRemove = (blockId) => {
    if (!draftBlock || blockId === draftBlock.id) {
      return;
    }

    updateDraft(
      (prevDraftBlock) => removeBlockById([prevDraftBlock], blockId)[0] || prevDraftBlock
    );
    setEditorPath((prevPath) => (prevPath.includes(blockId) ? prevPath.filter((id) => id !== blockId) : prevPath));
    setSelectedDraftBlockId((currentId) => (currentId === blockId ? currentEditorId : currentId));
  };

  const toggleQueuedTemplate = (templateBlock) => {
    setPickerQueue((prevQueue) => {
      const alreadyQueued = prevQueue.some((queuedBlock) => queuedBlock.id === templateBlock.id);
      if (alreadyQueued) {
        return prevQueue.filter((queuedBlock) => queuedBlock.id !== templateBlock.id);
      }

      return [...prevQueue, templateBlock];
    });
  };

  const handleApplyQueuedChildren = () => {
    if (!currentBlock || !pickerState?.branchName || pickerQueue.length === 0) {
      return;
    }

    updateDraft((prevDraftBlock) =>
      pickerQueue.reduce((nextDraftBlock, templateBlock) => {
        const nestedBlock = createWorkspaceBlock(templateBlock);
        return appendChildBlock([nextDraftBlock], currentBlock.id, nestedBlock, pickerState.branchName)[0];
      }, prevDraftBlock)
    );
    setPickerQueue([]);
    setPickerState(null);
  };

  const handlePickOperatorForSlot = (slotName, templateBlock) => {
    if (!currentBlock || !slotName) {
      return;
    }

    const operatorBlock = createWorkspaceBlock(templateBlock);
    updateDraft((prevDraftBlock) =>
      updateOperatorSlotById([prevDraftBlock], currentBlock.id, slotName, operatorBlock)[0]
    );
    setPickerState(null);
  };

  const handleClearOperatorSlot = (slotName) => {
    if (!currentBlock || !slotName) {
      return;
    }

    updateDraft((prevDraftBlock) =>
      updateOperatorSlotById([prevDraftBlock], currentBlock.id, slotName, '')[0]
    );
  };

  const handleSaveDraft = () => {
    if (!draftBlock || !sourceBlock) {
      return;
    }

    onSave?.(draftBlock);
  };

  const pickerTemplates = pickerState?.mode === 'condition' ? operatorTemplates : statementTemplates;
  const pickerTitle =
    pickerState?.mode === 'condition'
      ? `Choose for ${describeBlock(currentBlock || sourceBlock)}`
      : pickerState?.branchName === 'elseChildren'
        ? `Add Else Blocks to ${describeBlock(currentBlock || sourceBlock)}`
        : `Add Blocks to ${describeBlock(currentBlock || sourceBlock)}`;

  const renderDraftBlock = (
    block,
    { showNestedEdit = false, heading = describeBlock(block), compact = false } = {}
  ) => (
    <div
      key={block.id}
      className={`rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold text-[var(--text-primary)]">{heading}</h3>
        {(showNestedEdit || block.id !== draftBlock?.id) ? (
          <div className="flex flex-shrink-0 items-center gap-2">
            {requiresComposer(block) ? (
              <button
                type="button"
                onClick={() => {
                  setEditorPath((prevPath) => [...prevPath, block.id]);
                  setSelectedDraftBlockId(block.id);
                }}
                className="rounded-full border border-[var(--panel-border)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)]"
              >
                Edit
              </button>
            ) : null}
            {block.id !== draftBlock?.id ? (
              <button
                type="button"
                onClick={() => handleDraftRemove(block.id)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-red-200 text-red-600"
                aria-label={`Remove ${heading}`}
              >
                <Trash2 size={14} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="min-w-0 overflow-x-auto">
        <Block
          id={block.id}
          type={block.type}
          action={block.action}
          value={block.value}
          childrenBlocks={block.children || []}
          elseChildrenBlocks={block.elseChildren || []}
          onChange={handleDraftBlockChange}
          isDraggable={false}
          isWorkspaceBlock={false}
          availableSounds={sounds}
          availableVariables={variableNames}
          availableLists={listNames}
          availableBackdrops={availableBackdrops}
          isRecordingSound={isRecordingSound}
          onSoundMenuAction={handleSoundMenuAction}
          onBackdropMenuAction={handleBackdropMenuAction}
          onNestedBlockChange={handleDraftBlockChange}
          onOperatorSlotChange={handleDraftOperatorSlotChange}
          onOperatorValidationMessage={showToast}
          onDeleteVariableEntity={handleDeleteVariableEntity}
          selectedBlockId={selectedDraftBlockId}
          onSelect={setSelectedDraftBlockId}
          onRequestRemove={handleDraftRemove}
        />
      </div>
    </div>
  );

  return (
    <MobileBottomSheet
      isOpen={isOpen}
      title={pickerState ? pickerTitle : describeBlock(currentBlock || sourceBlock)}
      onClose={onClose}
      className="top-[116px] max-h-[calc(100vh-116px)]"
      overlayClassName="top-[116px]"
      overlayVisible={false}
      closeMode="back"
    >
      {pickerState ? (
        <div className="space-y-3 pb-24 pr-1">
            {pickerState.mode === 'children' ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {pickerQueue.length > 0 ? (
                  pickerQueue.map((queuedBlock, index) => (
                    <div
                      key={queuedBlock.id}
                      className="flex flex-shrink-0 items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--surface-chip)] px-3 py-2"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <span className="max-w-[120px] truncate text-sm font-medium text-[var(--text-primary)]">
                        {describeBlock(queuedBlock)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleQueuedTemplate(queuedBlock)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-[var(--text-muted)]"
                        aria-label={`Remove ${describeBlock(queuedBlock)}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-full border border-dashed border-[var(--panel-border)] px-4 py-2 text-sm text-[var(--text-muted)]">
                    Tap blocks to build a queue
                  </div>
                )}
              </div>
            ) : null}
            <div className="space-y-3">
              {pickerTemplates.map((templateBlock) => (
                <div
                  key={templateBlock.id}
                  className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] p-3"
                >
                  <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
                    {describeBlock(templateBlock)}
                  </h3>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1 overflow-x-auto">
                      <Block
                        id={templateBlock.id}
                        type={templateBlock.type}
                        action={templateBlock.action}
                        value={templateBlock.value}
                        onChange={() => {}}
                        isDraggable={false}
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
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        pickerState.mode === 'condition'
                          ? handlePickOperatorForSlot(pickerState.slotName, templateBlock)
                          : toggleQueuedTemplate(templateBlock)
                      }
                      className={`mt-1 inline-flex min-h-[40px] min-w-[56px] flex-shrink-0 items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold ${
                        pickerState.mode === 'children' && pickerQueue.some((queuedBlock) => queuedBlock.id === templateBlock.id)
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-blue-600 bg-white text-blue-600'
                      }`}
                    >
                      {pickerState.mode === 'children' && pickerQueue.some((queuedBlock) => queuedBlock.id === templateBlock.id)
                        ? pickerQueue.findIndex((queuedBlock) => queuedBlock.id === templateBlock.id) + 1
                        : 'Tap'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          {pickerState.mode === 'children' ? (
            <div className="-mx-4 sticky bottom-0 border-t border-[var(--panel-border)] bg-[var(--surface-modal)]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
              <button
                type="button"
                onClick={handleApplyQueuedChildren}
                disabled={pickerQueue.length === 0}
                className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-semibold ${
                  pickerQueue.length === 0
                    ? 'cursor-not-allowed bg-gray-300 text-gray-600'
                    : 'bg-blue-600 text-white'
                }`}
              >
                Add {pickerQueue.length} block{pickerQueue.length === 1 ? '' : 's'}
              </button>
            </div>
          ) : null}
        </div>
      ) : currentBlock ? (
        <>
          <div className="space-y-4 pb-24 pr-1">
            {editorPath.length > 1 ? (
              <button
                type="button"
                onClick={() => setEditorPath((prevPath) => prevPath.slice(0, -1))}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
              >
                <ChevronLeft size={16} />
                Back to {describeBlock(parentBlock || draftBlock)}
              </button>
            ) : null}

            <section className="rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {describeBlock(currentBlock)}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Build the nested parts below, then add the whole block to your sequence.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCurrentBlockSettings((isOpen) => !isOpen)}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[var(--panel-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                >
                  Settings
                  {showCurrentBlockSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
              {showCurrentBlockSettings ? (
                <div className="mt-3">
                  {renderDraftBlock(currentBlock, { heading: 'Block settings' })}
                </div>
              ) : null}
            </section>

            {currentSlotConfigs.length > 0 ? (
              <section className="space-y-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] p-4">
                {currentSlotConfigs.map((slotConfig) => {
                  const slotValue = currentBlock.value?.[slotConfig.slotName];
                  const slotBlock =
                    slotValue && typeof slotValue === 'object' && slotValue.type === OPERATORS
                      ? slotValue
                      : null;

                  return (
                    <div
                      key={slotConfig.slotName}
                      className="rounded-2xl border border-[var(--panel-border)] bg-white/40 p-3 dark:bg-white/5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                            {slotConfig.label}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPickerState({ mode: 'condition', slotName: slotConfig.slotName })
                            }
                            className="rounded-full border border-[var(--panel-border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
                          >
                            {slotBlock ? 'Change' : 'Choose'}
                          </button>
                          {slotBlock ? (
                            <button
                              type="button"
                              onClick={() => handleClearOperatorSlot(slotConfig.slotName)}
                              className="rounded-full border border-red-200 px-3 py-2 text-sm font-medium text-red-600"
                            >
                              Clear
                            </button>
                          ) : null}
                        </div>
                      </div>
                      {slotBlock ? (
                        <div className="mt-3">
                          {renderDraftBlock(slotBlock, {
                            showNestedEdit: true,
                            heading: describeBlock(slotBlock),
                          })}
                        </div>
                      ) : null}
                      {!slotBlock ? (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">
                          Use a nested operator block here if you need dynamic logic.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </section>
            ) : null}

            {hasChildrenBranch(currentBlock) ? (
              <section className="space-y-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {isEventTriggerAction(currentBlock?.action) ? 'Triggered Steps' : 'Then / Loop Body'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {isEventTriggerAction(currentBlock?.action)
                        ? 'These blocks run when this event fires.'
                        : 'These blocks run inside this control block.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerQueue([]);
                      setPickerState({ mode: 'children', branchName: 'children' });
                    }}
                    className="inline-flex min-h-[44px] whitespace-nowrap items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Add block
                  </button>
                </div>
                {currentBlock.children?.length ? (
                  currentBlock.children.map((childBlock) =>
                    renderDraftBlock(childBlock, { showNestedEdit: true, compact: true })
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--panel-border)] px-4 py-4 text-sm text-[var(--text-muted)]">
                    No nested blocks yet.
                  </div>
                )}
              </section>
            ) : null}

            {hasElseBranch(currentBlock) ? (
              <section className="space-y-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Else</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      These blocks run when the condition is false.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerQueue([]);
                      setPickerState({ mode: 'children', branchName: 'elseChildren' });
                    }}
                    className="inline-flex min-h-[44px] whitespace-nowrap items-center gap-2 rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={16} />
                    Add block
                  </button>
                </div>
                {currentBlock.elseChildren?.length ? (
                  currentBlock.elseChildren.map((childBlock) =>
                    renderDraftBlock(childBlock, { showNestedEdit: true, compact: true })
                  )
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--panel-border)] px-4 py-4 text-sm text-[var(--text-muted)]">
                    No else blocks yet.
                  </div>
                )}
              </section>
            ) : null}
          </div>
          <div className="-mx-4 sticky bottom-0 border-t border-[var(--panel-border)] bg-[var(--surface-modal)]/95 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-green-600 px-4 py-3 text-base font-semibold text-white"
            >
              {initialBlock ? 'Update block in sequence' : 'Add block to sequence'}
            </button>
          </div>
        </>
      ) : null}
    </MobileBottomSheet>
  );
};

export default MobileControlComposer;
