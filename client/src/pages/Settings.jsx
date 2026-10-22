import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Target,
  Clock,
  RotateCcw,
  Languages,
  Download,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Settings = () => {
  const { user, updatePreferences } = useAuth();
  const { theme, setTheme } = useTheme();

  const prefs = user?.preferences || {};
  const [dailyTarget, setDailyTarget] = useState(prefs.dailyTarget || 5);
  const [preferredLanguage, setPreferredLanguage] = useState(prefs.preferredLanguage || 'Java');
  const [revisionIntervalsStr, setRevisionIntervalsStr] = useState(
    (prefs.revisionIntervals || [1, 3, 7, 14, 30]).join(', ')
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedIntervals = revisionIntervalsStr
        .split(',')
        .map(s => parseInt(s.trim(), 10))
        .filter(n => !isNaN(n) && n > 0);

      const res = await updatePreferences({
        dailyTarget: Number(dailyTarget),
        preferredLanguage,
        revisionIntervals: parsedIntervals.length > 0 ? parsedIntervals : [1, 3, 7, 14, 30],
        theme
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = (format) => {
    window.open(`/api/data/export?format=${format}`, '_blank');
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-500" />
          <span>System & Placement Settings</span>
        </h1>
        <p className="text-xs text-gray-500">
          Personalize your daily problem targets, preferred placement language, and spaced repetition intervals.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Daily Target Setting */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" />
            Daily Problem Target
          </h3>

          <div className="max-w-xs text-xs">
            <div>
              <label className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                Target Questions per Day
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={dailyTarget}
                onChange={(e) => setDailyTarget(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 font-mono text-xs outline-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">Default: 5 questions/day</p>
            </div>
          </div>
        </div>

        {/* Spaced Repetition Settings */}
        <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-purple-500" />
            Spaced Repetition Review Intervals
          </h3>
          <p className="text-xs text-gray-500">
            Comma-separated number of days between successive problem revisions.
          </p>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Interval Days (e.g. 1, 3, 7, 14, 30)
            </label>
            <input
              type="text"
              value={revisionIntervalsStr}
              onChange={(e) => setRevisionIntervalsStr(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-dark-900 font-mono text-xs outline-none"
            />
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-colors"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving Preferences...' : saveSuccess ? 'Preferences Saved!' : 'Save All Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Export Section */}
      <div className="p-5 rounded-2xl bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-500" />
          Export Account Progress
        </h3>
        <p className="text-xs text-gray-500">
          Download your complete DSA Placement OS 180 questions progress, revision history, and statuses.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExportData('csv')}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Spreadsheet</span>
          </button>
          <button
            onClick={() => handleExportData('json')}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download JSON Backup</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
