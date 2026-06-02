import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BACKDROP_LIBRARY,
  DEFAULT_SOUNDS,
  INITIAL_SPRITE,
  SPRITE_LIBRARY,
  createSpriteInstance,
} from '../config';

const useProjectState = ({
  setActiveSidebarTab,
}) => {
  const sessionBackdropsRef = useRef([]);
  const [sounds, setSounds] = useState(DEFAULT_SOUNDS);
  const [soundVolume, setSoundVolume] = useState(100);
  const [backdropLibrary, setBackdropLibrary] = useState(BACKDROP_LIBRARY);
  const [stageState, setStageState] = useState(() => ({
    backdropId: BACKDROP_LIBRARY[0].id,
    backdrops: [BACKDROP_LIBRARY[0]],
  }));
  const [sprites, setSprites] = useState(() => [INITIAL_SPRITE]);
  const [selectedSpriteId, setSelectedSpriteId] = useState(INITIAL_SPRITE.id);

  const backdropValue = stageState.backdropId;
  const sessionBackdrops = stageState.backdrops;

  const setBackdropValue = useCallback((nextBackdropValue) => {
    setStageState((prevStageState) => ({
      ...prevStageState,
      backdropId:
        typeof nextBackdropValue === 'function'
          ? nextBackdropValue(prevStageState.backdropId)
          : nextBackdropValue,
    }));
  }, []);

  const setSessionBackdrops = useCallback((nextBackdrops) => {
    setStageState((prevStageState) => ({
      ...prevStageState,
      backdrops:
        typeof nextBackdrops === 'function'
          ? nextBackdrops(prevStageState.backdrops)
          : nextBackdrops,
    }));
  }, []);

  const buildProjectState = useCallback(
    ({
      sidebarBlocks,
      variableNames,
      listNames,
      variableValues,
      listValues,
    }) => ({
      sprites,
      sidebarBlocks,
      variableNames,
      listNames,
      variableValues,
      listValues,
      stageState,
      backdropValue,
      sessionBackdrops,
      sounds,
      soundVolume,
      selectedSpriteId,
    }),
    [
      backdropValue,
      selectedSpriteId,
      sessionBackdrops,
      soundVolume,
      sounds,
      sprites,
      stageState,
    ]
  );

  const buildShareProjectState = useCallback(
    (state) => ({
      format: 'visual-code-editor-share',
      version: 2,
      state,
    }),
    []
  );

  const hydrateProjectState = useCallback(
    (
      state = {},
      {
        setSidebarBlocks,
        setVariableNames,
        setListNames,
        setVariableValues,
        setListValues,
      }
    ) => {
      const nextSprites =
        Array.isArray(state.sprites) && state.sprites.length > 0
          ? state.sprites.map((sprite) => ({
              ...sprite,
              src:
                sprite.src ||
                SPRITE_LIBRARY.find((librarySprite) => librarySprite.id === sprite.libraryId)?.src ||
                SPRITE_LIBRARY[0].src,
              color: sprite.color || SPRITE_LIBRARY[0].color,
              svgMarkup: sprite.svgMarkup || null,
              spriteState: {
                x: sprite.spriteState?.x ?? 0,
                y: sprite.spriteState?.y ?? 0,
                rotation: sprite.spriteState?.rotation ?? -90,
                size: sprite.spriteState?.size ?? 100,
                visible: sprite.spriteState?.visible ?? true,
              },
              speechBubble: sprite.speechBubble || { message: '', isThinking: false },
              blocks: Array.isArray(sprite.blocks) ? sprite.blocks : [],
            }))
          : [
              {
                ...createSpriteInstance(SPRITE_LIBRARY[0]),
                blocks: Array.isArray(state.blocks) ? state.blocks : [],
                spriteState: {
                  x: state.spriteState?.x ?? 0,
                  y: state.spriteState?.y ?? 0,
                  rotation: state.spriteState?.rotation ?? -90,
                  size: state.spriteState?.size ?? 100,
                  visible: state.spriteState?.visible ?? true,
                },
                color: state.spriteColor || SPRITE_LIBRARY[0].color,
                svgMarkup: state.svgMarkup || null,
              },
            ];

      setSprites(nextSprites);
      const nextStageBackdrops =
        Array.isArray(state.stageState?.backdrops) && state.stageState.backdrops.length > 0
          ? state.stageState.backdrops
          : Array.isArray(state.sessionBackdrops) && state.sessionBackdrops.length > 0
            ? state.sessionBackdrops
            : [
                BACKDROP_LIBRARY[0],
                ...(Array.isArray(state.uploadedBackdrops) ? state.uploadedBackdrops : []),
              ];
      const nextStageBackdropId = nextStageBackdrops.some(
        (backdrop) =>
          String(backdrop.id) ===
          String(state.stageState?.backdropId ?? state.backdropValue ?? BACKDROP_LIBRARY[0].id)
      )
        ? String(state.stageState?.backdropId ?? state.backdropValue ?? BACKDROP_LIBRARY[0].id)
        : String(nextStageBackdrops[0]?.id ?? BACKDROP_LIBRARY[0].id);

      setStageState({
        backdropId: nextStageBackdropId,
        backdrops: nextStageBackdrops,
      });
      setSounds(Array.isArray(state.sounds) ? state.sounds : DEFAULT_SOUNDS);
      setSoundVolume(state.soundVolume ?? 100);
      setSelectedSpriteId(state.selectedSpriteId || nextSprites[0]?.id || '');
      setActiveSidebarTab('blocks');
    },
    [setActiveSidebarTab]
  );

  useEffect(() => {
    sessionBackdropsRef.current = sessionBackdrops.filter(
      (backdrop) => backdrop.type === 'uploaded'
    );
  }, [sessionBackdrops]);

  useEffect(() => {
    return () => {
      sessionBackdropsRef.current.forEach((backdrop) => {
        if (backdrop.type === 'uploaded' && String(backdrop.url).startsWith('blob:')) {
          URL.revokeObjectURL(backdrop.url);
        }
      });
    };
  }, []);

  useEffect(() => {
    const hasUnsavedChanges =
      sprites.some((sprite) => (sprite.blocks || []).length > 0) ||
      sessionBackdrops.length > 1 ||
      sounds.some(({ type }) => type === 'recorded');

    if (!hasUnsavedChanges) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionBackdrops.length, sounds, sprites]);

  return {
    backdropLibrary,
    backdropValue,
    buildProjectState,
    buildShareProjectState,
    hydrateProjectState,
    selectedSpriteId,
    sessionBackdrops,
    setBackdropLibrary,
    setBackdropValue,
    setSelectedSpriteId,
    setSessionBackdrops,
    setSoundVolume,
    setSounds,
    setSprites,
    soundVolume,
    sounds,
    sprites,
  };
};

export default useProjectState;
