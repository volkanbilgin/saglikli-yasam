import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { DailyEntry } from '../../db/database';
import { getScoreColor } from '../../utils/scoring';

interface Props {
  entries: DailyEntry[];
  monthlyAvg: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LABEL_WIDTH = 28;   // Sol taraftaki gün etiketi
const SCORE_WIDTH = 32;   // Sağ taraftaki puan etiketi
const CHART_WIDTH = SCREEN_WIDTH - 32 - 24 - LABEL_WIDTH - SCORE_WIDTH; // kart padding dahil
const BAR_HEIGHT = 16;
const BAR_GAP = 5;

const LINES = [
  { score: 50,  label: 'Berbat',    color: '#e74c3c' },
  { score: 70,  label: 'Vasat',     color: '#e67e22' },
  { score: 85,  label: 'İyi',       color: '#2ecc71' },
  { score: 100, label: 'Mükemmel',  color: '#5dade2' },
];

export default function DailyScoreChart({ entries, monthlyAvg }: Props) {
  const filled = entries.filter((e) => e.daily_score > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (filled.length === 0) return null;

  const maxVal = Math.max(...filled.map((e) => e.daily_score));
  const MAX_SCORE = Math.ceil(maxVal / 10) * 10;

  function xPos(score: number): number {
    return (Math.min(score, MAX_SCORE) / MAX_SCORE) * CHART_WIDTH;
  }

  const xLabels = [0, 50, 70, 85, 100];
  if (MAX_SCORE > 100) xLabels.push(MAX_SCORE);

  const totalHeight = filled.length * (BAR_HEIGHT + BAR_GAP);

  return (
    <View style={styles.wrapper}>
      {/* X ekseni etiketleri (üstte) */}
      <View style={styles.xAxisTop}>
        <View style={{ width: LABEL_WIDTH }} />
        <View style={[styles.xLabels, { width: CHART_WIDTH }]}>
          {xLabels.map((v) => (
            <Text
              key={v}
              style={[styles.xLabel, { left: xPos(v) - 8 }]}
            >
              {v}
            </Text>
          ))}
        </View>
      </View>

      {/* Grafik alanı */}
      <ScrollView
        style={{ maxHeight: 400 }}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View style={[styles.chartArea, { height: totalHeight }]}>
          {/* Sol: gün etiketleri */}
          <View style={[styles.yLabels, { height: totalHeight }]}>
            {filled.map((e, i) => {
              const dayNum = e.date.split('-')[2];
              return (
                <Text
                  key={e.date}
                  style={[styles.yLabel, { top: i * (BAR_HEIGHT + BAR_GAP) }]}
                >
                  {dayNum}
                </Text>
              );
            })}
          </View>

          {/* Orta: barlar + kategori çizgileri */}
          <View style={[styles.barsArea, { height: totalHeight, width: CHART_WIDTH }]}>
            {/* Aylık ortalama çizgisi */}
            {monthlyAvg > 0 && (
              <View style={[styles.avgLine, { left: xPos(monthlyAvg), height: totalHeight }]}>
                <Text style={styles.avgLabel}>Ort: {monthlyAvg.toFixed(1)}</Text>
              </View>
            )}

            {/* Kategori çizgileri (absolute) */}
            {LINES.map((line) => (
              <View
                key={line.score}
                style={[styles.catLine, { left: xPos(line.score), height: totalHeight, borderColor: line.color }]}
              >
                <Text style={[styles.catLabel, { color: line.color }]}>{line.label}</Text>
              </View>
            ))}

            {/* Barlar */}
            {filled.map((e, i) => {
              const w = xPos(e.daily_score);
              const color = getScoreColor(e.daily_score);
              return (
                <View
                  key={e.date}
                  style={[
                    styles.bar,
                    {
                      top: i * (BAR_HEIGHT + BAR_GAP),
                      width: w,
                      height: BAR_HEIGHT,
                      backgroundColor: color,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Sağ: puan etiketleri */}
          <View style={[styles.scoreLabels, { height: totalHeight }]}>
            {filled.map((e, i) => (
              <Text
                key={e.date}
                style={[
                  styles.scoreLabel,
                  {
                    top: i * (BAR_HEIGHT + BAR_GAP),
                    color: getScoreColor(e.daily_score),
                  },
                ]}
              >
                {e.daily_score.toFixed(0)}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {},
  xAxisTop: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  xLabels: {
    position: 'relative',
    height: 14,
  },
  xLabel: {
    position: 'absolute',
    color: '#555',
    fontSize: 9,
    width: 20,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
  },
  yLabels: {
    width: LABEL_WIDTH,
    position: 'relative',
  },
  yLabel: {
    position: 'absolute',
    color: '#888',
    fontSize: 10,
    width: LABEL_WIDTH,
    textAlign: 'right',
    paddingRight: 4,
    lineHeight: BAR_HEIGHT,
  },
  barsArea: {
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 4,
  },
  catLine: {
    position: 'absolute',
    top: 0,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  catLabel: {
    fontSize: 7,
    fontWeight: '600',
    position: 'absolute',
    top: 2,
    left: 2,
  },
  bar: {
    position: 'absolute',
    left: 0,
    borderRadius: 3,
    opacity: 0.9,
  },
  scoreLabels: {
    width: SCORE_WIDTH,
    position: 'relative',
    paddingLeft: 4,
  },
  scoreLabel: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: BAR_HEIGHT,
  },
  avgLine: {
    position: 'absolute',
    top: 0,
    borderLeftWidth: 2,
    borderColor: '#fff',
    opacity: 0.7,
  },
  avgLabel: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
    position: 'absolute',
    top: 2,
    left: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 2,
    borderRadius: 2,
  },
});
