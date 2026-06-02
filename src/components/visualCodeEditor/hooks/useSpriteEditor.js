import { useCallback, useEffect, useState } from 'react';
import { loadSvgMarkup, normalizeSvgMarkup } from '../config';

const useSpriteEditor = ({ selectedSprite, showToast, updateSpriteById }) => {
  const [spriteEditorMarkup, setSpriteEditorMarkup] = useState('');
  const [spriteEditorError, setSpriteEditorError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    if (!selectedSprite) {
      setSpriteEditorMarkup('');
      setSpriteEditorError('');
      return undefined;
    }

    if (selectedSprite.svgMarkup) {
      setSpriteEditorMarkup(selectedSprite.svgMarkup);
      setSpriteEditorError('');
      return undefined;
    }

    void loadSvgMarkup(selectedSprite.src)
      .then((markup) => {
        if (!isCancelled) {
          setSpriteEditorMarkup(markup);
          setSpriteEditorError('');
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setSpriteEditorMarkup('');
          setSpriteEditorError('Unable to load SVG source for this sprite.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSprite]);

  const handleApplySpriteMarkup = useCallback(
    (nextMarkup = spriteEditorMarkup) => {
      if (!selectedSprite) {
        return;
      }

      const trimmedMarkup = nextMarkup.trim();

      if (!trimmedMarkup || !/<svg[\s>]/i.test(trimmedMarkup)) {
        setSpriteEditorError('Enter valid SVG markup to update the sprite.');
        return;
      }

      const normalizedMarkup = normalizeSvgMarkup(trimmedMarkup);
      updateSpriteById(selectedSprite.id, (sprite) => ({
        ...sprite,
        svgMarkup: normalizedMarkup,
      }));
      setSpriteEditorMarkup(normalizedMarkup);
      setSpriteEditorError('');
      showToast(`${selectedSprite.name} sprite updated.`);
    },
    [selectedSprite, showToast, spriteEditorMarkup, updateSpriteById]
  );

  const handleResetSpriteMarkup = useCallback(() => {
    if (!selectedSprite) {
      return;
    }

    void loadSvgMarkup(selectedSprite.src)
      .then((markup) => {
        updateSpriteById(selectedSprite.id, (sprite) => ({
          ...sprite,
          svgMarkup: null,
        }));
        setSpriteEditorMarkup(markup);
        setSpriteEditorError('');
        showToast(`${selectedSprite.name} sprite reset.`);
      })
      .catch(() => {
        setSpriteEditorError('Unable to reload the original SVG source.');
      });
  }, [selectedSprite, showToast, updateSpriteById]);

  const handleSelectedSpriteSizeChange = useCallback(
    (nextSize) => {
      if (!selectedSprite) {
        return;
      }

      const normalizedSize = Math.max(10, Math.min(300, Number(nextSize) || 100));
      updateSpriteById(selectedSprite.id, (sprite) => ({
        ...sprite,
        spriteState: {
          ...sprite.spriteState,
          size: normalizedSize,
        },
      }));
    },
    [selectedSprite, updateSpriteById]
  );

  return {
    handleApplySpriteMarkup,
    handleResetSpriteMarkup,
    handleSelectedSpriteSizeChange,
    spriteEditorError,
    spriteEditorMarkup,
  };
};

export default useSpriteEditor;
