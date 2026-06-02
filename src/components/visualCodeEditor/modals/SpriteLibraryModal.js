import React from 'react';
import { Search, X } from 'lucide-react';
import AddedBadge from '../components/AddedBadge';
import SpriteGraphic from '../components/SpriteGraphic';
import Tooltip from '../components/Tooltip';
import { AssetCategoryDropdown } from '../primitives';
import { getSpriteCategory } from '../config';

const SpriteLibraryModal = ({
  isOpen,
  closeLibraries,
  spriteLibrarySearchRef,
  spriteLibrarySearch,
  setSpriteLibrarySearch,
  spriteLibrary,
  spriteCategoryFilter,
  setSpriteCategoryFilter,
  spriteCategoryOptions,
  sprites,
  spriteLibraryFilter,
  setSpriteLibraryFilter,
  openSpriteUploadPicker,
  filteredSpriteLibrary,
  handleAddSprite,
}) => {
  if (!isOpen) return null;

  return (
    <div id="sprite-library" className="library-modal asset-modal" aria-hidden={!isOpen}>
      <div className="asset-modal-header library-header flex h-16 items-center justify-between border-b px-6">
        <div>
          <h1 className="asset-modal-title text-xl font-bold">Sprite Library</h1>
          <p className="asset-modal-subtitle text-sm">Choose a sprite to add to your project.</p>
        </div>
        <button type="button" onClick={closeLibraries} className="asset-modal-close rounded-full p-2 transition hover:bg-gray-200" aria-label="Close sprite library">
          <X size={18} />
        </button>
      </div>
      <div className="h-full overflow-y-auto px-6 py-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input ref={spriteLibrarySearchRef} type="text" value={spriteLibrarySearch} onChange={(event) => setSpriteLibrarySearch(event.target.value)} placeholder={`Search ${spriteLibrary.length}+ sprites…`} className="asset-search h-11 w-full rounded-xl border pl-10 pr-4 text-sm shadow-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AssetCategoryDropdown value={spriteCategoryFilter} options={spriteCategoryOptions} onChange={setSpriteCategoryFilter} accentClassName="text-gray-700" menuActiveClassName="bg-sky-100 font-semibold text-sky-800" />
            {[
              { id: 'all', label: 'All', count: spriteLibrary.length },
              { id: 'added', label: 'Added', count: spriteLibrary.filter((librarySprite) => sprites.some((sprite) => sprite.libraryId === librarySprite.id || String(sprite.src || '') === String(librarySprite.src || ''))).length },
              { id: 'not-added', label: 'Not Added', count: spriteLibrary.filter((librarySprite) => !sprites.some((sprite) => sprite.libraryId === librarySprite.id || String(sprite.src || '') === String(librarySprite.src || ''))).length },
            ].map((filterOption) => (
              <button key={filterOption.id} type="button" onClick={() => setSpriteLibraryFilter(filterOption.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${spriteLibraryFilter === filterOption.id ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {`${filterOption.label} ${filterOption.count}`}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">
          <button type="button" onClick={openSpriteUploadPicker} className="library-card upload-card rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 p-4 text-left transition hover:border-sky-400 hover:bg-sky-100">
            <div className="upload-placeholder mb-3 flex items-center justify-center rounded-xl bg-white/70 text-sky-600">
              <span className="text-5xl font-light leading-none">+</span>
            </div>
            <div className="text-sm font-semibold text-sky-900">Upload Local Sprite</div>
            <div className="mt-1 text-xs text-sky-700">Convert artwork to SVG first, then upload it here.</div>
            <Tooltip content="Use an SVG export from Figma, Illustrator, or Inkscape. PNG and JPG won’t stay crisp as sprites." position="bottom">
              <span className="mt-3 inline-flex text-xs font-semibold text-sky-700 underline underline-offset-2">How to convert →</span>
            </Tooltip>
          </button>
          {filteredSpriteLibrary.map((librarySprite) => {
            const isAdded = sprites.some((sprite) => sprite.libraryId === librarySprite.id || String(sprite.src || '') === String(librarySprite.src || ''));
            return (
              <button key={librarySprite.id} type="button" onClick={() => handleAddSprite(librarySprite)} className="library-card sprite-thumb-hover sprite-card relative rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm hover:shadow-md" data-added={isAdded ? 'true' : 'false'}>
                {isAdded ? <AddedBadge color="green" className="absolute right-3 top-3">✓ Added</AddedBadge> : null}
                <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-gray-50">
                  <div className="sprite-thumb-image transition-transform duration-150 ease-out">
                    <SpriteGraphic src={librarySprite.src} color={librarySprite.color} width="96" height="96" className="block" />
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900">{librarySprite.name}</div>
                <div className="mt-1 text-xs font-medium text-sky-700">{getSpriteCategory(librarySprite)}</div>
              </button>
            );
          })}
        </div>
        {filteredSpriteLibrary.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">No sprites match this search or filter.</div>}
      </div>
    </div>
  );
};

export default SpriteLibraryModal;
