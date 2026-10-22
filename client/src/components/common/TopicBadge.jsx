import React from 'react';

const TopicBadge = ({ topic, className = '' }) => {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40 ${className}`}>
      {topic}
    </span>
  );
};

export default TopicBadge;
