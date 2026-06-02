import React from 'react';
import { TUTORIAL_STEPS } from '../config';

const TutorialOverlay = ({
  currentStep,
  currentStepIndex,
  spotlightRect,
  tooltipStyle,
  onSkip,
  onNext,
  onPrev,
  onJump,
}) => {
  if (!currentStep || !spotlightRect) return null;
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === TUTORIAL_STEPS.length - 1;

  return (
    <>
      <div id="tutorial-overlay" />
      <div
        id="tutorial-spotlight"
        style={{
          top: spotlightRect.top - 8,
          left: spotlightRect.left - 8,
          width: spotlightRect.width + 16,
          height: spotlightRect.height + 16,
        }}
      />
      <div
        id="tutorial-tooltip"
        data-position={currentStep.position}
        style={{ top: tooltipStyle.top, left: tooltipStyle.left }}
      >
        <div className="tt-step-dots">
          {TUTORIAL_STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              className={`tt-dot ${index === currentStepIndex ? 'tt-dot-active' : ''}`}
              onClick={() => onJump(index)}
              aria-label={`Go to tutorial step ${index + 1}`}
            />
          ))}
        </div>
        <h3 className="tt-title">{currentStep.title}</h3>
        <p className="tt-desc">{currentStep.description}</p>
        <div className="tt-actions">
          <button type="button" className="tt-btn-skip" onClick={onSkip}>Skip tour</button>
          <div className="tt-nav">
            {!isFirst ? <button type="button" className="tt-btn-prev" onClick={onPrev}>Back</button> : null}
            <button type="button" className={`tt-btn-next ${isLast ? 'tt-btn-finish' : ''}`} onClick={onNext}>
              {isLast ? 'Done!' : 'Next'}
            </button>
          </div>
        </div>
        <div className="tt-counter">{currentStepIndex + 1} of {TUTORIAL_STEPS.length}</div>
      </div>
    </>
  );
};

export default TutorialOverlay;
