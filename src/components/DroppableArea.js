import React from 'react';
import { useDrop } from 'react-dnd';

const DroppableArea = ({ onDrop, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'block',
    drop: (item, monitor) => {
      const didDrop = monitor.didDrop();
      if (!didDrop) {
        onDrop(item);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      className={`border-2 border-dashed p-4 min-h-[calc(80vh-100px)] max-h-[calc(80vh-100px)] overflow-y-auto ${
        isOver ? 'bg-gray-100' : 'bg-white'
      }`}
    >
      {children}
    </div>
  );
};

export default DroppableArea;