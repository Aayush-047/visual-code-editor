import { useCallback, useEffect, useState } from 'react';
import * as actionTypes from '../../../constants/ActionTypes';
import { VARIABLES } from '../../../constants/BlockTypes';
import {
  isVariableReporterAction,
  removeVariableReporterBlocks,
} from '../config';

const useVariablesPanel = ({ setSidebarBlocks, setSprites, showToast }) => {
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [variableModalType, setVariableModalType] = useState('variable');
  const [pendingVariableName, setPendingVariableName] = useState('');
  const [variableNames, setVariableNames] = useState([]);
  const [listNames, setListNames] = useState([]);
  const [variableValues, setVariableValues] = useState({});
  const [listValues, setListValues] = useState({});

  const handleSidebarBlockChange = useCallback((id, action, value) => {
    setSidebarBlocks((prevBlocks) =>
      prevBlocks.map((block) => (block.id === id ? { ...block, value } : block))
    );
  }, [setSidebarBlocks]);

  useEffect(() => {
    setSidebarBlocks((prevBlocks) =>
      prevBlocks.map((block) => {
        if (block.type !== VARIABLES || isVariableReporterAction(block.action)) {
          return block;
        }

        if (
          block.action === actionTypes.SET_VARIABLE_TO ||
          block.action === actionTypes.CHANGE_VARIABLE_BY
        ) {
          const nextVariableName = variableNames.includes(block.value.variableName)
            ? block.value.variableName
            : variableNames[0] || '';
          return {
            ...block,
            value: {
              ...block.value,
              variableName: nextVariableName,
            },
          };
        }

        const nextListName = listNames.includes(block.value.listName)
          ? block.value.listName
          : listNames[0] || '';
        return {
          ...block,
          value: {
            ...block.value,
            listName: nextListName,
          },
        };
      })
    );
  }, [listNames, setSidebarBlocks, variableNames]);

  const openVariableModal = useCallback(() => {
    setPendingVariableName('');
    setVariableModalType('variable');
    setIsVariableModalOpen(true);
  }, []);

  const openListModal = useCallback(() => {
    setPendingVariableName('');
    setVariableModalType('list');
    setIsVariableModalOpen(true);
  }, []);

  const closeVariableModal = useCallback(() => {
    setPendingVariableName('');
    setIsVariableModalOpen(false);
  }, []);

  const handleCreateVariable = useCallback(() => {
    const trimmedName = pendingVariableName.trim();

    if (!trimmedName) {
      showToast('Enter a variable name.');
      return;
    }

    const existingNames = variableModalType === 'variable' ? variableNames : listNames;
    const alreadyExists = existingNames.some(
      (name) => name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      showToast(`A ${variableModalType} with that name already exists.`);
      return;
    }

    if (variableModalType === 'variable') {
      setVariableNames((prevNames) => [...prevNames, trimmedName]);
      setVariableValues((prevValues) => ({ ...prevValues, [trimmedName]: 0 }));
    } else {
      setListNames((prevNames) => [...prevNames, trimmedName]);
      setListValues((prevValues) => ({ ...prevValues, [trimmedName]: [] }));
    }

    setSidebarBlocks((prevBlocks) => [
      ...prevBlocks,
      {
        id: `sidebar-${variableModalType}-${Date.now()}-${Math.random()}`,
        type: VARIABLES,
        action:
          variableModalType === 'variable'
            ? actionTypes.VARIABLE_REPORTER
            : actionTypes.LIST_REPORTER,
        value: { name: trimmedName },
      },
    ]);
    closeVariableModal();
  }, [
    closeVariableModal,
    listNames,
    pendingVariableName,
    setSidebarBlocks,
    showToast,
    variableModalType,
    variableNames,
  ]);

  const handleDeleteVariableEntity = useCallback((entityType, entityName) => {
    if (!entityName) {
      return;
    }

    if (entityType === 'variable') {
      setVariableNames((prevNames) => prevNames.filter((name) => name !== entityName));
      setVariableValues((prevValues) => {
        const nextValues = { ...prevValues };
        delete nextValues[entityName];
        return nextValues;
      });
    } else {
      setListNames((prevNames) => prevNames.filter((name) => name !== entityName));
      setListValues((prevValues) => {
        const nextValues = { ...prevValues };
        delete nextValues[entityName];
        return nextValues;
      });
    }

    setSidebarBlocks((prevBlocks) =>
      prevBlocks.filter((block) => {
        if (entityType === 'variable') {
          return !(
            block.type === VARIABLES &&
            block.action === actionTypes.VARIABLE_REPORTER &&
            block.value?.name === entityName
          );
        }

        return !(
          block.type === VARIABLES &&
          block.action === actionTypes.LIST_REPORTER &&
          block.value?.name === entityName
        );
      })
    );

    setSprites((prevSprites) =>
      prevSprites.map((sprite) => ({
        ...sprite,
        blocks: removeVariableReporterBlocks(sprite.blocks || [], entityType, entityName),
      }))
    );
  }, [setSidebarBlocks, setSprites]);

  return {
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
  };
};

export default useVariablesPanel;
