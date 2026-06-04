import React, { useEffect, useState } from 'react';
import {
  Cat,
  ChevronDown,
  FileText,
  FlipHorizontal2,
  FlipVertical2,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  Menu,
  Moon,
  Pencil,
  RotateCcw,
  Save,
  Sun,
  Upload,
} from 'lucide-react';
import SpriteGraphic from '../components/SpriteGraphic';
import { BackdropSwatch, FloatingDropdownMenu, MobileBottomSheet } from '../primitives';
import { loadSvgMarkup, normalizeSvgMarkup } from '../config';
import { updateRootFlip } from '../utils/spriteMarkup';

const EditorNavbar = ({
  isMobile = false,
  fileMenuRef,
  assetsMenuRef,
  spriteSelectorRef,
  backdropSelectorRef,
  isFileMenuOpen,
  setIsFileMenuOpen,
  isAssetsMenuOpen,
  setIsAssetsMenuOpen,
  isSpriteSelectorOpen,
  setIsSpriteSelectorOpen,
  isBackdropSelectorOpen,
  setIsBackdropSelectorOpen,
  isProjectSaving,
  isProjectLoading,
  handleSaveProject,
  handleLoadProject,
  restartTutorial,
  openSpriteLibrary,
  openBackdropLibrary,
  handleShareProject,
  isDarkMode,
  setIsDarkMode,
  selectedSprite,
  sprites,
  selectedSpriteId,
  setSelectedSpriteId,
  selectedBackdrop,
  availableBackdrops,
  backdropValue,
  handleSelectBackdrop,
  updateSpriteById,
  showToast,
}) => {
  const [mobilePicker, setMobilePicker] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingSpriteId, setEditingSpriteId] = useState('');

  useEffect(() => {
    if (mobilePicker) {
      setIsMobileMenuOpen(false);
    }
  }, [mobilePicker]);

  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
      setMobilePicker(null);
    }
  }, [isMobile]);

  useEffect(() => {
    if (mobilePicker !== 'sprite') {
      setEditingSpriteId('');
    }
  }, [mobilePicker]);

  const handleFlipSprite = async (sprite, axis) => {
    try {
      const sourceMarkup = sprite.svgMarkup || await loadSvgMarkup(sprite.src);
      const flippedMarkup = normalizeSvgMarkup(updateRootFlip(sourceMarkup, axis));

      updateSpriteById?.(sprite.id, (currentSprite) => ({
        ...currentSprite,
        svgMarkup: flippedMarkup,
      }));
      showToast?.(`${sprite.name} flipped ${axis.toUpperCase()}.`);
    } catch (error) {
      showToast?.(error.message || 'Unable to flip this sprite.', 'error');
    }
  };

  const handleResetSprite = (sprite) => {
    updateSpriteById?.(sprite.id, (currentSprite) => ({
      ...currentSprite,
      svgMarkup: null,
    }));
    showToast?.(`${sprite.name} sprite reset.`);
  };

  const handleSpriteSizeChange = (sprite, nextSize) => {
    const normalizedSize = Math.max(10, Math.min(300, Number(nextSize) || 100));

    updateSpriteById?.(sprite.id, (currentSprite) => ({
      ...currentSprite,
      spriteState: {
        ...currentSprite.spriteState,
        size: normalizedSize,
      },
    }));
  };

  return (
  <nav className="navbar grid flex-shrink-0 grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-sky-900/60 bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 px-3 py-2 shadow-sm lg:h-16 lg:grid-cols-[1fr_auto_1fr] lg:gap-0 lg:px-4 lg:py-0">
    <div className={`${isMobile ? 'w-10 min-w-10 flex-none' : ''} flex min-w-0 flex-wrap items-center gap-1 justify-self-start`}>
      {isMobile ? (
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          className="mobile-navbar-menu-btn topbar-action flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} className="current-color-icon" />
        </button>
      ) : null}
      {!isMobile ? (
        <>
      <div ref={fileMenuRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setIsAssetsMenuOpen(false);
            setIsFileMenuOpen((open) => !open);
          }}
          className="navbar-file-btn topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
          aria-expanded={isFileMenuOpen}
          aria-haspopup="menu"
        >
          <FileText size={16} strokeWidth={1.5} className="current-color-icon" />
          File
          <ChevronDown size={14} className={`transition ${isFileMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {isFileMenuOpen && (
          <div className="absolute left-0 top-12 z-20 w-52 rounded-xl border border-sky-900/20 bg-white py-1.5 text-sm shadow-lg">
            <button type="button" onClick={() => { setIsFileMenuOpen(false); void handleSaveProject(); }} disabled={isProjectSaving} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50 ${isProjectSaving ? 'cursor-not-allowed opacity-50' : ''}`}>
              <Save size={16} strokeWidth={1.5} className="current-color-icon text-blue-600" />
              Save Project
            </button>
            <button type="button" onClick={() => { setIsFileMenuOpen(false); handleLoadProject(); }} disabled={isProjectLoading} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50 ${isProjectLoading ? 'cursor-not-allowed opacity-50' : ''}`}>
              <Upload size={16} strokeWidth={1.5} className="current-color-icon text-blue-600" />
              Load Project
            </button>
            <button type="button" onClick={() => { setIsFileMenuOpen(false); restartTutorial(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50">
              <HelpCircle size={16} strokeWidth={1.5} className="current-color-icon text-blue-600" />
              Restart Tutorial
            </button>
          </div>
        )}
      </div>
      <div ref={assetsMenuRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setIsFileMenuOpen(false);
            setIsAssetsMenuOpen((open) => !open);
          }}
          className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white"
          aria-expanded={isAssetsMenuOpen}
          aria-haspopup="menu"
        >
          <FolderOpen size={16} strokeWidth={1.5} className="current-color-icon" />
          Assets
          <ChevronDown size={14} className={`transition ${isAssetsMenuOpen ? 'rotate-180' : ''}`} />
        </button>
        {isAssetsMenuOpen && (
          <div className="absolute left-0 top-12 z-20 w-56 rounded-xl border border-sky-900/20 bg-white py-1.5 text-sm shadow-lg">
            <button type="button" onClick={() => { setIsAssetsMenuOpen(false); openSpriteLibrary(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50">
              <Cat size={16} strokeWidth={1.5} className="current-color-icon text-orange-500" />
              Sprite Library
            </button>
            <button type="button" onClick={() => { setIsAssetsMenuOpen(false); openBackdropLibrary(); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-800 hover:bg-blue-50">
              <ImageIcon size={16} strokeWidth={1.5} className="current-color-icon text-emerald-600" />
              Backdrop Library
            </button>
          </div>
        )}
      </div>
      <button type="button" onClick={() => { setIsFileMenuOpen(false); setIsAssetsMenuOpen(false); void handleShareProject(); }} className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white">
        <Link2 size={16} strokeWidth={1.5} className="current-color-icon" />
        Share
      </button>
      <button type="button" onClick={() => setIsDarkMode((current) => !current)} className="topbar-action flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition hover:bg-white/10 hover:text-white">
        {isDarkMode ? <Sun size={16} strokeWidth={1.5} className="current-color-icon" /> : <Moon size={16} strokeWidth={1.5} className="current-color-icon" />}
        {isDarkMode ? 'Light' : 'Dark'}
      </button>
        </>
      ) : null}
    </div>
    <div className={`${isMobile ? 'hidden' : 'order-3 flex items-center justify-start lg:order-none lg:justify-center'}`}>
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        {selectedSprite && (
          <div ref={spriteSelectorRef} className="relative">
            <button type="button" onClick={() => { if (isMobile) { setMobilePicker('sprite'); return; } setIsBackdropSelectorOpen(false); setIsSpriteSelectorOpen((open) => !open); }} className="flex min-h-[38px] items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-orange-900 shadow-sm">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden">
                <SpriteGraphic src={selectedSprite.src} markup={selectedSprite.svgMarkup} color={selectedSprite.color} width="14" height="14" className="block" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Sprite</span>
              <span className="max-w-28 truncate text-sm font-semibold">{selectedSprite.name}</span>
              <ChevronDown size={14} className={`transition ${isSpriteSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            <FloatingDropdownMenu isOpen={!isMobile && isSpriteSelectorOpen} triggerRef={spriteSelectorRef} width={200}>
              {sprites.map((sprite) => (
                <button key={sprite.id} type="button" onClick={() => { setSelectedSpriteId(sprite.id); setIsSpriteSelectorOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-orange-50 ${selectedSpriteId === sprite.id ? 'bg-orange-100 font-semibold text-orange-800' : 'text-gray-800'}`}>
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden">
                    <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} width="14" height="14" className="block" />
                  </div>
                  <span className="truncate">{sprite.name}</span>
                </button>
              ))}
            </FloatingDropdownMenu>
          </div>
        )}
        {selectedBackdrop && (
          <div ref={backdropSelectorRef} className="relative">
            <button type="button" onClick={() => { if (isMobile) { setMobilePicker('backdrop'); return; } setIsSpriteSelectorOpen(false); setIsBackdropSelectorOpen((open) => !open); }} className="flex min-h-[38px] items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-emerald-900 shadow-sm">
              <BackdropSwatch backdrop={selectedBackdrop} />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Backdrop</span>
              <span className="max-w-28 truncate text-sm font-semibold">{selectedBackdrop.name}</span>
              <ChevronDown size={14} className={`transition ${isBackdropSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            <FloatingDropdownMenu isOpen={!isMobile && isBackdropSelectorOpen} triggerRef={backdropSelectorRef} width={220}>
              {availableBackdrops.map((backdrop) => (
                <button key={backdrop.id} type="button" onClick={() => { handleSelectBackdrop(backdrop.id); setIsBackdropSelectorOpen(false); }} className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-emerald-50 ${String(backdrop.id) === String(backdropValue) ? 'bg-emerald-100 font-semibold text-emerald-800' : 'text-gray-800'}`}>
                  <BackdropSwatch backdrop={backdrop} />
                  <span className="truncate">{backdrop.name}</span>
                </button>
              ))}
            </FloatingDropdownMenu>
          </div>
        )}
      </div>
    </div>
    <div className="order-1 justify-self-center lg:order-none lg:justify-self-end">
      <h1 className="text-base font-bold tracking-tight text-white lg:text-xl">Visual Code Editor</h1>
    </div>
    <div className="h-10 w-10 justify-self-end lg:hidden" />
    <MobileBottomSheet
      isOpen={isMobileMenuOpen}
      title="Menu"
      onClose={() => setIsMobileMenuOpen(false)}
      variant="drawer"
      overlayClassName="top-[72px]"
      showHandle={false}
    >
      <div className="space-y-2">
        {selectedSprite ? (
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setMobilePicker('sprite');
            }}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <SpriteGraphic src={selectedSprite.src} markup={selectedSprite.svgMarkup} color={selectedSprite.color} width="20" height="20" className="block" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Active Sprite</div>
              <div className="truncate font-semibold">{selectedSprite.name}</div>
            </div>
          </button>
        ) : null}
        {selectedBackdrop ? (
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              setMobilePicker('backdrop');
            }}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
          >
            <BackdropSwatch backdrop={selectedBackdrop} className="h-8 w-8 rounded-lg" />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Active Backdrop</div>
              <div className="truncate font-semibold">{selectedBackdrop.name}</div>
            </div>
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            void handleSaveProject();
          }}
          disabled={isProjectSaving}
          className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)] ${isProjectSaving ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Save size={18} strokeWidth={1.5} className="current-color-icon text-blue-600" />
          <span className="font-semibold">Save Project</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            handleLoadProject();
          }}
          disabled={isProjectLoading}
          className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)] ${isProjectLoading ? 'cursor-not-allowed opacity-50' : ''}`}
        >
          <Upload size={18} strokeWidth={1.5} className="current-color-icon text-blue-600" />
          <span className="font-semibold">Load Project</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            openSpriteLibrary();
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
        >
          <Cat size={18} strokeWidth={1.5} className="current-color-icon text-orange-500" />
          <span className="font-semibold">Sprite Library</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            openBackdropLibrary();
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
        >
          <ImageIcon size={18} strokeWidth={1.5} className="current-color-icon text-emerald-600" />
          <span className="font-semibold">Backdrop Library</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            void handleShareProject();
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
        >
          <Link2 size={18} strokeWidth={1.5} className="current-color-icon text-sky-600" />
          <span className="font-semibold">Share</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            setIsDarkMode((current) => !current);
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
        >
          {isDarkMode ? (
            <Sun size={18} strokeWidth={1.5} className="current-color-icon text-amber-500" />
          ) : (
            <Moon size={18} strokeWidth={1.5} className="current-color-icon text-indigo-500" />
          )}
          <span className="font-semibold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            restartTutorial();
          }}
          className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl border border-[var(--panel-border)] bg-[var(--surface-modal-soft)] px-4 py-3 text-left text-[var(--text-primary)]"
        >
          <HelpCircle size={18} strokeWidth={1.5} className="current-color-icon text-blue-600" />
          <span className="font-semibold">Restart Tutorial</span>
        </button>
      </div>
    </MobileBottomSheet>
    <MobileBottomSheet
      isOpen={mobilePicker === 'sprite'}
      title="Choose Sprite"
      onClose={() => setMobilePicker(null)}
    >
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {sprites.map((sprite) => {
          const isEditing = editingSpriteId === sprite.id;
          const spriteSize = sprite.spriteState?.size ?? 100;

          return (
            <div
              key={sprite.id}
              className={`rounded-2xl border ${
                selectedSpriteId === sprite.id
                  ? 'border-orange-400 bg-orange-50 text-orange-900'
                  : 'border-[var(--panel-border)] bg-[var(--surface-modal-soft)] text-[var(--text-primary)]'
              }`}
            >
              <div className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSpriteId(sprite.id);
                    setMobilePicker(null);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                    <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} width="20" height="20" className="block" />
                  </div>
                  <span className="truncate font-semibold">{sprite.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSpriteId((currentId) => (currentId === sprite.id ? '' : sprite.id))}
                  className="flex min-h-[36px] flex-shrink-0 items-center rounded-full border border-orange-200 bg-white px-3 text-sm font-semibold text-orange-700"
                  aria-expanded={isEditing}
                  aria-label={`Edit ${sprite.name}`}
                >
                  <Pencil size={15} />
                </button>
              </div>
              {isEditing ? (
                <div className="border-t border-[var(--panel-border)] px-4 pb-4 pt-3">
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFlipSprite(sprite, 'x')}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[var(--panel-border)] bg-white px-2 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      <FlipHorizontal2 size={14} />
                      Flip X
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFlipSprite(sprite, 'y')}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[var(--panel-border)] bg-white px-2 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      <FlipVertical2 size={14} />
                      Flip Y
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResetSprite(sprite)}
                      className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[var(--panel-border)] bg-white px-2 text-sm font-semibold text-[var(--text-primary)]"
                    >
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  </div>
                  <div className="mt-3 rounded-xl bg-white px-3 py-3">
                    <div className="mb-2 flex items-center justify-between text-sm font-semibold text-gray-800">
                      <span>Size</span>
                      <span>{spriteSize}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="1"
                      value={spriteSize}
                      onChange={(event) => handleSpriteSizeChange(sprite, event.target.value)}
                      className="w-full"
                    />
                    <input
                      type="number"
                      min="10"
                      max="300"
                      step="1"
                      value={spriteSize}
                      onChange={(event) => handleSpriteSizeChange(sprite, event.target.value)}
                      className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </MobileBottomSheet>
    <MobileBottomSheet
      isOpen={mobilePicker === 'backdrop'}
      title="Choose Backdrop"
      onClose={() => setMobilePicker(null)}
    >
      <div className="max-h-[50vh] space-y-2 overflow-y-auto">
        {availableBackdrops.map((backdrop) => (
          <button
            key={backdrop.id}
            type="button"
            onClick={() => {
              handleSelectBackdrop(backdrop.id);
              setMobilePicker(null);
            }}
            className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
              String(backdrop.id) === String(backdropValue)
                ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                : 'border-[var(--panel-border)] bg-[var(--surface-modal-soft)] text-[var(--text-primary)]'
            }`}
          >
            <BackdropSwatch backdrop={backdrop} className="h-8 w-8 rounded-lg" />
            <span className="truncate font-semibold">{backdrop.name}</span>
          </button>
        ))}
      </div>
    </MobileBottomSheet>
  </nav>
  );
};

export default EditorNavbar;
