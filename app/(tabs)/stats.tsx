import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions, ActivityIndicator,
  TouchableOpacity, Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { getEntriesForYear, DailyEntry, exportAllData, importAllData } from '../../src/db/database';
import { getScoreColor, getScoreLabel } from '../../src/utils/scoring';
import { monthName } from '../../src/utils/dateHelpers';
import WeekdayChart from '../../src/components/charts/WeekdayChart';
import MiniPie from '../../src/components/charts/MiniPie';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_H = 180;
const MAX_SCORE = 120;
const LEFT_W = 28;
// Outer padding 32 + card padding 32 + y-axis 28
const CHART_W = SCREEN_WIDTH - 32 - 32 - LEFT_W;

const CATEGORY_LINES = [
  { score: 100, label: 'Mükemmel', color: '#5dade2' },
  { score: 85,  label: 'İyi',      color: '#2ecc71' },
  { score: 70,  label: 'Vasat',    color: '#e67e22' },
  { score: 50,  label: 'Berbat',   color: '#e74c3c' },
];

const BLUE   = '#4A90D9';
const ORANGE = '#E8821A';
const GREEN  = '#27AE60';

// ---------- Yardımcı fonksiyonlar ----------
function sumField(entries: DailyEntry[], field: keyof DailyEntry): number {
  return entries.reduce((s, e) => s + (Number(e[field]) || 0), 0);
}
function pctOf(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min((actual / target) * 100, 100);
}
function yPos(score: number, h: number = CHART_H): number {
  return (Math.min(score, MAX_SCORE) / MAX_SCORE) * h;
}
function getWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
function getYearStats(now: Date) {
  const year = now.getFullYear();
  let totalDays = 0, weekdays = 0;
  for (let m = 1; m <= now.getMonth() + 1; m++) {
    const lastDay = m === now.getMonth() + 1 ? now.getDate() : new Date(year, m, 0).getDate();
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, m - 1, d);
      if (date <= now) {
        totalDays++;
        const dow = date.getDay();
        if (dow >= 1 && dow <= 5) weekdays++;
      }
    }
  }
  return { totalDays, weekdays, weeks: weekdays / 5 };
}

// ---------- Ana bileşen ----------
export default function StatsScreen() {
  const now = new Date();
  const [yearEntries, setYearEntries] = useState<DailyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function load() {
        setLoading(true);
        const ye = await getEntriesForYear(now.getFullYear());
        setYearEntries(ye);
        setLoading(false);
      }
      load();
    }, [])
  );

  async function handleExport() {
    try {
      setTransferring(true);
      const json = await exportAllData();
      const date = new Date().toISOString().split('T')[0];
      const path = FileSystem.documentDirectory + `saglikli_yasam_${date}.json`;
      await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Share.share({ url: path, title: 'Sağlıklı Yaşam Yedek' });
    } catch (e: any) {
      // Dosya paylaşımı çalışmazsa JSON'u metin olarak paylaş
      try {
        const json = await exportAllData();
        await Share.share({ message: json, title: 'Sağlıklı Yaşam Yedek' });
      } catch (e2) {
        Alert.alert('Hata', 'Dışa aktarma başarısız: ' + String(e2));
      }
    } finally {
      setTransferring(false);
    }
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      Alert.alert(
        'Veriyi İçe Aktar',
        'Mevcut veriler silinmeyecek, yeni veriler üzerine eklenecek. Devam edilsin mi?',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Aktar',
            style: 'destructive',
            onPress: async () => {
              try {
                setTransferring(true);
                const asset = result.assets[0];
                let content: string;
                try {
                  content = await FileSystem.readAsStringAsync(asset.uri);
                } catch {
                  // Bazen URI'yi önce cache'e kopyalamak gerekir
                  const dest = FileSystem.cacheDirectory + 'import_temp.json';
                  await FileSystem.copyAsync({ from: asset.uri, to: dest });
                  content = await FileSystem.readAsStringAsync(dest);
                }
                const count = await importAllData(content);
                Alert.alert('Başarılı ✅', `${count} kayıt aktarıldı.\nUygulamayı kapatıp açarsan veriler görünür.`);
              } catch (e: any) {
                Alert.alert('Hata', String(e?.message ?? e));
              } finally {
                setTransferring(false);
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Hata', 'İçe aktarma başarısız.');
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2ecc71" size="large" />
      </View>
    );
  }

  const scored = yearEntries.filter((e) => e.daily_score > 0);

  if (scored.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: '#666' }}>Henüz veri yok</Text>
        </View>
      </SafeAreaView>
    );
  }

  const yearAvg = scored.reduce((s, e) => s + e.daily_score, 0) / scored.length;
  const yearAvgColor = getScoreColor(yearAvg);
  const yearAvgLabel = getScoreLabel(yearAvg);

  // Yürüyüş hedefi
  const totalWalkKm = yearEntries.reduce((s, e) => s + (e.walk_km ?? 0), 0);
  const walkGoal = 1000;
  const walkPct = Math.min((totalWalkKm / walkGoal) * 100, 100);

  // Aylık ortalamalar
  const monthlyData: { month: number; avg: number; label: string }[] = [];
  for (let m = 1; m <= now.getMonth() + 1; m++) {
    const mEntries = scored.filter((e) => parseInt(e.date.split('-')[1], 10) === m);
    const avg = mEntries.length > 0
      ? mEntries.reduce((s, e) => s + e.daily_score, 0) / mEntries.length
      : 0;
    monthlyData.push({ month: m, avg, label: monthName(m).substring(0, 3) });
  }

  // Haftalık ortalamalar
  const weekMap = new Map<string, number[]>();
  scored.forEach((e) => {
    const d = new Date(e.date + 'T00:00:00');
    const key = getWeekKey(d);
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(e.daily_score);
  });
  const weeklyData = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, scores], i) => ({
      label: `H${i + 1}`,
      avg: scores.reduce((s, v) => s + v, 0) / scores.length,
    }));

  // Yıl başından bugüne gün/hafta/haftaiçi sayısı
  const { totalDays, weekdays, weeks } = getYearStats(now);

  // Rekorlar
  const maxWater  = scored.reduce((b, e) => e.water_glasses > b.water_glasses ? e : b, scored[0]);
  const maxBook   = scored.reduce((b, e) => e.book_pages > b.book_pages ? e : b, scored[0]);
  const maxWalk   = scored.reduce((b, e) => (e.walk_km ?? 0) > (b.walk_km ?? 0) ? e : b, scored[0]);
  const maxSocial = scored.reduce((b, e) => e.social_media_minutes > b.social_media_minutes ? e : b, scored[0]);
  const minSocial = scored.reduce((b, e) => e.social_media_minutes < b.social_media_minutes ? e : b, scored[0]);
  const avgSocial = scored.reduce((s, e) => s + e.social_media_minutes, 0) / scored.length;
  const maxScore  = scored.reduce((b, e) => e.daily_score > b.daily_score ? e : b, scored[0]);
  const minScore  = scored.reduce((b, e) => e.daily_score < b.daily_score ? e : b, scored[0]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>İstatistikler {now.getFullYear()}</Text>

        {/* a) Yıllık genel ortalama */}
        <View style={[styles.card, styles.centerCard]}>
          <Text style={styles.sectionLabel}>Yıllık Hayat Kalitesi Ortalaması</Text>
          <Text style={[styles.bigScore, { color: yearAvgColor }]}>{yearAvg.toFixed(1)}</Text>
          <Text style={[styles.categoryLabel, { color: yearAvgColor }]}>{yearAvgLabel}</Text>
          <Text style={styles.sectionSub}>{scored.length} gün kayıt</Text>
        </View>

        {/* Yürüyüş hedefi */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🚶 Yürüyüş Hedefi</Text>
            <Text style={styles.cardValue}>{totalWalkKm.toFixed(1)} / {walkGoal} km</Text>
          </View>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${walkPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{walkPct.toFixed(1)}% tamamlandı</Text>
        </View>

        {/* b) Günlere göre ortalama */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📅 Günlere Göre Ortalama</Text>
          <WeekdayChart entries={yearEntries} monthlyAvg={yearAvg} />
        </View>

        {/* c) Haftalık ortalama */}
        {weeklyData.length >= 2 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📆 Haftalık Ortalama Puanlar</Text>
            <WeeklyBarChart data={weeklyData} avgLine={yearAvg} />
          </View>
        )}

        {/* d) Aylık ortalama */}
        {monthlyData.filter((m) => m.avg > 0).length >= 1 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Aylık Ortalama Puanlar</Text>
            <MonthlyBarChart data={monthlyData} />
          </View>
        )}

        {/* e-g) Aktivite oranları */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🥧 Aktivite Oranları</Text>
          <YearPieSection
            entries={yearEntries}
            scored={scored}
            totalDays={totalDays}
            weekdays={weekdays}
            weeks={weeks}
          />
        </View>

        {/* h-o) Rekorlar */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏆 Rekorlar</Text>
          <RecordRow icon="💧" label="En fazla su içilen gün"       entry={maxWater}  value={`${maxWater.water_glasses} bardak`} />
          <RecordRow icon="📕" label="En fazla kitap okunan gün"    entry={maxBook}   value={`${maxBook.book_pages} sayfa`} />
          <RecordRow icon="🏃" label="En fazla yürünen gün"         entry={maxWalk}   value={`${maxWalk.walk_km} km`} />
          <RecordRow icon="📱" label="Günlük sosyal medya ortalaması" value={`${avgSocial.toFixed(0)} dk`} scoreColor={avgSocial > 50 ? '#e74c3c' : '#2ecc71'} />
          <RecordRow icon="📈" label="En fazla sosyal medya"        entry={maxSocial} value={`${maxSocial.social_media_minutes} dk`} scoreColor="#e74c3c" />
          <RecordRow icon="📉" label="En az sosyal medya"           entry={minSocial} value={`${minSocial.social_media_minutes} dk`} />
          <RecordRow icon="🏆" label="En yüksek puan"              entry={maxScore}  value={maxScore.daily_score.toFixed(1)} scoreColor={getScoreColor(maxScore.daily_score)} />
          <RecordRow icon="😞" label="En düşük puan"               entry={minScore}  value={minScore.daily_score.toFixed(1)}  scoreColor={getScoreColor(minScore.daily_score)} last />
        </View>

        {/* Veri Yönetimi */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔄 Veri Yönetimi</Text>
          <Text style={xfrStyles.desc}>
            Verilerini başka bir cihaza (iPhone ↔ iPad) AirDrop ile aktarmak için kullan.
          </Text>
          <View style={xfrStyles.row}>
            <TouchableOpacity
              style={[xfrStyles.btn, xfrStyles.exportBtn]}
              onPress={handleExport}
              disabled={transferring}
            >
              <Text style={xfrStyles.btnIcon}>📤</Text>
              <Text style={xfrStyles.btnText}>Dışa Aktar</Text>
              <Text style={xfrStyles.btnSub}>JSON yedek oluştur</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[xfrStyles.btn, xfrStyles.importBtn]}
              onPress={handleImport}
              disabled={transferring}
            >
              <Text style={xfrStyles.btnIcon}>📥</Text>
              <Text style={xfrStyles.btnText}>İçe Aktar</Text>
              <Text style={xfrStyles.btnSub}>JSON yedek yükle</Text>
            </TouchableOpacity>
          </View>
          {transferring && (
            <ActivityIndicator color="#2ecc71" style={{ marginTop: 12 }} />
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- WeeklyBarChart ----------
interface WeekItem { label: string; avg: number; }
function WeeklyBarChart({ data, avgLine }: { data: WeekItem[]; avgLine: number }) {
  const innerH = 140;
  const bW = Math.max(Math.floor(CHART_W / Math.max(data.length, 1)) - 4, 4);
  return (
    <View style={{ marginBottom: 4 }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: LEFT_W, height: innerH, position: 'relative' }}>
          {[0, 50, 70, 85, 100, 120].map((v) => (
            <Text key={v} style={{
              position: 'absolute', bottom: yPos(v, innerH) - 6,
              color: '#555', fontSize: 8, width: LEFT_W - 2, textAlign: 'right',
            }}>{v}</Text>
          ))}
        </View>
        <View style={{ flex: 1, height: innerH, position: 'relative' }}>
          {CATEGORY_LINES.map(({ score, color }) => (
            <View key={score} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: yPos(score, innerH),
              height: 1, backgroundColor: color, opacity: 0.35,
            }} />
          ))}
          {avgLine > 0 && (
            <View style={{
              position: 'absolute', left: 0, right: 0,
              bottom: yPos(avgLine, innerH),
              height: 2, backgroundColor: '#fff', opacity: 0.7, zIndex: 10,
            }}>
              <Text style={{
                position: 'absolute', right: 2, top: -11,
                color: '#fff', fontSize: 7, fontWeight: '700',
                backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 2, borderRadius: 2,
              }}>Ort: {avgLine.toFixed(1)}</Text>
            </View>
          )}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end',
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%',
            justifyContent: 'space-around', paddingHorizontal: 2,
          }}>
            {data.map(({ label, avg }) => {
              const h = yPos(avg, innerH);
              const color = avg > 0 ? getScoreColor(avg) : '#2a2a3e';
              return (
                <View key={label} style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                  <View style={{
                    height: Math.max(h, 2), width: bW,
                    backgroundColor: color,
                    opacity: avg >= avgLine ? 1 : 0.5,
                    borderRadius: 2,
                  }} />
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4, paddingLeft: LEFT_W }}>
        {data.map(({ label }, i) => (
          <Text key={label} style={{ flex: 1, color: '#555', fontSize: 7, textAlign: 'center' }}>
            {i % 2 === 0 ? label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ---------- MonthlyBarChart ----------
interface MonthItem { month: number; avg: number; label: string; }
function MonthlyBarChart({ data }: { data: MonthItem[] }) {
  const innerH = 180;
  const bW = Math.max(Math.floor(CHART_W / Math.max(data.length, 1)) - 6, 8);
  return (
    <View style={{ marginBottom: 4 }}>
      {/* Özet tablo */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
        {data.map(({ label, avg, month }) => (
          <View key={month} style={{
            backgroundColor: 'rgba(255,255,255,0.04)',
            borderRadius: 6, padding: 6, margin: 2, alignItems: 'center', minWidth: 46,
          }}>
            <Text style={{ color: '#666', fontSize: 9 }}>{label}</Text>
            <Text style={{
              color: avg > 0 ? getScoreColor(avg) : '#333',
              fontSize: 11, fontWeight: '700',
            }}>
              {avg > 0 ? avg.toFixed(1) : '-'}
            </Text>
          </View>
        ))}
      </View>
      {/* Bar grafik */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ width: LEFT_W, height: innerH, position: 'relative' }}>
          {[0, 50, 70, 85, 100, 120].map((v) => (
            <Text key={v} style={{
              position: 'absolute', bottom: yPos(v, innerH) - 6,
              color: '#555', fontSize: 8, width: LEFT_W - 2, textAlign: 'right',
            }}>{v}</Text>
          ))}
        </View>
        <View style={{ flex: 1, height: innerH, position: 'relative' }}>
          {CATEGORY_LINES.map(({ score, label, color }) => (
            <View key={score} style={{
              position: 'absolute', left: 0, right: 0,
              bottom: yPos(score, innerH),
              height: 1, backgroundColor: color, opacity: 0.6,
            }}>
              <Text style={{
                position: 'absolute', right: 2, top: -10,
                color, fontSize: 8, fontWeight: '600',
              }}>{label}</Text>
            </View>
          ))}
          <View style={{
            flexDirection: 'row', alignItems: 'flex-end',
            position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%',
            justifyContent: 'space-around', paddingHorizontal: 4,
          }}>
            {data.map(({ label, avg, month }) => {
              const h = yPos(avg, innerH);
              const color = avg > 0 ? getScoreColor(avg) : '#2a2a3e';
              return (
                <View key={month} style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                  {avg > 0 && (
                    <Text style={{ color, fontSize: 7, fontWeight: '700', marginBottom: 1 }}>
                      {avg.toFixed(1)}
                    </Text>
                  )}
                  <View style={{ height: Math.max(h, 2), width: bW, backgroundColor: color, borderRadius: 2 }} />
                </View>
              );
            })}
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', marginTop: 4, paddingLeft: LEFT_W }}>
        {data.map(({ label, month }) => (
          <Text key={month} style={{ flex: 1, color: '#888', fontSize: 9, textAlign: 'center' }}>{label}</Text>
        ))}
      </View>
    </View>
  );
}

// ---------- YearPieSection ----------
interface YearPieSectionProps {
  entries: DailyEntry[];
  scored: DailyEntry[];
  totalDays: number;
  weekdays: number;
  weeks: number;
}
function YearPieSection({ entries, scored, totalDays, weekdays, weeks }: YearPieSectionProps) {
  const morning = [
    { label: 'Yoga',       sublabel: 'Yapılmamış',    color: BLUE,
      pct: pctOf(sumField(entries, 'morning_yoga'), totalDays) },
    { label: 'Mekik',      sublabel: 'Yapılmamış',    color: BLUE,
      pct: pctOf(sumField(entries, 'morning_pushup_squat'), totalDays) },
    { label: 'Vitamin',    sublabel: 'Alınmamış',     color: BLUE,
      pct: pctOf(sumField(entries, 'morning_vitamins'), totalDays) },
    { label: 'Diş',        sublabel: 'Fırçalanmamış', color: BLUE,
      pct: pctOf(sumField(entries, 'morning_teeth'), totalDays) },
    { label: 'İngilizce',  sublabel: 'Çalışılmamış',  color: BLUE,
      pct: pctOf(sumField(entries, 'morning_english'), weekdays) },
  ];
  const evening = [
    { label: 'Mesleki',        sublabel: 'Yapılmamış',    color: ORANGE,
      pct: pctOf(sumField(entries, 'evening_professional'), weeks * 4) },
    { label: 'Mekik',          sublabel: 'Yapılmamış',    color: ORANGE,
      pct: pctOf(sumField(entries, 'evening_pushup_squat'), totalDays) },
    { label: 'Vitamin',        sublabel: 'Alınmamış',     color: ORANGE,
      pct: pctOf(sumField(entries, 'evening_vitamins'), totalDays) },
    { label: 'Diş',            sublabel: 'Fırçalanmamış', color: ORANGE,
      pct: pctOf(sumField(entries, 'evening_teeth'), totalDays) },
    { label: 'İng. Kitap',     sublabel: 'Okunmamış',     color: ORANGE,
      pct: pctOf(sumField(entries, 'evening_english'), weekdays) },
  ];
  const socialOnTarget = scored.filter((e) => e.social_media_minutes <= 50).length;
  const daily = [
    { label: 'Su',           sublabel: 'Hedef: 5/gün',   color: GREEN,
      pct: pctOf(sumField(entries, 'water_glasses'), totalDays * 5) },
    { label: 'Kitap',        sublabel: 'Hedef: 15/gün',  color: GREEN,
      pct: pctOf(sumField(entries, 'book_pages'), weekdays * 15) },
    { label: 'Spor',         sublabel: `Hedef: 4/hft`,   color: GREEN,
      pct: pctOf(sumField(entries, 'exercise_done'), weeks * 4) },
    { label: 'Yürüyüş',      sublabel: 'Hedef: 10km/gün', color: GREEN,
      pct: pctOf(sumField(entries, 'walk_km'), weekdays * 10) },
    { label: 'Sos. Medya',   sublabel: '≤50 dk hedef',   color: GREEN,
      pct: pctOf(socialOnTarget, scored.length) },
  ];
  return (
    <View>
      <Text style={pieStyles.group}>☀️ SABAH</Text>
      <PieRow items={morning} />
      <Text style={pieStyles.group}>🌙 AKŞAM</Text>
      <PieRow items={evening} />
      <Text style={pieStyles.group}>📊 GÜNLÜK</Text>
      <PieRow items={daily} />
    </View>
  );
}
function PieRow({ items }: { items: { label: string; sublabel: string; pct: number; color: string }[] }) {
  return (
    <View style={{ flexDirection: 'row', marginBottom: 8 }}>
      {items.map((item) => (
        <MiniPie key={item.label} pct={item.pct} color={item.color} label={item.label} sublabel={item.sublabel} />
      ))}
    </View>
  );
}
const pieStyles = StyleSheet.create({
  group: { color: '#888', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6, marginTop: 4 },
});

// ---------- RecordRow ----------
const SHORT_DAYS   = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
const SHORT_MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
function RecordRow({
  icon, label, entry, value, scoreColor, last,
}: {
  icon: string; label: string; entry?: DailyEntry; value: string; scoreColor?: string; last?: boolean;
}) {
  let dateStr = '';
  if (entry) {
    const d = new Date(entry.date + 'T00:00:00');
    dateStr = `${SHORT_DAYS[d.getDay()]}, ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }
  return (
    <View style={[recStyles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={recStyles.icon}>{icon}</Text>
      <View style={recStyles.info}>
        <Text style={recStyles.label}>{label}</Text>
        {dateStr ? <Text style={recStyles.date}>{dateStr}</Text> : null}
      </View>
      <Text style={[recStyles.value, scoreColor ? { color: scoreColor } : undefined]}>{value}</Text>
    </View>
  );
}
const recStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  icon: { fontSize: 18, marginRight: 10 },
  info: { flex: 1 },
  label: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  date: { color: '#555', fontSize: 10, marginTop: 1 },
  value: { color: '#2ecc71', fontSize: 14, fontWeight: '700' },
});

// ---------- Transfer stilleri ----------
const xfrStyles = StyleSheet.create({
  desc: { color: '#666', fontSize: 12, marginBottom: 14, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12 },
  btn: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1,
  },
  exportBtn: { backgroundColor: 'rgba(46,204,113,0.08)', borderColor: 'rgba(46,204,113,0.3)' },
  importBtn: { backgroundColor: 'rgba(93,173,226,0.08)', borderColor: 'rgba(93,173,226,0.3)' },
  btnIcon: { fontSize: 24, marginBottom: 4 },
  btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  btnSub: { color: '#666', fontSize: 10, marginTop: 2 },
});

// ---------- Genel stiller ----------
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a' },
  content: { padding: 16 },
  screenTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 16, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  centerCard: { alignItems: 'center' },
  sectionLabel: { color: '#888', fontSize: 12, marginBottom: 6 },
  bigScore: { fontSize: 56, fontWeight: '800', marginBottom: 4 },
  categoryLabel: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  sectionSub: { color: '#555', fontSize: 11 },
  cardTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardValue: { color: '#2ecc71', fontSize: 14, fontWeight: '700' },
  progressBg: { height: 8, backgroundColor: '#1a1a2e', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  progressFill: { height: '100%', backgroundColor: '#2ecc71', borderRadius: 4 },
  progressLabel: { color: '#666', fontSize: 11 },
});
