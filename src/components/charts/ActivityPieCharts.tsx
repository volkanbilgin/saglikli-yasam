import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DailyEntry } from '../../db/database';
import MiniPie from './MiniPie';

interface Props {
  entries: DailyEntry[];
  year: number;
  month: number;
}

// --- Dönem istatistikleri ---
function calcPeriodStats(year: number, month: number) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const lastDay = isCurrentMonth
    ? today.getDate()
    : new Date(year, month, 0).getDate(); // ayın son günü

  let totalDays = 0;
  let weekdays = 0;

  for (let d = 1; d <= lastDay; d++) {
    const date = new Date(year, month - 1, d);
    totalDays++;
    const dow = date.getDay();
    if (dow >= 1 && dow <= 5) weekdays++;
  }

  // Hafta sayısı (weekdays / 5 = tam hafta sayısı)
  const weeks = weekdays / 5;

  return { totalDays, weekdays, weeks };
}

// --- Pct hesaplama yardımcıları ---
function sumField(entries: DailyEntry[], field: keyof DailyEntry): number {
  return entries.reduce((s, e) => s + (Number(e[field]) || 0), 0);
}

// Kaç gün o aktivite yapıldı (0'dan büyük)
function daysActive(entries: DailyEntry[], field: keyof DailyEntry): number {
  return entries.filter((e) => Number(e[field]) > 0).length;
}

// Hedef bazlı oran (hedef 0 ise 0 döndür)
function pctOf(actual: number, target: number): number {
  if (target <= 0) return 0;
  return (actual / target) * 100;
}

const BLUE   = '#4A90D9';
const ORANGE = '#E8821A';
const GREEN  = '#27AE60';

export default function ActivityPieCharts({ entries, year, month }: Props) {
  if (entries.length === 0) return null;

  const { totalDays, weekdays, weeks } = calcPeriodStats(year, month);

  // ── SABAH ──────────────────────────────────────────────────────
  // sumField kullanılıyor: kısmi değerleri (0.33, 0.5 vb.) doğru hesaplar
  const morningItems = [
    {
      label: 'Yapılan Yoga',        sublabel: 'Yapılmamış Yoga',
      pct: pctOf(sumField(entries, 'morning_yoga'), totalDays),
      color: BLUE,
    },
    {
      label: 'Sabah Mekik',         sublabel: 'Yapılmamış',
      pct: pctOf(sumField(entries, 'morning_pushup_squat'), totalDays),
      color: BLUE,
    },
    {
      label: 'Sabah Vitamin',       sublabel: 'Alınmamış',
      pct: pctOf(sumField(entries, 'morning_vitamins'), totalDays),
      color: BLUE,
    },
    {
      label: 'Sabah Diş',           sublabel: 'Fırçalanmamış',
      pct: pctOf(sumField(entries, 'morning_teeth'), totalDays),
      color: BLUE,
    },
    {
      label: 'Sabah İngilizce',     sublabel: 'Çalışılmamış',
      pct: pctOf(sumField(entries, 'morning_english'), weekdays),
      color: BLUE,
    },
  ];

  // ── AKŞAM ──────────────────────────────────────────────────────
  const eveningItems = [
    {
      label: 'Mesleki Çalışma',     sublabel: 'Yapılmamış',
      pct: pctOf(sumField(entries, 'evening_professional'), weeks * 4),
      color: ORANGE,
    },
    {
      label: 'Akşam Mekik',         sublabel: 'Yapılmamış',
      pct: pctOf(sumField(entries, 'evening_pushup_squat'), totalDays),
      color: ORANGE,
    },
    {
      label: 'Akşam Vitamin',       sublabel: 'Alınmamış',
      pct: pctOf(sumField(entries, 'evening_vitamins'), totalDays),
      color: ORANGE,
    },
    {
      label: 'Akşam Diş',           sublabel: 'Fırçalanmamış',
      pct: pctOf(sumField(entries, 'evening_teeth'), totalDays),
      color: ORANGE,
    },
    {
      label: 'İngilizce Kitap',     sublabel: 'Okunmamış',
      pct: pctOf(sumField(entries, 'evening_english'), weekdays),
      color: ORANGE,
    },
  ];

  // ── GÜNLÜK ─────────────────────────────────────────────────────
  const dailyItems = [
    {
      // Hedef: günde 5 bardak × toplam gün
      label: 'İçilen Su',           sublabel: `Hedef: ${Math.round(totalDays * 5)} bardak`,
      pct: pctOf(sumField(entries, 'water_glasses'), totalDays * 5),
      color: GREEN,
    },
    {
      // Hedef: haftaiçi × 15 sayfa
      label: 'Okunan Kitap',        sublabel: `Hedef: ${weekdays * 15} sayfa`,
      pct: pctOf(sumField(entries, 'book_pages'), weekdays * 15),
      color: GREEN,
    },
    {
      // Haftada 4 gün → weeks * 4
      label: 'Yapılan Spor',        sublabel: `Hedef: ${Math.round(weeks * 4)} gün`,
      pct: pctOf(sumField(entries, 'exercise_done'), weeks * 4),
      color: GREEN,
    },
    {
      // Haftaiçi her gün 10 km → weekdays * 10
      label: 'Yürüyüş / Koşu',     sublabel: `Hedef: ${weekdays * 10} km`,
      pct: pctOf(sumField(entries, 'walk_km'), weekdays * 10),
      color: GREEN,
    },
  ];

  return (
    <View style={styles.container}>
      <GroupLabel label="☀️ Sabah" />
      <PieRow items={morningItems} />
      <GroupLabel label="🌙 Akşam" />
      <PieRow items={eveningItems} />
      <GroupLabel label="📊 Günlük" />
      <PieRow items={dailyItems} />
    </View>
  );
}

function GroupLabel({ label }: { label: string }) {
  return <Text style={styles.groupLabel}>{label}</Text>;
}

function PieRow({ items }: {
  items: { label: string; sublabel: string; pct: number; color: string }[];
}) {
  return (
    <View style={styles.row}>
      {items.map((item) => (
        <MiniPie
          key={item.label}
          pct={item.pct}
          color={item.color}
          label={item.label}
          sublabel={item.sublabel}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  groupLabel: {
    color: '#888', fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginTop: 4,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});
