import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useExecuteAction from '../../hooks/useExecuteAction';
import {
  BACKDROP_LIBRARY,
  EMPTY_BLOCKS,
  SPRITE_LIBRARY,
  getInitialTheme,
  isEventTriggerAction,
} from './config';
import { createDefaultSidebarBlocks } from './sidebarBlocks';
import { TutorialOverlay } from './primitives';
import { BackdropLibraryModal, RecordingModal, SpriteLibraryModal, ToastContainer, VariableModal } from './modals';
import { EditorNavbar, PreviewPanel, SidebarPanel, WorkspacePanel } from './sections';
import useAssetLibraries from './hooks/useAssetLibraries';
import useProjectPersistence from './hooks/useProjectPersistence';
import useProjectState from './hooks/useProjectState';
import useProgramRunner from './hooks/useProgramRunner';
import useSpriteEditor from './hooks/useSpriteEditor';
import useSoundRecording from './hooks/useSoundRecording';
import useStageInteractions from './hooks/useStageInteractions';
import useTopbarMenus from './hooks/useTopbarMenus';
import useTutorialManager from './hooks/useTutorialManager';
import useVariablesPanel from './hooks/useVariablesPanel';
import useWorkspaceBlocks from './hooks/useWorkspaceBlocks';

const VisualCodeEditor = () => {
  const [toasts, setToasts] = useState([]);
  const toastTimeoutRef = useRef([]);
  const projectFileInputRef = useRef(null);
  const [hasDismissedRunNudge, setHasDismissedRunNudge] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [activeSidebarTab, setActiveSidebarTab] = useState('blocks');
  const [spriteLibrary, setSpriteLibrary] = useState(SPRITE_LIBRARY);
  const [isProjectSaving, setIsProjectSaving] = useState(false);
  const [isProjectLoading, setIsProjectLoading] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [sidebarBlocks, setSidebarBlocks] = useState(() =>
    createDefaultSidebarBlocks(BACKDROP_LIBRARY[0].id)
  );
  const executeAction = useExecuteAction();
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    const timeoutId = window.setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
      toastTimeoutRef.current = toastTimeoutRef.current.filter((activeId) => activeId !== timeoutId);
    }, duration);

    toastTimeoutRef.current.push(timeoutId);
  }, []);
  const {
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
  } = useProjectState({
    setActiveSidebarTab,
  });
  const {
    closeVariableModal,
    handleCreateVariable,
    handleDeleteVariableEntity,
    handleSidebarBlockChange,
    isVariableModalOpen,
    listNames,
    listValues,
    openListModal,
    openVariableModal,
    pendingVariableName,
    setListNames,
    setListValues,
    setPendingVariableName,
    setVariableNames,
    setVariableValues,
    variableModalType,
    variableNames,
    variableValues,
  } = useVariablesPanel({
    setSidebarBlocks,
    setSprites,
    showToast,
  });
  const availableBackdrops = sessionBackdrops;
  const activeSpriteId = selectedSpriteId || sprites[0]?.id || '';
  const selectedSprite =
    sprites.find((sprite) => sprite.id === activeSpriteId) || sprites[0] || null;
  const blocks = selectedSprite?.blocks || EMPTY_BLOCKS;
  const hasBlocks = blocks.length > 0;
  const spriteState = selectedSprite?.spriteState || { x: 0, y: 0, rotation: -90, size: 100 };
  const selectedBackdrop =
    availableBackdrops.find(({ id }) => id === String(backdropValue)) || availableBackdrops[0];
  const replayableBlocks = blocks.filter((block) => !isEventTriggerAction(block.action));
  const {
    assetsMenuRef,
    backdropSelectorRef,
    fileMenuRef,
    isAssetsMenuOpen,
    isBackdropSelectorOpen,
    isFileMenuOpen,
    isSpriteSelectorOpen,
    setIsAssetsMenuOpen,
    setIsBackdropSelectorOpen,
    setIsFileMenuOpen,
    setIsSpriteSelectorOpen,
    spriteSelectorRef,
  } = useTopbarMenus();
  const {
    closeRecordingModal,
    handleSoundMenuAction,
    isRecordingSound,
    recordingModalState,
    saveRecordedSound,
    startSoundRecording,
    stopSoundRecording,
  } = useSoundRecording({
    setSounds,
    showToast,
  });
  const {
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
  } = useTutorialManager({
    activeSidebarTab,
    setActiveSidebarTab,
    showToast,
  });

  const updateSpriteById = useCallback((spriteId, updater) => {
    setSprites((prevSprites) =>
      prevSprites.map((sprite) => (sprite.id === spriteId ? updater(sprite) : sprite))
    );
  }, [setSprites]);

  const updateSelectedSprite = useCallback(
    (updater) => {
      const spriteId = selectedSpriteId || sprites[0]?.id;
      if (!spriteId) {
        return;
      }

      updateSpriteById(spriteId, updater);
    },
    [selectedSpriteId, sprites, updateSpriteById]
  );
  const {
    handleApplySpriteMarkup,
    handleResetSpriteMarkup,
    handleSelectedSpriteSizeChange,
    spriteEditorError,
    spriteEditorMarkup,
  } = useSpriteEditor({
    selectedSprite,
    showToast,
    updateSpriteById,
  });

  const setSelectedSpriteState = useCallback(
    (nextState) => {
      updateSelectedSprite((sprite) => ({
        ...sprite,
        spriteState: typeof nextState === 'function' ? nextState(sprite.spriteState) : nextState,
      }));
    },
    [updateSelectedSprite]
  );

  const setSpriteSpeechBubble = useCallback(
    (spriteId, nextBubble) => {
      updateSpriteById(spriteId, (sprite) => ({
        ...sprite,
        speechBubble:
          typeof nextBubble === 'function' ? nextBubble(sprite.speechBubble) : nextBubble,
      }));
    },
    [updateSpriteById]
  );
  const {
    backdropCategoryFilter,
    backdropCategoryOptions,
    backdropFileInputRef,
    backdropLibraryFilter,
    backdropLibrarySearch,
    backdropLibrarySearchRef,
    closeLibraries,
    filteredBackdropLibrary,
    filteredSpriteLibrary,
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
    setSpriteCategoryFilter,
    setSpriteLibraryFilter,
    setSpriteLibrarySearch,
    spriteCategoryFilter,
    spriteCategoryOptions,
    spriteFileInputRef,
    spriteLibraryFilter,
    spriteLibrarySearch,
    spriteLibrarySearchRef,
  } = useAssetLibraries({
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
  });
  const {
    handleBlockChange,
    handleDrop,
    handleNestedBlockChange,
    handleNestedDrop,
    handleOperatorSlotChange,
    handleOperatorSlotDrop,
    handleRemoveBlock,
    moveBlock,
    recentlyAddedBlockIds,
    removingBlockIds,
    requestRemoveBlock,
    selectedBlockId,
    selectedReplayBlockId,
    setSelectedBlockId,
    setSelectedReplayBlockId,
  } = useWorkspaceBlocks({
    activeSpriteId,
    blocks,
    replayableBlocks,
    showToast,
    updateSpriteById,
  });
  const selectedReplayBlock =
    replayableBlocks.find((block) => block.id === selectedReplayBlockId) ||
    replayableBlocks[0] ||
    null;
  const {
    handleSelectedSpriteClick,
    isRunning,
    replaySelectedBlock,
    runCode,
    stopAllCode,
    stopCurrentSprite,
  } = useProgramRunner({
    activeSpriteId,
    backdropValue,
    executeAction,
    selectedReplayBlock,
    setBackdropValue,
    setHasDismissedRunNudge,
    setListValues,
    setSoundVolume,
    setSpriteSpeechBubble,
    setSprites,
    setVariableValues,
    showToast,
    soundVolume,
    sounds,
    sprites,
    updateSpriteById,
  });
  const {
    handleSpriteClick,
    handleSpritePointerDown,
    handleSpritePointerMove,
    handleSpritePointerUp,
    previewRef,
    spriteRef,
  } = useStageInteractions({
    isRunning,
    spriteState,
    setSelectedSpriteState,
    onSpriteClick: handleSelectedSpriteClick,
  });

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem('theme', theme);
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedSpriteId && sprites.some((sprite) => sprite.id === selectedSpriteId)) {
      return;
    }

    setSelectedSpriteId(sprites[0]?.id || '');
  }, [selectedSpriteId, setSelectedSpriteId, sprites]);

  const getProjectState = useCallback(
    () =>
      buildProjectState({
        sidebarBlocks,
        variableNames,
        listNames,
        variableValues,
        listValues,
      }),
    [buildProjectState, listNames, listValues, sidebarBlocks, variableNames, variableValues]
  );

  const getShareProjectState = useCallback(
    () => buildShareProjectState(getProjectState()),
    [buildShareProjectState, getProjectState]
  );

  const applyProjectState = useCallback(
    (state = {}) => {
      hydrateProjectState(state, {
        setSidebarBlocks,
        setVariableNames,
        setListNames,
        setVariableValues,
        setListValues,
      });
    },
    [
      hydrateProjectState,
      setListNames,
      setListValues,
      setSidebarBlocks,
      setVariableNames,
      setVariableValues,
    ]
  );
  const {
    handleLoadProject,
    handleProjectFileChange,
    handleSaveProject,
    handleShareProject,
  } = useProjectPersistence({
    getProjectState,
    getShareProjectState,
    applyProjectState,
    showToast,
    projectFileInputRef,
    setIsProjectSaving,
    setIsProjectLoading,
  });

  useEffect(
    () => () => {
      toastTimeoutRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      toastTimeoutRef.current = [];
    },
    []
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div
        className={`editor-surface flex h-full min-h-0 flex-col ${isDarkMode ? 'theme-dark' : ''}`}
      >
        <EditorNavbar
          fileMenuRef={fileMenuRef}
          assetsMenuRef={assetsMenuRef}
          spriteSelectorRef={spriteSelectorRef}
          backdropSelectorRef={backdropSelectorRef}
          isFileMenuOpen={isFileMenuOpen}
          setIsFileMenuOpen={setIsFileMenuOpen}
          isAssetsMenuOpen={isAssetsMenuOpen}
          setIsAssetsMenuOpen={setIsAssetsMenuOpen}
          isSpriteSelectorOpen={isSpriteSelectorOpen}
          setIsSpriteSelectorOpen={setIsSpriteSelectorOpen}
          isBackdropSelectorOpen={isBackdropSelectorOpen}
          setIsBackdropSelectorOpen={setIsBackdropSelectorOpen}
          isProjectSaving={isProjectSaving}
          isProjectLoading={isProjectLoading}
          handleSaveProject={handleSaveProject}
          handleLoadProject={handleLoadProject}
          restartTutorial={restartTutorial}
          openSpriteLibrary={openSpriteLibrary}
          openBackdropLibrary={openBackdropLibrary}
          handleShareProject={handleShareProject}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          selectedSprite={selectedSprite}
          sprites={sprites}
          selectedSpriteId={activeSpriteId}
          setSelectedSpriteId={setSelectedSpriteId}
          selectedBackdrop={selectedBackdrop}
          availableBackdrops={availableBackdrops}
          backdropValue={backdropValue}
          handleSelectBackdrop={handleSelectBackdrop}
        />
        <div className="flex min-h-0 flex-1">
          <SidebarPanel
            activeSidebarTab={activeSidebarTab}
            setActiveSidebarTab={setActiveSidebarTab}
            selectedSprite={selectedSprite}
            selectedBackdrop={selectedBackdrop}
            sidebarBlocks={sidebarBlocks}
            sounds={sounds}
            variableNames={variableNames}
            listNames={listNames}
            availableBackdrops={availableBackdrops}
            isRecordingSound={isRecordingSound}
            handleSidebarBlockChange={handleSidebarBlockChange}
            handleSoundMenuAction={handleSoundMenuAction}
            handleBackdropMenuAction={handleBackdropMenuAction}
            handleDeleteVariableEntity={handleDeleteVariableEntity}
            showToast={showToast}
            openVariableModal={openVariableModal}
            openListModal={openListModal}
            openSpriteLibrary={openSpriteLibrary}
            sprites={sprites}
            selectedSpriteId={selectedSpriteId}
            setSelectedSpriteId={setSelectedSpriteId}
            handleRemoveSprite={handleRemoveSprite}
            openBackdropLibrary={openBackdropLibrary}
            backdropValue={backdropValue}
            handleSelectBackdrop={handleSelectBackdrop}
          />
          <WorkspacePanel
            activeSidebarTab={activeSidebarTab}
            selectedSprite={selectedSprite}
            spriteEditorMarkup={spriteEditorMarkup}
            spriteEditorError={spriteEditorError}
            handleApplySpriteMarkup={handleApplySpriteMarkup}
            handleResetSpriteMarkup={handleResetSpriteMarkup}
            handleSelectedSpriteSizeChange={handleSelectedSpriteSizeChange}
            handleDrop={handleDrop}
            setSelectedBlockId={setSelectedBlockId}
            hasBlocks={hasBlocks}
            blocks={blocks}
            handleBlockChange={handleBlockChange}
            handleRemoveBlock={handleRemoveBlock}
            moveBlock={moveBlock}
            sounds={sounds}
            variableNames={variableNames}
            listNames={listNames}
            availableBackdrops={availableBackdrops}
            isRecordingSound={isRecordingSound}
            handleSoundMenuAction={handleSoundMenuAction}
            handleBackdropMenuAction={handleBackdropMenuAction}
            handleNestedDrop={handleNestedDrop}
            handleNestedBlockChange={handleNestedBlockChange}
            handleOperatorSlotChange={handleOperatorSlotChange}
            handleOperatorSlotDrop={handleOperatorSlotDrop}
            showToast={showToast}
            handleDeleteVariableEntity={handleDeleteVariableEntity}
            selectedBlockId={selectedBlockId}
            requestRemoveBlock={requestRemoveBlock}
            removingBlockIds={removingBlockIds}
            recentlyAddedBlockIds={recentlyAddedBlockIds}
            hasDismissedRunNudge={hasDismissedRunNudge}
          />
          <PreviewPanel
            isPreviewExpanded={isPreviewExpanded}
            setIsPreviewExpanded={setIsPreviewExpanded}
            previewRef={previewRef}
            spriteRef={spriteRef}
            sprites={sprites}
            activeSpriteId={activeSpriteId}
            selectedBackdrop={selectedBackdrop}
            handleSpritePointerDown={handleSpritePointerDown}
            handleSpritePointerMove={handleSpritePointerMove}
            handleSpritePointerUp={handleSpritePointerUp}
            handleSpriteClick={handleSpriteClick}
            isRunning={isRunning}
            replayableBlocks={replayableBlocks}
            selectedReplayBlockId={selectedReplayBlockId}
            setSelectedReplayBlockId={setSelectedReplayBlockId}
            runCode={runCode}
            replaySelectedBlock={replaySelectedBlock}
            stopCurrentSprite={stopCurrentSprite}
            stopAllCode={stopAllCode}
            hasDismissedRunNudge={hasDismissedRunNudge}
          />
        </div>
        <SpriteLibraryModal
          isOpen={isSpriteLibraryOpen}
          closeLibraries={closeLibraries}
          spriteLibrarySearchRef={spriteLibrarySearchRef}
          spriteLibrarySearch={spriteLibrarySearch}
          setSpriteLibrarySearch={setSpriteLibrarySearch}
          spriteLibrary={spriteLibrary}
          spriteCategoryFilter={spriteCategoryFilter}
          setSpriteCategoryFilter={setSpriteCategoryFilter}
          spriteCategoryOptions={spriteCategoryOptions}
          sprites={sprites}
          spriteLibraryFilter={spriteLibraryFilter}
          setSpriteLibraryFilter={setSpriteLibraryFilter}
          openSpriteUploadPicker={openSpriteUploadPicker}
          filteredSpriteLibrary={filteredSpriteLibrary}
          handleAddSprite={handleAddSprite}
        />
        <BackdropLibraryModal
          isOpen={isBackdropLibraryOpen}
          closeLibraries={closeLibraries}
          backdropLibrarySearchRef={backdropLibrarySearchRef}
          backdropLibrarySearch={backdropLibrarySearch}
          setBackdropLibrarySearch={setBackdropLibrarySearch}
          backdropLibrary={backdropLibrary}
          backdropCategoryFilter={backdropCategoryFilter}
          setBackdropCategoryFilter={setBackdropCategoryFilter}
          backdropCategoryOptions={backdropCategoryOptions}
          availableBackdrops={availableBackdrops}
          backdropLibraryFilter={backdropLibraryFilter}
          setBackdropLibraryFilter={setBackdropLibraryFilter}
          openBackdropUploadPicker={openBackdropUploadPicker}
          filteredBackdropLibrary={filteredBackdropLibrary}
          handleAddBackdropToSession={handleAddBackdropToSession}
        />
        <input
          ref={spriteFileInputRef}
          type="file"
          accept=".svg,image/svg+xml"
          onChange={handleSpriteUpload}
          className="hidden"
        />
        <input
          ref={backdropFileInputRef}
          type="file"
          accept="image/*"
          onChange={handleBackdropUpload}
          className="hidden"
        />
        <input
          ref={projectFileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleProjectFileChange}
          className="hidden"
        />
        {isTutorialActive && currentTutorialStep ? (
          <TutorialOverlay
            currentStep={currentTutorialStep}
            currentStepIndex={tutorialStepIndex}
            spotlightRect={tutorialSpotlightRect}
            tooltipStyle={tutorialTooltipStyle}
            onSkip={skipTutorial}
            onNext={nextTutorialStep}
            onPrev={previousTutorialStep}
            onJump={setTutorialStepIndex}
          />
        ) : null}
        <ToastContainer toasts={toasts} />
        <VariableModal
          isOpen={isVariableModalOpen}
          variableModalType={variableModalType}
          pendingVariableName={pendingVariableName}
          setPendingVariableName={setPendingVariableName}
          handleCreateVariable={handleCreateVariable}
          closeVariableModal={closeVariableModal}
        />
        <RecordingModal
          recordingModalState={recordingModalState}
          closeRecordingModal={closeRecordingModal}
          startSoundRecording={startSoundRecording}
          stopSoundRecording={stopSoundRecording}
          saveRecordedSound={saveRecordedSound}
        />
      </div>
    </DndProvider>
  );
};

export default VisualCodeEditor;
