import React from 'react';
import { useDrop } from 'react-dnd';

const DroppableArea = ({ onDrop, onBackgroundClick, children, isEmpty = false, emptyState = null }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'block',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        onDrop(item);
      }
      return { dropped: true };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [onDrop]);

  return (
    <div
      ref={drop}
      onClick={onBackgroundClick}
      className={`workspace-canvas theme-transition relative min-h-[420px] overflow-y-auto md:min-h-[calc(80vh-100px)] md:max-h-[calc(80vh-100px)] ${
        isOver ? 'bg-blue-50/10' : ''
      }`}
      style={isOver ? { borderColor: '#60a5fa' } : undefined}
    >
      <div className="workspace-blocks min-h-full">
        {isEmpty ? (
          <div className="workspace-empty-hint">
            {emptyState}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
};

export default DroppableArea;
