import React from 'react';
import SpeechBubble from '../components/SpeechBubble';
import SpriteGraphic from '../components/SpriteGraphic';
import { EDITOR_PANEL_HEIGHT } from '../config';

const StagePreview = ({
  previewRef,
  spriteRef,
  sprites,
  selectedSpriteId,
  selectedBackdrop,
  onSpritePointerDown,
  onSpritePointerMove,
  onSpritePointerUp,
  onSpriteClick,
  isInteractive = true,
  isMobile = false,
  mobileSpriteScale = 0.5,
  panelHeight = EDITOR_PANEL_HEIGHT,
  className = 'border p-4 relative overflow-x-auto overflow-y-auto',
}) => (
  <div
    ref={previewRef}
    className={className}
    style={{
      height: panelHeight,
      minHeight: panelHeight,
      backgroundColor: selectedBackdrop?.url ? undefined : 'white',
      backgroundImage: selectedBackdrop?.url ? `url(${selectedBackdrop.url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {sprites.map((sprite) => {
      const isSelectedSprite = sprite.id === selectedSpriteId;
      const spriteScale = (sprite.spriteState.size / 100) * (isMobile ? mobileSpriteScale : 1);

      return (
        <div
          key={sprite.id}
          ref={isSelectedSprite ? spriteRef : null}
          className={`absolute left-1/2 top-1/2 transition-all duration-300 select-none ${
            isInteractive && isSelectedSprite ? 'cursor-grab active:cursor-grabbing' : ''
          }`}
          onPointerDown={isInteractive && isSelectedSprite ? onSpritePointerDown : undefined}
          onPointerMove={isInteractive && isSelectedSprite ? onSpritePointerMove : undefined}
          onPointerUp={isInteractive && isSelectedSprite ? onSpritePointerUp : undefined}
          onPointerCancel={isInteractive && isSelectedSprite ? onSpritePointerUp : undefined}
          onClick={isInteractive && isSelectedSprite ? onSpriteClick : undefined}
          style={{
            touchAction: isSelectedSprite ? 'none' : 'auto',
            transform: `translate(calc(-50% + ${sprite.spriteState.x}px), calc(-50% + ${sprite.spriteState.y}px))`,
            opacity: sprite.spriteState.visible === false ? 0 : 1,
            zIndex: isSelectedSprite ? 10 : 1,
          }}
        >
          {sprite.speechBubble?.message && (
            <SpeechBubble
              message={sprite.speechBubble.message}
              isThinking={sprite.speechBubble.isThinking}
            />
          )}
          <div
            className="h-24 w-24"
            style={{
              transform: `rotate(${sprite.spriteState.rotation + 90}deg) scale(${spriteScale})`,
              transformOrigin: 'center center',
            }}
          >
            <SpriteGraphic src={sprite.src} markup={sprite.svgMarkup} color={sprite.color} />
          </div>
        </div>
      );
    })}
  </div>
);

export default StagePreview;
