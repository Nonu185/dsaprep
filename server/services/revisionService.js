/**
 * Spaced Repetition Revision Service
 * Default intervals: [1, 3, 7, 14, 30] days
 */

const calculateNextRevisionDate = (baseDate, intervalDays) => {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
};

const getRevisionSchedule = (solvedAt, currentLevel = 0, customIntervals = [1, 3, 7, 14, 30]) => {
  const intervals = Array.isArray(customIntervals) && customIntervals.length > 0 
    ? customIntervals 
    : [1, 3, 7, 14, 30];

  const targetIndex = Math.min(currentLevel, intervals.length - 1);
  const intervalDays = intervals[targetIndex];

  return {
    intervalDays,
    nextRevisionAt: calculateNextRevisionDate(solvedAt, intervalDays),
    isFinalLevel: currentLevel >= intervals.length - 1
  };
};

module.exports = {
  calculateNextRevisionDate,
  getRevisionSchedule
};
