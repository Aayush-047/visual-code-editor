import React from 'react';
import { Search, X } from 'lucide-react';
import AddedBadge from '../components/AddedBadge';
import { AssetCategoryDropdown } from '../primitives';
import { getBackdropCategory } from '../config';

const BackdropLibraryModal = ({
  isOpen,
  closeLibraries,
  backdropLibrarySearchRef,
  backdropLibrarySearch,
  setBackdropLibrarySearch,
  backdropLibrary,
  backdropCategoryFilter,
  setBackdropCategoryFilter,
  backdropCategoryOptions,
  availableBackdrops,
  backdropLibraryFilter,
  setBackdropLibraryFilter,
  openBackdropUploadPicker,
  filteredBackdropLibrary,
  handleAddBackdropToSession,
}) => {
  if (!isOpen) return null;

  return (
    <div id="backdrop-library" className="library-modal asset-modal" aria-hidden={!isOpen}>
      <div className="asset-modal-header library-header flex h-16 items-center justify-between border-b px-6">
        <div>
          <h1 className="asset-modal-title text-xl font-bold">Backdrop Library</h1>
          <p className="asset-modal-subtitle text-sm">Choose backdrops to add to the current session.</p>
        </div>
        <button type="button" onClick={closeLibraries} className="asset-modal-close rounded-full p-2 transition hover:bg-gray-200" aria-label="Close backdrop library">
          <X size={18} />
        </button>
      </div>
      <div className="h-full overflow-y-auto px-6 py-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input ref={backdropLibrarySearchRef} type="text" value={backdropLibrarySearch} onChange={(event) => setBackdropLibrarySearch(event.target.value)} placeholder={`Search ${backdropLibrary.length}+ backdrops…`} className="asset-search h-11 w-full rounded-xl border pl-10 pr-4 text-sm shadow-sm" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AssetCategoryDropdown value={backdropCategoryFilter} options={backdropCategoryOptions} onChange={setBackdropCategoryFilter} accentClassName="text-gray-700" menuActiveClassName="bg-emerald-100 font-semibold text-emerald-800" />
            {[
              { id: 'all', label: 'All', count: backdropLibrary.length },
              { id: 'added', label: 'Added', count: backdropLibrary.filter((libraryBackdrop) => availableBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id))).length },
              { id: 'not-added', label: 'Not Added', count: backdropLibrary.filter((libraryBackdrop) => !availableBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id)) ).length },
            ].map((filterOption) => (
              <button key={filterOption.id} type="button" onClick={() => setBackdropLibraryFilter(filterOption.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${backdropLibraryFilter === filterOption.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
                <span>{`${filterOption.label} ${filterOption.count}`}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          <button type="button" onClick={openBackdropUploadPicker} className="library-card upload-card rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-100" style={{ backgroundColor: 'rgba(16, 185, 129, 0.05)' }}>
            <div className="upload-placeholder mb-3 flex items-center justify-center rounded-xl bg-white/70 text-emerald-600">
              <span className="text-5xl font-light leading-none">+</span>
            </div>
            <div className="text-sm font-semibold text-emerald-900">Upload Local Backdrop</div>
            <div className="mt-1 text-xs text-emerald-700">Add an image from your machine to this session.</div>
          </button>
          {filteredBackdropLibrary.map((libraryBackdrop) => {
            const isAdded = availableBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id));
            return (
              <button key={libraryBackdrop.id} type="button" onClick={() => handleAddBackdropToSession(libraryBackdrop)} data-backdrop-id={libraryBackdrop.id} className={`library-card backdrop-card backdrop-thumb-hover overflow-hidden rounded-2xl border bg-white text-left shadow-sm hover:shadow-md ${isAdded ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-gray-200 hover:border-emerald-300'}`}>
                <div className="library-card-image backdrop-thumb-image w-full bg-gray-50 transition-transform duration-150 ease-out" data-is-white-bg={libraryBackdrop.id === 'white-space' ? 'true' : 'false'} style={{ backgroundImage: libraryBackdrop.url ? `url(${libraryBackdrop.url})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  {!libraryBackdrop.url && <span className="text-sm font-semibold text-gray-500">White Space</span>}
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{libraryBackdrop.name}</div>
                    <div className="text-xs text-gray-500">{isAdded ? 'Already in session' : 'Add to session'}</div>
                    <div className="mt-1 text-xs font-medium text-emerald-700">{getBackdropCategory(libraryBackdrop)}</div>
                  </div>
                  {isAdded && <AddedBadge color="green">✓ Added</AddedBadge>}
                </div>
              </button>
            );
          })}
        </div>
        {filteredBackdropLibrary.length === 0 && <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center text-sm text-gray-500">No backdrops match this search or filter.</div>}
      </div>
    </div>
  );
};

export default BackdropLibraryModal;
