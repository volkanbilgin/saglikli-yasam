import { useState, useEffect, useCallback } from 'react';
import { DailyEntry, emptyEntry, getOrCreateEntry, saveFullEntry } from '../db/database';
import { calculateScore } from '../utils/scoring';
import { fromDateStr } from '../utils/dateHelpers';

export function useDailyEntry(dateStr: string) {
  const [entry, setEntry] = useState<DailyEntry>(emptyEntry(dateStr));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getOrCreateEntry(dateStr).then((e) => {
      setEntry(e);
      setLoading(false);
    });
  }, [dateStr]);

  const update = useCallback(
    async (field: keyof DailyEntry, value: number | string) => {
      const updated = { ...entry, [field]: value };
      if (field !== 'note') {
        const scoreResult = calculateScore(updated as DailyEntry, fromDateStr(dateStr));
        updated.daily_score = scoreResult.totalScore;
      }
      setEntry(updated as DailyEntry);
      await saveFullEntry(dateStr, updated as DailyEntry);
    },
    [entry, dateStr]
  );

  const score = calculateScore(entry, fromDateStr(dateStr));

  return { entry, loading, update, score };
}
