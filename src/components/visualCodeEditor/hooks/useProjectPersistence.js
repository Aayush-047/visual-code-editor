import { useCallback, useEffect, useRef } from 'react';
import { LZ_STRING_CDN_URL } from '../config';

const useProjectPersistence = ({
  getProjectState,
  getShareProjectState,
  applyProjectState,
  showToast,
  projectFileInputRef,
  setIsProjectSaving,
  setIsProjectLoading,
}) => {
  const lzStringLoaderRef = useRef(null);
  const hasRestoredSharedProjectRef = useRef(false);

  const ensureLZStringLoaded = useCallback(() => {
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('Sharing is only available in the browser.'));
    }

    if (
      window.LZString?.compressToEncodedURIComponent &&
      window.LZString?.decompressFromEncodedURIComponent
    ) {
      return Promise.resolve(window.LZString);
    }

    if (lzStringLoaderRef.current) {
      return lzStringLoaderRef.current;
    }

    lzStringLoaderRef.current = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${LZ_STRING_CDN_URL}"]`);

      const handleReady = () => {
        if (
          window.LZString?.compressToEncodedURIComponent &&
          window.LZString?.decompressFromEncodedURIComponent
        ) {
          resolve(window.LZString);
          return;
        }

        reject(new Error('Unable to load sharing tools.'));
      };

      if (existingScript) {
        existingScript.addEventListener('load', handleReady, { once: true });
        existingScript.addEventListener(
          'error',
          () => reject(new Error('Unable to load sharing tools.')),
          { once: true }
        );
        return;
      }

      const script = document.createElement('script');
      script.src = LZ_STRING_CDN_URL;
      script.async = true;
      script.onload = handleReady;
      script.onerror = () => reject(new Error('Unable to load sharing tools.'));
      document.head.appendChild(script);
    }).catch((error) => {
      lzStringLoaderRef.current = null;
      throw error;
    });

    return lzStringLoaderRef.current;
  }, []);

  const restoreProjectFromHash = useCallback(async () => {
    const sharedHash = window.location.hash.replace(/^#/, '');

    if (!sharedHash) {
      return false;
    }

    const lzString = await ensureLZStringLoaded();
    const decompressedProject = lzString.decompressFromEncodedURIComponent(sharedHash);

    if (!decompressedProject) {
      throw new Error('Shared link is invalid or corrupted.');
    }

    const parsedProject = JSON.parse(decompressedProject);
    const normalizedSharedState =
      parsedProject?.format === 'visual-code-editor-share'
        ? parsedProject.state || {
            sprites: parsedProject.sprites,
            stageState: parsedProject.stageState,
            variableNames: parsedProject.variableNames,
            listNames: parsedProject.listNames,
            variableValues: parsedProject.variableValues,
            listValues: parsedProject.listValues,
            sounds: parsedProject.sounds,
            soundVolume: parsedProject.soundVolume,
            selectedSpriteId: parsedProject.selectedSpriteId,
          }
        : parsedProject?.format === 'visual-code-editor-project'
          ? parsedProject.state
          : parsedProject?.sprites
            ? parsedProject
            : null;

    if (!normalizedSharedState) {
      throw new Error('Shared link does not contain a valid project.');
    }

    applyProjectState(normalizedSharedState);
    return true;
  }, [applyProjectState, ensureLZStringLoaded]);

  useEffect(() => {
    if (hasRestoredSharedProjectRef.current) {
      return;
    }

    let isCancelled = false;
    hasRestoredSharedProjectRef.current = true;

    void restoreProjectFromHash()
      .then((didRestore) => {
        if (!isCancelled && didRestore) {
          showToast('Shared project loaded.');
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          showToast(error.message || 'Unable to open the shared project.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [restoreProjectFromHash, showToast]);

  useEffect(() => {
    const handleHashChange = () => {
      void restoreProjectFromHash().catch(() => undefined);
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [restoreProjectFromHash]);

  const handleSaveProject = useCallback(async () => {
    setIsProjectSaving(true);

    try {
      const projectFile = {
        format: 'visual-code-editor-project',
        version: 1,
        savedAt: new Date().toISOString(),
        state: getProjectState(),
      };
      const fileContents = JSON.stringify(projectFile, null, 2);
      const filename = 'visual-code-project.json';

      if (window.showSaveFilePicker) {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'Visual Code Editor Project',
              accept: { 'application/json': ['.json'] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(fileContents);
        await writable.close();
      } else {
        const blob = new Blob([fileContents], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      showToast('Project file saved.');
    } catch (error) {
      if (error.name !== 'AbortError') {
        showToast(error.message || 'Unable to save project file.');
      }
    } finally {
      setIsProjectSaving(false);
    }
  }, [getProjectState, setIsProjectSaving, showToast]);

  const handleShareProject = useCallback(async () => {
    try {
      const lzString = await ensureLZStringLoaded();
      const compressedProject = lzString.compressToEncodedURIComponent(
        JSON.stringify(getShareProjectState())
      );

      if (!compressedProject) {
        throw new Error('Unable to create a share link for this project.');
      }

      const sharedUrl = `${window.location.origin}${window.location.pathname}${window.location.search}#${compressedProject}`;
      window.history.replaceState(null, '', `#${compressedProject}`);
      await navigator.clipboard.writeText(sharedUrl);
      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      showToast(error.message || 'Unable to share this project.');
    }
  }, [ensureLZStringLoaded, getShareProjectState, showToast]);

  const loadProjectFile = useCallback(
    async (file) => {
      if (!file) return;

      setIsProjectLoading(true);

      try {
        const fileContents = await file.text();
        const projectFile = JSON.parse(fileContents);

        if (projectFile.format !== 'visual-code-editor-project' || !projectFile.state) {
          throw new Error('Choose a valid Visual Code Editor project file.');
        }

        applyProjectState(projectFile.state);
        showToast('Project file loaded.');
      } catch (error) {
        showToast(error.message || 'Unable to load project file.');
      } finally {
        setIsProjectLoading(false);
      }
    },
    [applyProjectState, setIsProjectLoading, showToast]
  );

  const handleLoadProject = useCallback(() => {
    projectFileInputRef.current?.click();
  }, [projectFileInputRef]);

  const handleProjectFileChange = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      void loadProjectFile(file);
    },
    [loadProjectFile]
  );

  return {
    handleLoadProject,
    handleProjectFileChange,
    handleSaveProject,
    handleShareProject,
  };
};

export default useProjectPersistence;
