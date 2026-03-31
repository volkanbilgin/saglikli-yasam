import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  getEntriesForMonth, DailyEntry, getMonthNote, saveMonthNote,
} from '../../src/db/database';
import {
  getScoreColor, getScoreLabel, calcMonthAverage,
} from '../../src/utils/scoring';
import {
  monthName, getDaysInMonth, toDateStr, isWeekend, formatDisplayDate,
} from '../../src/utils/dateHelpers';
import { useSelectedDate } from '../../src/context/DateContext';
import ScoreRing from '../../src/components/ScoreRing';
import ActivityPieCharts from '../../src/components/charts/ActivityPieCharts';
import DailyScoreChart from '../../src/components/charts/DailyScoreChart';
import WeekdayChart from '../../src/components/charts/WeekdayChart';
import MonthlyComparisonChart from '../../src/components/charts/MonthlyComparisonChart';

export default function HistoryScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [entries, setEntries] = useState<Map<string, DailyEntry>>(new Map());
  const [prevMonthsAvg, setPrevMonthsAvg] = useState<{ label: string; avg: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthNote, setMonthNote] = useState('');
  const [detailEntry, setDetailEntry] = useState<DailyEntry | null>(null);
  const { setSelectedDate } = useSelectedDate();
  const router = useRouter();

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  const load = useCallback(async () => {
    setLoading(true);

    // Bu ayın verileri
    const [rows, note] = await Promise.all([
      getEntriesForMonth(year, month),
      getMonthNote(yearMonth),
    ]);
    const map = new Map<string, DailyEntry>();
    rows.forEach((r) => map.set(r.date, r));
    setEntries(map);
    setMonthNote(note);

    // Önceki 2 ayın ortalamaları
    const prevData: { label: string; avg: number }[] = [];
    for (let i = 2; i >= 1; i--) {
      let m = month - i;
      let y = year;
      if (m <= 0) { m += 12; y -= 1; }
      if (y >= 2026) { // Veri olan yıl kontrolü
        const pRows = await getEntriesForMonth(y, m);
        const filled = pRows.filter((e) => e.daily_score > 0);
        prevData.push({ label: monthName(m).substring(0, 3), avg: calcMonthAverage(filled) });
      }
    }
    // Bu ay
    const filledNow = rows.filter((e) => e.daily_score > 0);
    setPrevMonthsAvg([
      ...prevData,
      { label: monthName(month).substring(0, 3), avg: calcMonthAverage(filledNow) },
    ]);

    setLoading(false);
  }, [year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function goMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth() + 1)) return;
    setMonth(m);
    setYear(y);
  }

  function handleDayTap(dateStr: string) {
    const e = entries.get(dateStr);
    if (e && e.daily_score > 0) {
      setDetailEntry(e);
    } else {
      setSelectedDate(dateStr);
      router.navigate('/(tabs)');
    }
  }

  function goToEdit(dateStr: string) {
    setDetailEntry(null);
    setSelectedDate(dateStr);
    router.navigate('/(tabs)');
  }

  const daysInMonth = getDaysInMonth(year, month);
  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${yearMonth}-${String(d).padStart(2, '0')}`);
  }

  const filledEntries = Array.from(entries.values()).filter((e) => e.daily_score > 0);
  const avg = calcMonthAverage(filledEntries);
  const berbat = filledEntries.filter((e) => e.daily_score < 70).length;
  const vasat = filledEntries.filter((e) => e.daily_score >= 70 && e.daily_score < 85).length;
  const dahaIyi = filledEntries.filter((e) => e.daily_score >= 85 && e.daily_score < 100).length;
  const mukemmel = filledEntries.filter((e) => e.daily_score >= 100).length;
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => goMonth(-1)}>
          <Ionicons name="chevron-back" size={22} color="#aaa" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{monthName(month)} {year}</Text>
        <TouchableOpacity
          style={[styles.navBtn, isCurrentMonth && styles.navBtnDisabled]}
          onPress={() => goMonth(1)}
          disabled={isCurrentMonth}
        >
          <Ionicons name="chevron-forward" size={22} color="#aaa" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color="#2ecc71" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Üst stat kartları — satır 1 */}
          <View style={styles.row2}>
            <View style={[styles.bigCard, styles.cardHalf]}>
              <Text style={[styles.bigNum, { color: '#aaa' }]}>{filledEntries.length}</Text>
              <Text style={styles.bigSub}>Kayıtlı Gün</Text>
            </View>
            <View style={[styles.bigCard, styles.cardHalf]}>
              <Text style={[styles.bigNum, { color: getScoreColor(avg) }]}>{avg > 0 ? avg.toFixed(1) : '-'}</Text>
              {avg > 0 && (
                <Text style={[styles.avgLabel, { color: getScoreColor(avg) }]}>{getScoreLabel(avg)}</Text>
              )}
              <Text style={styles.bigSub}>Aylık Ortalama</Text>
            </View>
          </View>

          {/* Satır 2 — 4 kategori */}
          <View style={styles.row4}>
            <ScoreBox label="Berbat" count={berbat} color="#e74c3c" />
            <ScoreBox label="Vasat" count={vasat} color="#e67e22" />
            <ScoreBox label="Daha İyi" count={dahaIyi} color="#2ecc71" />
            <ScoreBox label="Mükemmel" count={mukemmel} color="#5dade2" />
          </View>

          {/* Takvim */}
          <View style={styles.calGrid}>
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
              <Text key={d} style={styles.dayLabel}>{d}</Text>
            ))}
            {Array.from({ length: getFirstDayOffset(year, month) }).map((_, i) => (
              <View key={`e-${i}`} style={styles.calCell} />
            ))}
            {days.map((dateStr) => {
              const e = entries.get(dateStr);
              const score = e?.daily_score ?? 0;
              const hasEntry = score > 0;
              const hasNote = !!(e?.note && e.note.trim().length > 0);
              const dayNum = parseInt(dateStr.split('-')[2], 10);
              const isWknd = isWeekend(dateStr);
              const isNowDay = dateStr === toDateStr(new Date());
              const isFuture = dateStr > toDateStr(new Date());

              return (
                <TouchableOpacity
                  key={dateStr}
                  style={[
                    styles.calCell,
                    hasEntry && { backgroundColor: `${getScoreColor(score)}22` },
                    isNowDay && styles.calCellToday,
                    isFuture && styles.calCellFuture,
                  ]}
                  onPress={() => !isFuture && handleDayTap(dateStr)}
                  disabled={isFuture}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calDayNum,
                    isWknd && styles.weekend,
                    isNowDay && styles.todayNum,
                    isFuture && styles.futureNum,
                  ]}>
                    {dayNum}
                  </Text>
                  {hasEntry && (
                    <Text style={[styles.calScore, { color: getScoreColor(score) }]}>
                      {score.toFixed(0)}
                    </Text>
                  )}
                  {!hasEntry && !isFuture && (
                    <Text style={styles.calEmpty}>+</Text>
                  )}
                  {hasNote && <View style={styles.noteDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Aylık not */}
          <Text style={styles.sectionTitle}>📝 {monthName(month)} Notu</Text>
          <View style={styles.noteBox}>
            <TextInput
              style={styles.noteInput}
              value={monthNote}
              onChangeText={(t) => { setMonthNote(t); saveMonthNote(yearMonth, t); }}
              placeholder={`${monthName(month)} ayı için notlarını yaz...`}
              placeholderTextColor="#444"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Aktivite pasta grafikleri */}
          {filledEntries.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🥧 Aktivite Oranları</Text>
              <ActivityPieCharts entries={filledEntries} year={year} month={month} />
            </>
          )}

          {/* Günlük skor grafiği */}
          {filledEntries.length > 1 && (
            <>
              <Text style={styles.sectionTitle}>📊 Günlük Puanlar</Text>
              <View style={styles.chartCard}>
                <DailyScoreChart entries={filledEntries} monthlyAvg={avg} />
              </View>
            </>
          )}

          {/* Haftanın günlerine göre ortalama */}
          {filledEntries.length >= 7 && (
            <>
              <Text style={styles.sectionTitle}>📅 Günlere Göre Ortalama</Text>
              <View style={styles.chartCard}>
                <WeekdayChart entries={filledEntries} monthlyAvg={avg} />
              </View>
            </>
          )}

          {/* Aylık karşılaştırma */}
          {prevMonthsAvg.filter((m) => m.avg > 0).length >= 2 && (
            <>
              <Text style={styles.sectionTitle}>📆 Aylara Göre Karşılaştırma</Text>
              <View style={styles.chartCard}>
                <MonthlyComparisonChart months={prevMonthsAvg} />
              </View>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {detailEntry && (
        <DayDetailModal
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onEdit={() => goToEdit(detailEntry.date)}
        />
      )}
    </SafeAreaView>
  );
}

// ── Gün Detay Modal ──────────────────────────────────────────────
function DayDetailModal({ entry, onClose, onEdit }: {
  entry: DailyEntry; onClose: () => void; onEdit: () => void;
}) {
  const activities = [
    { label: '🧘 Yoga', value: entry.morning_yoga, pts: 10 },
    { label: '💪 Sabah Mekik+Squat', value: entry.morning_pushup_squat, pts: 10 },
    { label: '💊 Sabah Vitamin', value: entry.morning_vitamins, pts: 10 },
    { label: '🦷 Sabah Diş', value: entry.morning_teeth, pts: 10 },
    { label: '📖 Sabah İngilizce', value: entry.morning_english, pts: 10 },
    { label: '💊 Akşam Vitamin', value: entry.evening_vitamins, pts: 10 },
    { label: '💪 Akşam Mekik+Squat', value: entry.evening_pushup_squat, pts: 10 },
    { label: '🦷 Akşam Diş', value: entry.evening_teeth, pts: 10 },
    { label: '📚 İngilizce Kitap', value: entry.evening_english, pts: 10 },
    { label: '💼 Mesleki Çalışma', value: entry.evening_professional, pts: 10 },
    { label: '🏋️ Spor', value: entry.exercise_done, pts: 20 },
    { label: '🚶 Yürüyüş', value: entry.walk_km, pts: 2, unit: 'km' },
    { label: '💧 Su', value: entry.water_glasses, pts: 2, unit: 'bardak' },
    { label: '📕 Kitap', value: entry.book_pages, pts: 1, unit: 'sayfa' },
  ];

  return (
    <Modal visible transparent animationType="slide">
      <Pressable style={modalS.overlay} onPress={onClose}>
        <Pressable style={modalS.sheet} onPress={() => {}}>
          <View style={modalS.handle} />
          <View style={modalS.topRow}>
            <View>
              <Text style={modalS.dateText}>{formatDisplayDate(entry.date)}</Text>
              <Text style={[modalS.labelText, { color: getScoreColor(entry.daily_score) }]}>
                {getScoreLabel(entry.daily_score)}
              </Text>
            </View>
            <ScoreRing score={entry.daily_score} size={90} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {activities.filter((a) => a.value > 0).map((a) => (
              <View key={a.label} style={modalS.actRow}>
                <Text style={modalS.actLabel}>{a.label}</Text>
                <Text style={modalS.actValue}>
                  {a.unit ? `${a.value} ${a.unit}` : a.value >= 1 ? '✓' : `${Math.round(a.value * 100)}%`}
                </Text>
                <Text style={modalS.actPts}>+{(a.value * a.pts).toFixed(1)}</Text>
              </View>
            ))}
            <View style={modalS.actRow}>
              <Text style={modalS.actLabel}>📱 Sosyal Medya</Text>
              <Text style={modalS.actValue}>{entry.social_media_minutes} dk</Text>
              <Text style={[modalS.actPts, { color: entry.social_media_minutes <= 50 ? '#2ecc71' : '#e74c3c' }]}>
                {((50 - entry.social_media_minutes) * 0.167).toFixed(1)}
              </Text>
            </View>
            {entry.note ? (
              <View style={modalS.noteSection}>
                <Text style={modalS.noteTitle}>📝 Not</Text>
                <Text style={modalS.noteText}>{entry.note}</Text>
              </View>
            ) : null}
            <View style={modalS.actions}>
              <TouchableOpacity style={modalS.editBtn} onPress={onEdit}>
                <Ionicons name="pencil" size={16} color="#2ecc71" />
                <Text style={modalS.editText}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalS.closeBtn} onPress={onClose}>
                <Text style={modalS.closeText}>Kapat</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: 20 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ScoreBox({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[boxS.box, { borderColor: `${color}40` }]}>
      <Text style={[boxS.count, { color }]}>{count}</Text>
      <Text style={[boxS.label, { color }]}>{label}</Text>
    </View>
  );
}

function getFirstDayOffset(year: number, month: number): number {
  const d = new Date(year, month - 1, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const boxS = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  count: { fontSize: 20, fontWeight: '800' },
  label: { fontSize: 9, fontWeight: '600', marginTop: 2, textAlign: 'center' },
});

const modalS = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#1a1a2e', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateText: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  labelText: { fontSize: 13, fontWeight: '600' },
  actRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  actLabel: { flex: 1, color: '#ccc', fontSize: 13 },
  actValue: { color: '#888', fontSize: 12, marginRight: 8 },
  actPts: { color: '#2ecc71', fontSize: 13, fontWeight: '700', width: 40, textAlign: 'right' },
  noteSection: { marginTop: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 },
  noteTitle: { color: '#888', fontSize: 12, marginBottom: 6 },
  noteText: { color: '#ddd', fontSize: 14, lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  editBtn: { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(46,204,113,0.1)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2ecc71' },
  editText: { color: '#2ecc71', fontWeight: '600' },
  closeBtn: { flex: 1, alignItems: 'center', backgroundColor: '#252535', borderRadius: 12, padding: 12 },
  closeText: { color: '#888', fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  navBtnDisabled: { opacity: 0.3 },
  monthTitle: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 17, fontWeight: '700' },
  content: { padding: 16 },
  row2: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  row4: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  bigCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 14, alignItems: 'center' },
  cardHalf: { flex: 1 },
  bigNum: { fontSize: 28, fontWeight: '800' },
  avgLabel: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  bigSub: { color: '#666', fontSize: 11, marginTop: 4, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 20 },
  dayLabel: { width: '13%', textAlign: 'center', color: '#555', fontSize: 11, marginBottom: 4, fontWeight: '600' },
  calCell: { width: '13%', aspectRatio: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.03)' },
  calCellToday: { borderWidth: 1.5, borderColor: '#2ecc71' },
  calCellFuture: { opacity: 0.2 },
  calDayNum: { color: '#aaa', fontSize: 11, fontWeight: '600' },
  calScore: { fontSize: 9, fontWeight: '700', marginTop: 1 },
  calEmpty: { fontSize: 10, color: '#333', marginTop: 1 },
  noteDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#666', marginTop: 2,
  },
  weekend: { color: '#666' },
  todayNum: { color: '#2ecc71' },
  futureNum: { color: '#333' },
  sectionTitle: { color: '#888', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  noteBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 12, marginBottom: 20 },
  noteInput: { color: '#fff', fontSize: 14, lineHeight: 22, minHeight: 80 },
  chartCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
});
