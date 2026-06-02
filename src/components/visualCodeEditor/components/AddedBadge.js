import React from 'react';

const COLOR_STYLES = {
  green: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  blue: 'bg-sky-100 text-sky-700 ring-sky-200',
};

const AddedBadge = ({ children = 'Added', color = 'green', className = '' }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${COLOR_STYLES[color] || COLOR_STYLES.green} ${className}`}
  >
    {children}
  </span>
);

export default AddedBadge;
