import { supabase } from '../lib/supabase';

export interface DailyEntry {
  date: string;
  morning_yoga: number;
  morning_pushup_squat: number;
  morning_vitamins: number;
  morning_teeth: number;
  morning_english: number;
  evening_vitamins: number;
  evening_pushup_squat: number;
  evening_teeth: number;
  evening_english: number;
  evening_professional: number;
  water_glasses: number;
  book_pages: number;
  exercise_done: number;
  walk_km: number;
  social_media_minutes: number;
  daily_score: number;
  note: string;
}

export const emptyEntry = (date: string): DailyEntry => ({
  date,
  morning_yoga: 0,
  morning_pushup_squat: 0,
  morning_vitamins: 0,
  morning_teeth: 0,
  morning_english: 0,
  evening_vitamins: 0,
  evening_pushup_squat: 0,
  evening_teeth: 0,
  evening_english: 0,
  evening_professional: 0,
  water_glasses: 0,
  book_pages: 0,
  exercise_done: 0,
  walk_km: 0,
  social_media_minutes: 50,
  daily_score: 0,
  note: '',
});

async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getOrCreateEntry(date: string): Promise<DailyEntry> {
  const uid = await getUserId();
  if (!uid) return emptyEntry(date);

  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', uid)
    .eq('date', date)
    .maybeSingle();

  if (data) return { ...emptyEntry(date), ...data };
  return emptyEntry(date);
}

export async function getEntry(date: string): Promise<DailyEntry | null> {
  const uid = await getUserId();
  if (!uid) return null;

  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', uid)
    .eq('date', date)
    .maybeSingle();

  if (!data) return null;
  return { ...emptyEntry(date), ...data };
}

export async function saveFullEntry(date: string, entry: DailyEntry): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await supabase
    .from('daily_entries')
    .upsert({ ...entry, user_id: uid, date }, { onConflict: 'user_id,date' });
}

export async function getEntriesForMonth(year: number, month: number): Promise<DailyEntry[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', uid)
    .like('date', `${prefix}%`)
    .order('date');

  return (data ?? []).map((row) => ({ ...emptyEntry(row.date), ...row }));
}

export async function getEntriesForYear(year: number): Promise<DailyEntry[]> {
  const uid = await getUserId();
  if (!uid) return [];

  const { data } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', uid)
    .like('date', `${year}-%`)
    .order('date');

  return (data ?? []).map((row) => ({ ...emptyEntry(row.date), ...row }));
}

// ── Aylık not ──────────────────────────────────────────────────────────────

export async function getMonthNote(yearMonth: string): Promise<string> {
  const uid = await getUserId();
  if (!uid) return '';

  const { data } = await supabase
    .from('month_notes')
    .select('note')
    .eq('user_id', uid)
    .eq('year_month', yearMonth)
    .maybeSingle();

  return data?.note ?? '';
}

export async function saveMonthNote(yearMonth: string, note: string): Promise<void> {
  const uid = await getUserId();
  if (!uid) return;

  await supabase
    .from('month_notes')
    .upsert({ user_id: uid, year_month: yearMonth, note }, { onConflict: 'user_id,year_month' });
}

// ── Dışa / İçe Aktarma ────────────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  const uid = await getUserId();
  if (!uid) throw new Error('Giriş yapılmamış');

  const [{ data: entries }, { data: notes }] = await Promise.all([
    supabase.from('daily_entries').select('*').eq('user_id', uid),
    supabase.from('month_notes').select('*').eq('user_id', uid),
  ]);

  return JSON.stringify({
    version: 2,
    exportedAt: new Date().toISOString(),
    entries: entries ?? [],
    monthNotes: notes ?? [],
  }, null, 2);
}

export async function importAllData(jsonStr: string): Promise<number> {
  const uid = await getUserId();
  if (!uid) throw new Error('Giriş yapılmamış');

  const parsed = JSON.parse(jsonStr);
  let count = 0;

  if (parsed.version === 1 && parsed.data) {
    // Eski AsyncStorage formatı → Supabase'e aktar
    const index: string[] = JSON.parse(parsed.data['entry_index'] ?? '[]');
    const entries = index
      .map((date) => {
        const raw = parsed.data[`entry_${date}`];
        return raw ? { ...emptyEntry(date), ...JSON.parse(raw), user_id: uid } : null;
      })
      .filter(Boolean);

    if (entries.length > 0) {
      await supabase.from('daily_entries').upsert(entries as any[], { onConflict: 'user_id,date' });
      count += entries.length;
    }

    const noteEntries = Object.entries(parsed.data)
      .filter(([key]) => key.startsWith('month_note_'))
      .map(([key, val]) => ({
        user_id: uid,
        year_month: key.replace('month_note_', ''),
        note: val as string,
      }));

    if (noteEntries.length > 0) {
      await supabase.from('month_notes').upsert(noteEntries, { onConflict: 'user_id,year_month' });
      count += noteEntries.length;
    }
  } else if (parsed.version === 2) {
    // Yeni Supabase formatı
    if (parsed.entries?.length > 0) {
      const entries = parsed.entries.map((e: any) => ({ ...e, user_id: uid }));
      await supabase.from('daily_entries').upsert(entries, { onConflict: 'user_id,date' });
      count += parsed.entries.length;
    }
    if (parsed.monthNotes?.length > 0) {
      const notes = parsed.monthNotes.map((n: any) => ({ ...n, user_id: uid }));
      await supabase.from('month_notes').upsert(notes, { onConflict: 'user_id,year_month' });
      count += parsed.monthNotes.length;
    }
  } else {
    throw new Error('Geçersiz yedek dosyası');
  }

  return count;
}

export function initDatabase(): void {}
