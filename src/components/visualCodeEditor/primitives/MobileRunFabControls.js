import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, MoreVertical, Rewind, Square, X } from 'lucide-react';
import { describeBlock } from '../config';
import MobileBottomSheet from './MobileBottomSheet';

const RUN_HINT_KEY = 'vce_mobile_run_fab_hint_dismissed';

const MobileRunFabControls = ({
  isRunning,
  replayableBlocks,
  selectedReplayBlockId,
  setSelectedReplayBlockId,
  runCode,
  replaySelectedBlock,
  stopCurrentSprite,
  stopAllCode,
}) => {
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);
  const [pendingReplayBlockId, setPendingReplayBlockId] = useState(selectedReplayBlockId);
  const [showRunHint, setShowRunHint] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.localStorage.getItem(RUN_HINT_KEY) !== 'true';
  });

  const hasReplayableBlocks = replayableBlocks.length > 0;

  useEffect(() => {
    setPendingReplayBlockId(selectedReplayBlockId || replayableBlocks[0]?.id || '');
  }, [replayableBlocks, selectedReplayBlockId]);

  useEffect(() => {
    if (!isRunning) {
      setIsSpeedDialOpen(false);
    }
  }, [isRunning]);

  useEffect(() => {
    if (isReplayModalOpen) {
      setIsSpeedDialOpen(false);
    }
  }, [isReplayModalOpen]);

  const dismissRunHint = () => {
    setShowRunHint(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(RUN_HINT_KEY, 'true');
    }
  };

  const actionButtons = useMemo(
    () => [
      {
        id: 'replay',
        icon: Rewind,
        label: 'Replay',
        disabled: !hasReplayableBlocks || isRunning,
        className: 'bg-blue-600 text-white',
        onClick: () => {
          dismissRunHint();
          setIsReplayModalOpen(true);
        },
      },
      {
        id: 'stop-sprite',
        icon: Square,
        label: 'Stop Sprite',
        disabled: !isRunning,
        className: 'preview-stop-current text-white',
        onClick: () => {
          dismissRunHint();
          setIsSpeedDialOpen(false);
          stopCurrentSprite();
        },
      },
      {
        id: 'stop-all',
        icon: X,
        label: 'Stop All',
        disabled: !isRunning,
        className: 'preview-stop-all text-white',
        onClick: () => {
          dismissRunHint();
          setIsSpeedDialOpen(false);
          stopAllCode();
        },
      },
    ],
    [hasReplayableBlocks, isRunning, stopAllCode, stopCurrentSprite]
  );

  return (
    <>
      <div className="mobile-run-fab-stack lg:hidden">
        {isSpeedDialOpen ? (
          <div className="mobile-speed-dial-actions">
            {actionButtons.map((actionButton) => {
              const Icon = actionButton.icon;
              return (
                <button
                  key={actionButton.id}
                  type="button"
                  onClick={actionButton.onClick}
                  disabled={actionButton.disabled}
                  aria-label={actionButton.label}
                  className={`mobile-speed-dial-button ${actionButton.className} ${
                    actionButton.disabled ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                >
                  <Icon size={18} />
                </button>
              );
            })}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => setIsSpeedDialOpen((open) => !open)}
          aria-label="Open replay and stop actions"
          className={`mobile-more-fab ${isSpeedDialOpen ? 'mobile-more-fab-open' : ''}`}
        >
          <MoreVertical size={20} />
        </button>
        <div className="mobile-run-fab-shell">
          {showRunHint ? <span className="mobile-fab-hint">Run code</span> : null}
          <button
            type="button"
            onClick={() => {
              dismissRunHint();
              setIsSpeedDialOpen(false);
              runCode();
            }}
            disabled={isRunning}
            aria-label="Run code"
            data-tutorial="mobile-run"
            className={`mobile-run-main-fab ${isSpeedDialOpen ? 'mobile-run-main-fab-open' : ''}`}
          >
            {isRunning ? <Loader2 size={24} className="animate-spin" /> : <span className="text-xl leading-none">▶</span>}
          </button>
        </div>
      </div>
      <MobileBottomSheet
        isOpen={isReplayModalOpen}
        title="Replay Block"
        onClose={() => setIsReplayModalOpen(false)}
      >
        <p className="mb-3 text-sm text-[var(--text-muted)]">Choose which block to replay.</p>
        <div className="max-h-[50vh] space-y-2 overflow-y-auto pb-2">
          {replayableBlocks.map((block, blockIndex) => (
            <button
              key={block.id}
              type="button"
              onClick={() => setPendingReplayBlockId(block.id)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                pendingReplayBlockId === block.id
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-[var(--panel-border)] bg-[var(--surface-chip)] text-[var(--text-primary)]'
              }`}
            >
              <span className="truncate">{describeBlock(block)}</span>
              <span className="ml-3 text-xs font-semibold text-slate-400">{blockIndex + 1}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsReplayModalOpen(false)}
            className="min-h-[44px] rounded-xl border border-[var(--panel-border)] bg-[var(--surface-chip)] px-3 text-sm font-semibold text-[var(--text-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const blockToReplay =
                replayableBlocks.find((block) => block.id === pendingReplayBlockId) ||
                replayableBlocks[0];
              setSelectedReplayBlockId(blockToReplay?.id || '');
              setIsReplayModalOpen(false);
              void replaySelectedBlock(blockToReplay);
            }}
            disabled={!pendingReplayBlockId}
            className={`min-h-[44px] rounded-xl bg-blue-600 px-3 text-sm font-semibold text-white ${
              !pendingReplayBlockId ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            Replay
          </button>
        </div>
      </MobileBottomSheet>
    </>
  );
};

export default MobileRunFabControls;
