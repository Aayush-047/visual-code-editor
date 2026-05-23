import React from 'react';

const SpeechBubble = ({ message, isThinking }) => (
  <div className="absolute left-1/2 top-0 z-20 min-w-[100px] -translate-x-1/2 -translate-y-full -mt-3 rounded-lg border-2 border-black bg-white p-2 text-center shadow-sm">
    {message}
    <div className={`absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rotate-45 border-r-2 border-b-2 border-black bg-white ${isThinking ? 'rounded-full' : ''}`}></div>
  </div>
);

export default SpeechBubble;
