import React from 'react';
import { useDrop } from 'react-dnd';

const DroppableArea = ({ onDrop, children, isEmpty = false, emptyState = null }) => {
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
      className={`workspace-canvas theme-transition relative min-h-[calc(80vh-100px)] max-h-[calc(80vh-100px)] overflow-y-auto rounded-2xl border-2 border-dashed p-4 ${
        isOver ? 'bg-blue-50/10' : ''
      }`}
      style={isOver ? { borderColor: '#60a5fa' } : undefined}
    >
      <div className="min-h-full p-4">
        {isEmpty ? (
          <div className="flex min-h-[calc(80vh-164px)] items-center justify-center">
            {emptyState}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
};

export default DroppableArea;
