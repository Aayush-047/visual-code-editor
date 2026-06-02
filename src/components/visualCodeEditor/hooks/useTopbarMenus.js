import { useEffect, useRef, useState } from 'react';

const useTopbarMenus = () => {
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [isAssetsMenuOpen, setIsAssetsMenuOpen] = useState(false);
  const [isSpriteSelectorOpen, setIsSpriteSelectorOpen] = useState(false);
  const [isBackdropSelectorOpen, setIsBackdropSelectorOpen] = useState(false);
  const fileMenuRef = useRef(null);
  const assetsMenuRef = useRef(null);
  const spriteSelectorRef = useRef(null);
  const backdropSelectorRef = useRef(null);

  useEffect(() => {
    if (!isFileMenuOpen && !isAssetsMenuOpen && !isSpriteSelectorOpen && !isBackdropSelectorOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (
        fileMenuRef.current?.contains(event.target) ||
        assetsMenuRef.current?.contains(event.target) ||
        spriteSelectorRef.current?.contains(event.target) ||
        backdropSelectorRef.current?.contains(event.target) ||
        event.target.closest('[data-floating-dropdown-menu="true"]')
      ) {
        return;
      }

      setIsFileMenuOpen(false);
      setIsAssetsMenuOpen(false);
      setIsSpriteSelectorOpen(false);
      setIsBackdropSelectorOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsFileMenuOpen(false);
        setIsAssetsMenuOpen(false);
        setIsSpriteSelectorOpen(false);
        setIsBackdropSelectorOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isAssetsMenuOpen, isBackdropSelectorOpen, isFileMenuOpen, isSpriteSelectorOpen]);

  return {
    assetsMenuRef,
    backdropSelectorRef,
    fileMenuRef,
    isAssetsMenuOpen,
    isBackdropSelectorOpen,
    isFileMenuOpen,
    isSpriteSelectorOpen,
    setIsAssetsMenuOpen,
    setIsBackdropSelectorOpen,
    setIsFileMenuOpen,
    setIsSpriteSelectorOpen,
    spriteSelectorRef,
  };
};

export default useTopbarMenus;
