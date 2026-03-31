import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { DailyEntry } from '../../db/database';
import { getScoreColor } from '../../utils/scoring';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 150;
const MAX_SCORE = 120;
const BOTTOM_LABEL_H = 20;
const LEFT_LABEL_W = 28;
const CHART_INNER_WIDTH = SCREEN_WIDTH - 32 - 24 - LEFT_LABEL_W; // kart padding dahil

const DAY_NAMES = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // JS getDay() → Pzt-Paz sırası

function yPct(score: number): number {
  return (Math.min(score, MAX_SCORE) / MAX_SCORE) * CHART_HEIGHT;
}

interface Props {
  entries: DailyEntry[];
  monthlyAvg: number;
}

export default function WeekdayChart({ entries, monthlyAvg }: Props) {
  const filled = entries.filter((e) => e.daily_score > 0);
  if (filled.length < 3) return null;

  const avgs = DAY_ORDER.map((dayIndex) => {
    const dayEntries = filled.filter((e) => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getDay() === dayIndex;
    });
    if (dayEntries.length === 0) return 0;
    return dayEntries.reduce((s, e) => s + e.daily_score, 0) / dayEntries.length;
  });

  const barWidth = (CHART_INNER_WIDTH / 7) - 6;
  const avgLineY = CHART_HEIGHT - yPct(monthlyAvg);

  return (
    <View style={styles.wrapper}>
      {/* Y ekseni etiketleri + grafik */}
      <View style={styles.row}>
        {/* Y etiketleri */}
        <View style={[styles.yAxis, { height: CHART_HEIGHT }]}>
          {[120, 100, 85, 70, 0].map((v) => (
            <Text
              key={v}
              style={[styles.yLabel, { bottom: yPct(v) - 6 }]}
            >
              {v}
            </Text>
          ))}
        </View>

        {/* Bar alanı */}
        <View style={[styles.chartArea, { height: CHART_HEIGHT, width: CHART_INNER_WIDTH }]}>
          {/* Arka plan yatay çizgiler */}
          {[70, 85, 100].map((v) => (
            <View key={v} style={[styles.gridLine, { bottom: yPct(v) }]} />
          ))}

          {/* Aylık ortalama çizgisi */}
          {monthlyAvg > 0 && (
            <View style={[styles.avgLine, { bottom: yPct(monthlyAvg) }]}>
              <Text style={styles.avgLabel}>Ort: {monthlyAvg.toFixed(1)}</Text>
            </View>
          )}

          {/* Barlar */}
          <View style={styles.barsRow}>
            {avgs.map((avg, i) => {
              const h = yPct(avg);
              const color = avg > 0 ? getScoreColor(avg) : '#2a2a3e';
              const isAboveAvg = avg > 0 && avg >= monthlyAvg;
              return (
                <View key={DAY_NAMES[i]} style={styles.barCol}>
                  {avg > 0 && (
                    <Text style={[styles.barValue, { color }]}>
                      {avg.toFixed(0)}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.max(h, 2),
                        width: barWidth,
                        backgroundColor: color,
                        opacity: isAboveAvg ? 1 : 0.5,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X ekseni gün etiketleri */}
      <View style={styles.xAxis}>
        <View style={{ width: LEFT_LABEL_W }} />
        {DAY_NAMES.map((name) => (
          <Text key={name} style={[styles.xLabel, { width: CHART_INNER_WIDTH / 7 }]}>
            {name}
          </Text>
        ))}
      </View>

      {/* Özet tablo */}
      <View style={styles.table}>
        {DAY_NAMES.map((name, i) => (
          <View key={name} style={styles.tableCell}>
            <Text style={styles.tableName}>{name}</Text>
            <Text style={[
              styles.tableVal,
              { color: avgs[i] > 0 ? getScoreColor(avgs[i]) : '#444' },
            ]}>
              {avgs[i] > 0 ? avgs[i].toFixed(1) : '-'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  row: { flexDirection: 'row' },
  yAxis: { width: LEFT_LABEL_W, position: 'relative' },
  yLabel: {
    position: 'absolute',
    color: '#555',
    fontSize: 9,
    width: LEFT_LABEL_W - 2,
    textAlign: 'right',
  },
  chartArea: { position: 'relative' },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avgLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#fff',
    opacity: 0.8,
    zIndex: 10,
  },
  avgLabel: {
    position: 'absolute',
    right: 4,
    top: -12,
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 3,
    borderRadius: 3,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
  },
  barCol: { alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { fontSize: 8, fontWeight: '700', marginBottom: 2 },
  bar: { borderRadius: 3 },
  xAxis: {
    flexDirection: 'row',
    marginTop: 4,
  },
  xLabel: {
    color: '#888',
    fontSize: 10,
    textAlign: 'center',
  },
  table: { flexDirection: 'row', marginTop: 8, gap: 4 },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 8,
    padding: 6,
  },
  tableName: { color: '#666', fontSize: 9, marginBottom: 2 },
  tableVal: { fontSize: 11, fontWeight: '700' },
});
