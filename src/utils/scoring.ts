import { DailyEntry } from '../db/database';

// Haftaiçi mi? (Pazartesi=1 ... Pazar=0)
export function isWeekday(date: Date): boolean {
  const day = date.getDay(); // 0=Pazar, 6=Cumartesi
  return day >= 1 && day <= 5;
}

// Sosyal medya puanı
// Hedef: 50 dk -> 8.35 puan
// 0 dk -> 8.35 puan (max)
// 50 dk -> 0 puan
// 100 dk -> -8.35 puan (negatif)
export function calcSocialMediaScore(minutes: number): number {
  return (50 - minutes) * 0.167;
}

export interface DayScore {
  morningScore: number;
  eveningScore: number;
  dailyExtrasScore: number;
  totalScore: number;
  maxPossible: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
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
  water: number;
  book_pages: number;
  exercise: number;
  walk: number;
  social_media: number;
}

export function calculateScore(entry: DailyEntry, date: Date): DayScore {
  const weekday = isWeekday(date);

  // --- Sabah ---
  const morning_yoga = entry.morning_yoga * 10;
  const morning_pushup_squat = entry.morning_pushup_squat * 10;
  const morning_vitamins = entry.morning_vitamins * 10;
  const morning_teeth = entry.morning_teeth * 10;
  const morning_english = entry.morning_english * 10; // haftasonu da sayılır

  // --- Akşam ---
  const evening_vitamins = entry.evening_vitamins * 10;
  const evening_pushup_squat = entry.evening_pushup_squat * 10;
  const evening_teeth = entry.evening_teeth * 10;
  const evening_english = entry.evening_english * 10; // haftasonu da sayılır
  const evening_professional = entry.evening_professional * 10;

  // --- Günlük ---
  const water = entry.water_glasses * 2;
  const book_pages = entry.book_pages * 1;
  const exercise = entry.exercise_done * 20;
  // Yürüyüş: 2 km = 20 puan (orantılı)
  const walk = entry.walk_km * 2; // 1km = 2 puan, 10km = 20 puan
  const social_media = calcSocialMediaScore(entry.social_media_minutes);

  const morningScore =
    morning_yoga + morning_pushup_squat + morning_vitamins + morning_teeth + morning_english;
  const eveningScore =
    evening_vitamins + evening_pushup_squat + evening_teeth + evening_english + evening_professional;
  const dailyExtrasScore = water + book_pages + exercise + walk + social_media;

  const totalScore = morningScore + eveningScore + dailyExtrasScore;

  // Max hesabı (mükemmel için referans = 100)
  // Sabah max: yoga(10)+pushup(10)+vit(10)+teeth(10)+english(10 weekday only) = 40/50
  // Akşam max: vit(10)+pushup(10)+teeth(10)+english(10 weekday)+prof(10) = 40/50
  // Extras: Sosyal medya max 8.35 (geri kalanı değişken)
  // Baz 100 = weekday tam puan (extras hariç)
  const maxPossible = weekday ? 100 : 80;

  return {
    morningScore,
    eveningScore,
    dailyExtrasScore,
    totalScore,
    maxPossible,
    breakdown: {
      morning_yoga,
      morning_pushup_squat,
      morning_vitamins,
      morning_teeth,
      morning_english,
      evening_vitamins,
      evening_pushup_squat,
      evening_teeth,
      evening_english,
      evening_professional,
      water,
      book_pages,
      exercise,
      walk,
      social_media,
    },
  };
}

export type ScoreLabel = 'Berbat' | 'Vasat' | 'İyi' | 'Mükemmel';

export function getScoreLabel(score: number): ScoreLabel {
  if (score < 70) return 'Berbat';
  if (score < 85) return 'Vasat';
  if (score < 100) return 'İyi';
  return 'Mükemmel';
}

export function getScoreColor(score: number): string {
  if (score < 70) return '#e74c3c';   // kırmızı — berbat
  if (score < 85) return '#e67e22';   // turuncu — vasat
  if (score < 100) return '#2ecc71';  // yeşil — daha iyi olabilirsin
  return '#5dade2';                   // açık mavi — mükemmel
}

export function getScoreEmoji(score: number): string {
  if (score < 70) return '😞';
  if (score < 85) return '😐';
  if (score < 100) return '🙂';
  return '🏆';
}

// Aylık ortalama (sadece doldurulmuş günler)
export function calcMonthAverage(entries: DailyEntry[]): number {
  const filled = entries.filter((e) => e.daily_score > 0);
  if (filled.length === 0) return 0;
  return filled.reduce((sum, e) => sum + e.daily_score, 0) / filled.length;
}
