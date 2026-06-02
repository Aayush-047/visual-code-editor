import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DROPDOWN_MENU_MAX_HEIGHT } from './blockConstants';

const BlockDropdownMenu = ({ isOpen, triggerRef, width = 128, children }) => {
  const [menuStyle, setMenuStyle] = useState(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) {
      setMenuStyle(null);
      return undefined;
    }

    const updatePosition = () => {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuWidth = Math.max(width, triggerRect.width);
      const viewportPadding = 8;
      const gap = 8;
      const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
      const spaceAbove = triggerRect.top - viewportPadding;
      const opensBelow = spaceBelow >= Math.min(DROPDOWN_MENU_MAX_HEIGHT, spaceAbove);
      const left = Math.min(
        window.innerWidth - menuWidth - viewportPadding,
        Math.max(viewportPadding, triggerRect.left)
      );
      const top = opensBelow
        ? triggerRect.bottom + gap
        : Math.max(viewportPadding, triggerRect.top - DROPDOWN_MENU_MAX_HEIGHT - gap);

      setMenuStyle({
        left,
        top,
        width: menuWidth,
        maxHeight: Math.max(
          80,
          Math.min(DROPDOWN_MENU_MAX_HEIGHT, opensBelow ? spaceBelow - gap : spaceAbove - gap)
        ),
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, triggerRef, width]);

  if (!isOpen || !menuStyle) {
    return null;
  }

  return createPortal(
    <div
      data-block-dropdown-menu="true"
      className="fixed z-[9999] overflow-y-auto rounded border border-gray-200 bg-white text-black shadow-2xl"
      style={menuStyle}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

export default BlockDropdownMenu;
