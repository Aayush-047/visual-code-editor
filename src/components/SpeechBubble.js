import React from 'react';

const SpeechBubble = ({ message, isThinking }) => (
  <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-white border-2 border-black rounded-lg p-2 min-w-[100px] text-center">
    {message}
    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-4 h-4 rotate-45 bg-white border-r-2 border-b-2 border-black ${isThinking ? 'rounded-full' : ''}`}></div>
  </div>
);

export default SpeechBubble;