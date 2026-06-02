import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import FloatingDropdownMenu from './FloatingDropdownMenu';

const AssetCategoryDropdown = ({
  value,
  options,
  onChange,
  accentClassName = 'text-gray-700',
  menuActiveClassName = 'bg-gray-100 font-semibold text-gray-900',
}) => {
  const triggerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = value === 'all' ? 'All Categories' : value;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        event.target.closest('[data-floating-dropdown-menu="true"]')
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`flex h-10 items-center justify-between gap-3 rounded-full border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm ${accentClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} className={`flex-shrink-0 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <FloatingDropdownMenu isOpen={isOpen} triggerRef={triggerRef} width={208} placement="bottom">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(option);
              setIsOpen(false);
            }}
            className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
              value === option ? menuActiveClassName : 'text-gray-800'
            }`}
          >
            {option === 'all' ? 'All Categories' : option}
          </button>
        ))}
      </FloatingDropdownMenu>
    </div>
  );
};

export default AssetCategoryDropdown;
