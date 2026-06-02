import React from 'react';

const BackdropSwatch = ({
  backdrop,
  className = 'h-5 w-5 rounded-md border border-emerald-200',
}) => (
  <div
    className={`${className} flex flex-shrink-0 items-center justify-center overflow-hidden bg-white`}
    style={{
      backgroundImage: backdrop?.url ? `url(${backdrop.url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}
  >
    {!backdrop?.url && <span className="text-[9px] font-semibold text-gray-500">BG</span>}
  </div>
);

export default BackdropSwatch;
