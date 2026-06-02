import React from 'react';

const RecordingModal = ({
  recordingModalState,
  closeRecordingModal,
  startSoundRecording,
  stopSoundRecording,
  saveRecordedSound,
}) =>
  recordingModalState !== 'closed' ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[360px] max-w-[90vw] rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-lg font-bold">Record Sound</h2>
        {recordingModalState === 'confirm' && (
          <>
            <p className="mb-4 text-sm text-gray-600">Start recording a new sound clip?</p>
            <div className="flex justify-end gap-2">
              <button onClick={closeRecordingModal} className="rounded bg-gray-200 px-4 py-2 text-gray-800">Cancel</button>
              <button onClick={() => void startSoundRecording()} className="rounded bg-pink-500 px-4 py-2 text-white">Start Record</button>
            </div>
          </>
        )}
        {recordingModalState === 'recording' && (
          <>
            <p className="mb-4 text-sm text-gray-600">Recording in progress. Stop when you are done.</p>
            <div className="flex justify-end gap-2">
              <button onClick={closeRecordingModal} className="rounded bg-gray-200 px-4 py-2 text-gray-800">Cancel</button>
              <button onClick={stopSoundRecording} className="rounded bg-red-500 px-4 py-2 text-white">Stop Recording</button>
            </div>
          </>
        )}
        {recordingModalState === 'review' && (
          <>
            <p className="mb-4 text-sm text-gray-600">Recording captured. Save it to the sound list?</p>
            <div className="flex justify-end gap-2">
              <button onClick={closeRecordingModal} className="rounded bg-gray-200 px-4 py-2 text-gray-800">Cancel</button>
              <button onClick={saveRecordedSound} className="rounded bg-pink-500 px-4 py-2 text-white">Save</button>
            </div>
          </>
        )}
      </div>
    </div>
  ) : null;

export default RecordingModal;
