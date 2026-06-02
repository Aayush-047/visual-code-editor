import { useCallback, useEffect, useRef, useState } from 'react';
import {
  appendChildBlock,
  blockContainsId,
  cloneBlocks,
  createWorkspaceBlock,
  findBlockById,
  isEventTriggerAction,
  isOperatorAction,
  removeBlockById,
  updateBlockValueById,
  updateOperatorSlotById,
} from '../config';

const useWorkspaceBlocks = ({
  activeSpriteId,
  blocks,
  replayableBlocks,
  showToast,
  updateSpriteById,
}) => {
  const blockHistoryRef = useRef({});
  const removalTimeoutsRef = useRef([]);
  const [selectedReplayBlockId, setSelectedReplayBlockId] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState('');
  const [removingBlockIds, setRemovingBlockIds] = useState([]);
  const [recentlyAddedBlockIds, setRecentlyAddedBlockIds] = useState([]);

  const pushBlockHistory = useCallback((spriteId, nextBlocksSnapshot) => {
    if (!spriteId) {
      return;
    }

    const previousEntries = blockHistoryRef.current[spriteId] || [];
    blockHistoryRef.current[spriteId] = [
      ...previousEntries.slice(-29),
      cloneBlocks(nextBlocksSnapshot),
    ];
  }, []);

  const mutateSelectedSpriteBlocks = useCallback(
    (updater, { recordHistory = true } = {}) => {
      const spriteId = activeSpriteId;

      if (!spriteId) {
        return;
      }

      updateSpriteById(spriteId, (sprite) => {
        const previousBlocks = sprite.blocks || [];
        const nextBlocks = updater(previousBlocks);

        if (recordHistory) {
          pushBlockHistory(spriteId, previousBlocks);
        }

        return {
          ...sprite,
          blocks: nextBlocks,
        };
      });
    },
    [activeSpriteId, pushBlockHistory, updateSpriteById]
  );

  const handleDrop = useCallback(
    (item) => {
      if (item.isWorkspaceBlock) {
        if (item.parentId) {
          mutateSelectedSpriteBlocks((prevBlocks) => {
            const existingBlock = findBlockById(prevBlocks, item.id);

            if (!existingBlock) {
              return prevBlocks;
            }

            return [...removeBlockById(prevBlocks, item.id), existingBlock];
          });
        }

        return;
      }

      const newBlock = createWorkspaceBlock(item);
      mutateSelectedSpriteBlocks((prevBlocks) => [...prevBlocks, newBlock]);
      setSelectedReplayBlockId((currentId) => currentId || newBlock.id);
      setRecentlyAddedBlockIds((prevIds) => [...prevIds, newBlock.id]);
      showToast('Block added.', 'info');

      const timeoutId = window.setTimeout(() => {
        setRecentlyAddedBlockIds((prevIds) => prevIds.filter((blockId) => blockId !== newBlock.id));
        removalTimeoutsRef.current = removalTimeoutsRef.current.filter((id) => id !== timeoutId);
      }, 320);

      removalTimeoutsRef.current.push(timeoutId);
    },
    [mutateSelectedSpriteBlocks, showToast]
  );

  const moveBlock = useCallback(
    (fromIndex, toIndex) => {
      mutateSelectedSpriteBlocks((prevBlocks) => {
        const nextBlocks = [...prevBlocks];
        const [movedBlock] = nextBlocks.splice(fromIndex, 1);

        if (!movedBlock) {
          return prevBlocks;
        }

        nextBlocks.splice(toIndex, 0, movedBlock);
        return nextBlocks;
      });
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleBlockChange = useCallback(
    (id, action, value) => {
      mutateSelectedSpriteBlocks((prevBlocks) =>
        prevBlocks.map((block) => (block.id === id ? { ...block, value } : block))
      );
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleNestedBlockChange = useCallback(
    (id, action, value) => {
      mutateSelectedSpriteBlocks((prevBlocks) => updateBlockValueById(prevBlocks, id, value));
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleRemoveBlock = useCallback(
    (id) => {
      mutateSelectedSpriteBlocks((prevBlocks) => removeBlockById(prevBlocks, id));
      setSelectedReplayBlockId((currentId) => (currentId === id ? '' : currentId));
      setSelectedBlockId((currentId) => (currentId === id ? '' : currentId));
    },
    [mutateSelectedSpriteBlocks]
  );

  const requestRemoveBlock = useCallback(
    (id) => {
      setRemovingBlockIds((prevIds) => prevIds.filter((blockId) => blockId !== id));
      handleRemoveBlock(id);
    },
    [handleRemoveBlock]
  );

  const handleNestedDrop = useCallback(
    (parentId, item, branchName = 'children') => {
      if (
        item.id === parentId ||
        isEventTriggerAction(item.action) ||
        isOperatorAction(item.action)
      ) {
        return;
      }

      mutateSelectedSpriteBlocks((prevBlocks) => {
        const existingBlock = item.isWorkspaceBlock ? findBlockById(prevBlocks, item.id) : null;
        const childBlock = existingBlock
          ? { ...existingBlock, id: `${Date.now()}-${Math.random()}` }
          : createWorkspaceBlock(item);

        const blocksWithoutMovedBlock = item.isWorkspaceBlock
          ? removeBlockById(prevBlocks, item.id)
          : prevBlocks;

        return appendChildBlock(blocksWithoutMovedBlock, parentId, childBlock, branchName);
      });
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleOperatorSlotChange = useCallback(
    (id, slotName, slotValue) => {
      mutateSelectedSpriteBlocks((prevBlocks) =>
        updateOperatorSlotById(prevBlocks, id, slotName, slotValue)
      );
    },
    [mutateSelectedSpriteBlocks]
  );

  const handleOperatorSlotDrop = useCallback(
    (id, slotName, item) => {
      if (item.id === id || !isOperatorAction(item.action)) {
        return;
      }

      mutateSelectedSpriteBlocks((prevBlocks) => {
        const existingBlock = item.isWorkspaceBlock ? findBlockById(prevBlocks, item.id) : null;
        if (existingBlock && blockContainsId(existingBlock, id)) {
          return prevBlocks;
        }

        const slotBlock = existingBlock
          ? { ...existingBlock, id: `${Date.now()}-${Math.random()}` }
          : createWorkspaceBlock(item);
        const blocksWithoutMovedBlock = item.isWorkspaceBlock
          ? removeBlockById(prevBlocks, item.id)
          : prevBlocks;

        return updateOperatorSlotById(blocksWithoutMovedBlock, id, slotName, slotBlock);
      });
    },
    [mutateSelectedSpriteBlocks]
  );

  useEffect(() => {
    if (selectedReplayBlockId && replayableBlocks.some((block) => block.id === selectedReplayBlockId)) {
      return;
    }

    setSelectedReplayBlockId(replayableBlocks[0]?.id || '');
  }, [replayableBlocks, selectedReplayBlockId]);

  useEffect(() => {
    if (selectedBlockId && findBlockById(blocks, selectedBlockId)) {
      return;
    }

    setSelectedBlockId('');
  }, [blocks, selectedBlockId]);

  useEffect(() => {
    const handleEditorShortcuts = (event) => {
      const isUndoShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';

      if (isUndoShortcut) {
        const spriteId = activeSpriteId;
        const historyEntries = blockHistoryRef.current[spriteId] || [];

        if (historyEntries.length > 0) {
          event.preventDefault();
          const previousBlocks = historyEntries[historyEntries.length - 1];
          blockHistoryRef.current[spriteId] = historyEntries.slice(0, -1);
          mutateSelectedSpriteBlocks(() => cloneBlocks(previousBlocks), { recordHistory: false });
          setSelectedBlockId('');
        }
        return;
      }

      if ((event.key === 'Delete' || event.key === 'Backspace') && selectedBlockId) {
        const target = event.target;
        const isTypingField =
          target instanceof HTMLElement &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

        if (!isTypingField) {
          event.preventDefault();
          requestRemoveBlock(selectedBlockId);
        }
      }
    };

    window.addEventListener('keydown', handleEditorShortcuts);

    return () => {
      window.removeEventListener('keydown', handleEditorShortcuts);
    };
  }, [activeSpriteId, mutateSelectedSpriteBlocks, requestRemoveBlock, selectedBlockId]);

  useEffect(
    () => () => {
      removalTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      removalTimeoutsRef.current = [];
    },
    []
  );

  return {
    handleBlockChange,
    handleDrop,
    handleNestedBlockChange,
    handleNestedDrop,
    handleOperatorSlotChange,
    handleOperatorSlotDrop,
    handleRemoveBlock,
    moveBlock,
    recentlyAddedBlockIds,
    removingBlockIds,
    requestRemoveBlock,
    selectedBlockId,
    selectedReplayBlockId,
    setRemovingBlockIds,
    setSelectedBlockId,
    setSelectedReplayBlockId,
  };
};

export default useWorkspaceBlocks;
