import React from 'react';
import {
  ChevronDown,
  FileText,
  FolderOpen,
  HelpCircle,
  Image as ImageIcon,
  Link2,
  Moon,
  Save,
  Shapes,
  Sun,
  Upload,
} from 'lucide-react';
import SpriteGraphic from '../components/SpriteGraphic';
import { BackdropSwatch, FloatingDropdownMenu } from '../primitives';

const EditorNavbar = ({
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
}) => (
  <nav className="navbar grid h-16 flex-shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-sky-900/60 bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-800 px-4 shadow-sm">
    <div className="flex min-w-0 flex-wrap items-center gap-1 justify-self-start">
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
              <Shapes size={16} strokeWidth={1.5} className="current-color-icon text-orange-500" />
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
    </div>
    <div className="flex items-center justify-center">
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-sm backdrop-blur-sm">
        {selectedSprite && (
          <div ref={spriteSelectorRef} className="relative">
            <button type="button" onClick={() => { setIsBackdropSelectorOpen(false); setIsSpriteSelectorOpen((open) => !open); }} className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-orange-900 shadow-sm">
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center overflow-hidden">
                <SpriteGraphic src={selectedSprite.src} markup={selectedSprite.svgMarkup} color={selectedSprite.color} width="14" height="14" className="block" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-orange-700">Sprite</span>
              <span className="max-w-28 truncate text-sm font-semibold">{selectedSprite.name}</span>
              <ChevronDown size={14} className={`transition ${isSpriteSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            <FloatingDropdownMenu isOpen={isSpriteSelectorOpen} triggerRef={spriteSelectorRef} width={200}>
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
            <button type="button" onClick={() => { setIsSpriteSelectorOpen(false); setIsBackdropSelectorOpen((open) => !open); }} className="flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-emerald-900 shadow-sm">
              <BackdropSwatch backdrop={selectedBackdrop} />
              <span className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">Backdrop</span>
              <span className="max-w-28 truncate text-sm font-semibold">{selectedBackdrop.name}</span>
              <ChevronDown size={14} className={`transition ${isBackdropSelectorOpen ? 'rotate-180' : ''}`} />
            </button>
            <FloatingDropdownMenu isOpen={isBackdropSelectorOpen} triggerRef={backdropSelectorRef} width={220}>
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
    <div className="justify-self-end">
      <h1 className="text-xl font-bold tracking-tight text-white">Visual Code Editor</h1>
    </div>
  </nav>
);

export default EditorNavbar;
