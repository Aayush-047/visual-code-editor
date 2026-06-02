import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BACKDROP_LIBRARY,
  SPRITE_LIBRARY,
  createSpriteInstance,
  getBackdropCategory,
  getSpriteCategory,
} from '../config';

const useAssetLibraries = ({
  availableBackdrops,
  backdropLibrary,
  setActiveSidebarTab,
  setBackdropLibrary,
  setBackdropValue,
  setSessionBackdrops,
  spriteLibrary,
  setSpriteLibrary,
  setSprites,
  setSelectedSpriteId,
  showToast,
  sprites,
}) => {
  const spriteLibrarySearchRef = useRef(null);
  const backdropLibrarySearchRef = useRef(null);
  const spriteFileInputRef = useRef(null);
  const backdropFileInputRef = useRef(null);
  const pendingBackdropChangeRef = useRef(null);

  const [isSpriteLibraryOpen, setIsSpriteLibraryOpen] = useState(false);
  const [isBackdropLibraryOpen, setIsBackdropLibraryOpen] = useState(false);
  const [spriteLibrarySearch, setSpriteLibrarySearch] = useState('');
  const [spriteLibraryFilter, setSpriteLibraryFilter] = useState('all');
  const [spriteCategoryFilter, setSpriteCategoryFilter] = useState('all');
  const [backdropLibrarySearch, setBackdropLibrarySearch] = useState('');
  const [backdropLibraryFilter, setBackdropLibraryFilter] = useState('all');
  const [backdropCategoryFilter, setBackdropCategoryFilter] = useState('all');

  const computedFilteredSpriteLibrary = useMemo(
    () =>
      spriteLibrary.filter((librarySprite) => {
        const matchesSearch = librarySprite.name
          .toLowerCase()
          .includes(spriteLibrarySearch.trim().toLowerCase());
        const matchesCategory =
          spriteCategoryFilter === 'all' ||
          getSpriteCategory(librarySprite) === spriteCategoryFilter;
        const isAdded = sprites.some(
          (sprite) =>
            sprite.libraryId === librarySprite.id ||
            String(sprite.src || '') === String(librarySprite.src || '')
        );

        if (spriteLibraryFilter === 'added') {
          return matchesSearch && matchesCategory && isAdded;
        }

        if (spriteLibraryFilter === 'not-added') {
          return matchesSearch && matchesCategory && !isAdded;
        }

        return matchesSearch && matchesCategory;
      }),
    [spriteCategoryFilter, spriteLibrary, spriteLibraryFilter, spriteLibrarySearch, sprites]
  );

  const spriteCategoryOptions = useMemo(
    () => ['all', ...Array.from(new Set(spriteLibrary.map(getSpriteCategory))).sort()],
    [spriteLibrary]
  );

  const filteredBackdropLibrary = useMemo(
    () =>
      backdropLibrary.filter((libraryBackdrop) => {
        const matchesSearch = libraryBackdrop.name
          .toLowerCase()
          .includes(backdropLibrarySearch.trim().toLowerCase());
        const matchesCategory =
          backdropCategoryFilter === 'all' ||
          getBackdropCategory(libraryBackdrop) === backdropCategoryFilter;
        const isAdded = availableBackdrops.some(
          (backdrop) => String(backdrop.id) === String(libraryBackdrop.id)
        );

        if (backdropLibraryFilter === 'added') {
          return matchesSearch && matchesCategory && isAdded;
        }

        if (backdropLibraryFilter === 'not-added') {
          return matchesSearch && matchesCategory && !isAdded;
        }

        return matchesSearch && matchesCategory;
      }),
    [
      availableBackdrops,
      backdropCategoryFilter,
      backdropLibrary,
      backdropLibraryFilter,
      backdropLibrarySearch,
    ]
  );

  const backdropCategoryOptions = useMemo(
    () => ['all', ...Array.from(new Set(backdropLibrary.map(getBackdropCategory))).sort()],
    [backdropLibrary]
  );

  const handleAddSprite = useCallback(
    (librarySprite) => {
      const nextSprite = createSpriteInstance(librarySprite);
      setSprites((prevSprites) => [...prevSprites, nextSprite]);
      setSelectedSpriteId(nextSprite.id);
      setActiveSidebarTab('sprite');
      setIsSpriteLibraryOpen(false);
      setIsBackdropLibraryOpen(false);
      showToast(`${librarySprite.name} added.`);
    },
    [setActiveSidebarTab, setSelectedSpriteId, setSprites, showToast]
  );

  const openSpriteLibrary = useCallback(() => {
    setIsBackdropLibraryOpen(false);
    setIsSpriteLibraryOpen(true);
  }, []);

  const openBackdropLibrary = useCallback(() => {
    setIsSpriteLibraryOpen(false);
    setIsBackdropLibraryOpen(true);
  }, []);

  const closeLibraries = useCallback(() => {
    setIsSpriteLibraryOpen(false);
    setIsBackdropLibraryOpen(false);
  }, []);

  const openSpriteUploadPicker = useCallback(() => {
    spriteFileInputRef.current?.click();
  }, []);

  const openBackdropUploadPicker = useCallback(() => {
    backdropFileInputRef.current?.click();
  }, []);

  const handleSpriteUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) return;

      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');

      if (!isSvg) {
        showToast('Upload an SVG sprite file. Raster screenshots are not supported here.');
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const spriteSrc = typeof reader.result === 'string' ? reader.result : '';

        if (!spriteSrc) {
          showToast('Unable to read that sprite file.');
          return;
        }

        const uploadedSprite = {
          id: `uploaded-sprite-${Date.now()}`,
          name: file.name.replace(/\.[^.]+$/, '') || 'Uploaded Sprite',
          src: spriteSrc,
          color: '#FFAB19',
          type: 'uploaded',
        };

        setSpriteLibrary((prevSprites) => [...prevSprites, uploadedSprite]);
        handleAddSprite(uploadedSprite);
      };

      reader.onerror = () => {
        showToast('Unable to read that sprite file.');
      };

      reader.readAsDataURL(file);
    },
    [handleAddSprite, setSpriteLibrary, showToast]
  );

  const handleRemoveSprite = useCallback(
    (spriteId) => {
      setSprites((prevSprites) => {
        if (prevSprites.length <= 1) {
          showToast('Keep at least one sprite in the project.');
          return prevSprites;
        }

        return prevSprites.filter((sprite) => sprite.id !== spriteId);
      });
    },
    [setSprites, showToast]
  );

  const handleSelectBackdrop = useCallback(
    (nextBackdropId) => {
      setBackdropValue(String(nextBackdropId));
      setActiveSidebarTab('backdrops');
      showToast('Initial backdrop updated.');
    },
    [setActiveSidebarTab, setBackdropValue, showToast]
  );

  const handleAddBackdropToSession = useCallback(
    (libraryBackdrop) => {
      setSessionBackdrops((prevBackdrops) => {
        if (prevBackdrops.some((backdrop) => String(backdrop.id) === String(libraryBackdrop.id))) {
          return prevBackdrops;
        }

        return [...prevBackdrops, libraryBackdrop];
      });
      showToast(`${libraryBackdrop.name} added to session backdrops.`);
    },
    [setSessionBackdrops, showToast]
  );

  const handleBackdropMenuAction = useCallback((id, action, onChange) => {
    pendingBackdropChangeRef.current = { id, action, onChange };
    backdropFileInputRef.current?.click();
  }, []);

  const handleBackdropUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';

      if (!file) return;

      if (!file.type.startsWith('image/')) {
        window.alert('Please upload an image file.');
        return;
      }

      const pendingChange = pendingBackdropChangeRef.current;
      const reader = new FileReader();

      reader.onload = () => {
        const uploadedBackdrop = {
          id: `uploaded-backdrop-${Date.now()}`,
          name: file.name || 'Uploaded image',
          type: 'uploaded',
          url: reader.result,
        };

        setBackdropLibrary((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);
        setSessionBackdrops((prevBackdrops) => [...prevBackdrops, uploadedBackdrop]);

        if (pendingChange) {
          pendingChange.onChange(pendingChange.id, pendingChange.action, uploadedBackdrop.id);
          pendingBackdropChangeRef.current = null;
        }
      };

      reader.readAsDataURL(file);
    },
    [setBackdropLibrary, setSessionBackdrops]
  );

  useEffect(() => {
    let isCancelled = false;

    void fetch('/data/sprites.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load sprite library.');
        }

        return response.json();
      })
      .then((librarySprites) => {
        if (!isCancelled && Array.isArray(librarySprites) && librarySprites.length > 0) {
          setSpriteLibrary(librarySprites);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSpriteLibrary(SPRITE_LIBRARY);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setSpriteLibrary]);

  useEffect(() => {
    let isCancelled = false;

    void fetch('/data/backdrops.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load backdrop library.');
        }

        return response.json();
      })
      .then((libraryBackdrops) => {
        if (!isCancelled && Array.isArray(libraryBackdrops) && libraryBackdrops.length > 0) {
          setBackdropLibrary(libraryBackdrops);
          setSessionBackdrops((prevBackdrops) => {
            const hasOnlyFallbackBackdrop =
              prevBackdrops.length === 1 &&
              String(prevBackdrops[0]?.id) === String(BACKDROP_LIBRARY[0].id);
            return hasOnlyFallbackBackdrop ? [libraryBackdrops[0]] : prevBackdrops;
          });
          setBackdropValue((prevBackdropValue) =>
            prevBackdropValue === BACKDROP_LIBRARY[0].id && libraryBackdrops[0]?.id
              ? String(libraryBackdrops[0].id)
              : prevBackdropValue
          );
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setBackdropLibrary(BACKDROP_LIBRARY);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [setBackdropLibrary, setBackdropValue, setSessionBackdrops]);

  useEffect(() => {
    if (isSpriteLibraryOpen) {
      window.setTimeout(() => spriteLibrarySearchRef.current?.focus(), 0);
    }
  }, [isSpriteLibraryOpen]);

  useEffect(() => {
    if (isBackdropLibraryOpen) {
      window.setTimeout(() => backdropLibrarySearchRef.current?.focus(), 0);
    }
  }, [isBackdropLibraryOpen]);

  useEffect(() => {
    document.body.style.overflow = isSpriteLibraryOpen || isBackdropLibraryOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isBackdropLibraryOpen, isSpriteLibraryOpen]);

  return {
    backdropCategoryFilter,
    backdropCategoryOptions,
    backdropFileInputRef,
    backdropLibraryFilter,
    backdropLibrarySearch,
    backdropLibrarySearchRef,
    closeLibraries,
    filteredBackdropLibrary,
    filteredSpriteLibrary: computedFilteredSpriteLibrary,
    handleAddBackdropToSession,
    handleAddSprite,
    handleBackdropMenuAction,
    handleBackdropUpload,
    handleRemoveSprite,
    handleSelectBackdrop,
    handleSpriteUpload,
    isBackdropLibraryOpen,
    isSpriteLibraryOpen,
    openBackdropLibrary,
    openBackdropUploadPicker,
    openSpriteLibrary,
    openSpriteUploadPicker,
    setBackdropCategoryFilter,
    setBackdropLibraryFilter,
    setBackdropLibrarySearch,
    setIsBackdropLibraryOpen,
    setIsSpriteLibraryOpen,
    setSpriteCategoryFilter,
    setSpriteLibraryFilter,
    setSpriteLibrarySearch,
    spriteCategoryFilter,
    spriteCategoryOptions,
    spriteFileInputRef,
    spriteLibraryFilter,
    spriteLibrarySearch,
    spriteLibrarySearchRef,
  };
};

export default useAssetLibraries;
