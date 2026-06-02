import React, { useId, useState } from 'react';

const Tooltip = ({ content, shortcut, children, className = '', position = 'top' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  if (!content) {
    return children;
  }

  const positionClassName = position === 'bottom'
    ? 'left-1/2 top-full mt-2 -translate-x-1/2'
    : 'left-1/2 bottom-full mb-2 -translate-x-1/2';

  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <span aria-describedby={isOpen ? tooltipId : undefined} className="inline-flex">
        {children}
      </span>
      {isOpen && (
        <span
          id={tooltipId}
          role="tooltip"
          className={`pointer-events-none absolute z-[10000] min-w-max rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow-xl ${positionClassName}`}
        >
          <span>{content}</span>
          {shortcut ? <span className="ml-2 text-slate-300">{shortcut}</span> : null}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
