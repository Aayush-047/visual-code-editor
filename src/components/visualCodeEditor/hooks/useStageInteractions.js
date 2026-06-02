import { useCallback, useRef } from 'react';

const useStageInteractions = ({
  isRunning,
  spriteState,
  setSelectedSpriteState,
  onSpriteClick,
}) => {
  const previewRef = useRef(null);
  const spriteRef = useRef(null);
  const spriteDragRef = useRef({
    isDragging: false,
    hasMoved: false,
    offsetX: 0,
    offsetY: 0,
  });

  const getPointerSpritePosition = useCallback((event) => {
    const preview = previewRef.current;
    if (!preview) return null;

    const previewRect = preview.getBoundingClientRect();

    return {
      x: event.clientX - previewRect.left - previewRect.width / 2 - spriteDragRef.current.offsetX,
      y: event.clientY - previewRect.top - previewRect.height / 2 - spriteDragRef.current.offsetY,
    };
  }, []);

  const handleSpritePointerDown = useCallback(
    (event) => {
      if (isRunning || event.button > 0) return;

      const preview = previewRef.current;
      if (!preview) return;

      const previewRect = preview.getBoundingClientRect();
      spriteDragRef.current = {
        isDragging: true,
        hasMoved: false,
        offsetX: event.clientX - previewRect.left - previewRect.width / 2 - spriteState.x,
        offsetY: event.clientY - previewRect.top - previewRect.height / 2 - spriteState.y,
      };

      event.currentTarget.setPointerCapture(event.pointerId);
      event.preventDefault();
    },
    [isRunning, spriteState.x, spriteState.y]
  );

  const handleSpritePointerMove = useCallback(
    (event) => {
      if (!spriteDragRef.current.isDragging) return;

      const nextPosition = getPointerSpritePosition(event);
      if (!nextPosition) return;

      spriteDragRef.current.hasMoved = true;

      setSelectedSpriteState((prevState) => ({
        ...prevState,
        x: nextPosition.x,
        y: nextPosition.y,
      }));
    },
    [getPointerSpritePosition, setSelectedSpriteState]
  );

  const handleSpritePointerUp = useCallback((event) => {
    if (!spriteDragRef.current.isDragging) return;

    spriteDragRef.current.isDragging = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleSpriteClick = useCallback(() => {
    if (spriteDragRef.current.hasMoved) {
      spriteDragRef.current.hasMoved = false;
      return;
    }

    onSpriteClick();
  }, [onSpriteClick]);

  return {
    handleSpriteClick,
    handleSpritePointerDown,
    handleSpritePointerMove,
    handleSpritePointerUp,
    previewRef,
    spriteRef,
  };
};

export default useStageInteractions;
