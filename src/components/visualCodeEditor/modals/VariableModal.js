import React from 'react';

const VariableModal = ({
  isOpen,
  variableModalType,
  pendingVariableName,
  setPendingVariableName,
  handleCreateVariable,
  closeVariableModal,
}) =>
  isOpen ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[360px] max-w-[90vw] rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold">{variableModalType === 'variable' ? 'Create Variable' : 'Create List'}</h2>
        <p className="mb-4 text-sm text-gray-600">Enter a {variableModalType} name to add a new {variableModalType} block.</p>
        <input
          type="text"
          value={pendingVariableName}
          onChange={(event) => setPendingVariableName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleCreateVariable();
            } else if (event.key === 'Escape') {
              closeVariableModal();
            }
          }}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2 text-sm text-black outline-none focus:border-orange-500"
          placeholder={variableModalType === 'variable' ? 'Variable name' : 'List name'}
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={closeVariableModal} className="rounded bg-gray-200 px-4 py-2 text-gray-800">Cancel</button>
          <button type="button" onClick={handleCreateVariable} className="rounded bg-orange-600 px-4 py-2 text-white">{variableModalType === 'variable' ? 'Create Variable' : 'Create List'}</button>
        </div>
      </div>
    </div>
  ) : null;

export default VariableModal;
