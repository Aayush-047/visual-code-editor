import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  TUTORIAL_STEPS,
  TUTORIAL_STORAGE_KEY,
  getTutorialTooltipStyle,
} from '../config';

const useTutorialManager = ({ activeSidebarTab, setActiveSidebarTab, showToast }) => {
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialSpotlightRect, setTutorialSpotlightRect] = useState(null);
  const [tutorialTooltipStyle, setTutorialTooltipStyle] = useState({ top: 12, left: 12 });
  const tutorialStartTimeoutRef = useRef(null);

  const currentTutorialStep = useMemo(
    () => TUTORIAL_STEPS[tutorialStepIndex] || null,
    [tutorialStepIndex]
  );

  const stopTutorial = useCallback(() => {
    setIsTutorialActive(false);
    setTutorialSpotlightRect(null);
  }, []);

  const completeTutorial = useCallback(() => {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
    stopTutorial();
    showToast("You're all set! Start building something.", 'success', 4000);
  }, [showToast, stopTutorial]);

  const skipTutorial = useCallback(() => {
    window.localStorage.setItem(TUTORIAL_STORAGE_KEY, 'skipped');
    stopTutorial();
    showToast('Tutorial skipped. Restart it anytime from File.', 'info');
  }, [showToast, stopTutorial]);

  const startTutorial = useCallback(() => {
    setActiveSidebarTab('blocks');
    setTutorialStepIndex(0);
    setIsTutorialActive(true);
  }, [setActiveSidebarTab]);

  const restartTutorial = useCallback(() => {
    window.localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    startTutorial();
  }, [startTutorial]);

  const updateTutorialLayout = useCallback(
    (index) => {
      const fallbackToNext = (nextIndex) => {
        if (nextIndex >= TUTORIAL_STEPS.length) {
          completeTutorial();
          return;
        }

        setTutorialStepIndex(nextIndex);
      };

      const step = TUTORIAL_STEPS[index];
      const target = step ? document.querySelector(step.target) : null;

      if (!step || !target) {
        fallbackToNext(index + 1);
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

      window.requestAnimationFrame(() => {
        const rect = target.getBoundingClientRect();
        setTutorialSpotlightRect(rect);
        setTutorialTooltipStyle(getTutorialTooltipStyle(step.position, rect));
      });
    },
    [completeTutorial]
  );

  const nextTutorialStep = useCallback(() => {
    if (tutorialStepIndex < TUTORIAL_STEPS.length - 1) {
      setTutorialStepIndex((currentIndex) => currentIndex + 1);
      return;
    }

    completeTutorial();
  }, [completeTutorial, tutorialStepIndex]);

  const previousTutorialStep = useCallback(() => {
    setTutorialStepIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(TUTORIAL_STORAGE_KEY)) {
      return undefined;
    }

    tutorialStartTimeoutRef.current = window.setTimeout(() => {
      startTutorial();
    }, 800);

    return () => {
      if (tutorialStartTimeoutRef.current) {
        window.clearTimeout(tutorialStartTimeoutRef.current);
        tutorialStartTimeoutRef.current = null;
      }
    };
  }, [startTutorial]);

  useEffect(() => {
    if (!isTutorialActive) {
      return undefined;
    }

    updateTutorialLayout(tutorialStepIndex);

    const handleResize = () => {
      updateTutorialLayout(tutorialStepIndex);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeSidebarTab, isTutorialActive, tutorialStepIndex, updateTutorialLayout]);

  useEffect(() => {
    window.restartTutorial = restartTutorial;

    return () => {
      delete window.restartTutorial;
    };
  }, [restartTutorial]);

  return {
    currentTutorialStep,
    isTutorialActive,
    nextTutorialStep,
    previousTutorialStep,
    restartTutorial,
    skipTutorial,
    tutorialSpotlightRect,
    tutorialStepIndex,
    tutorialTooltipStyle,
    setTutorialStepIndex,
  };
};

export default useTutorialManager;
