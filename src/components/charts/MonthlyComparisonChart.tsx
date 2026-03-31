import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { getScoreColor } from '../../utils/scoring';

const { width } = Dimensions.get('window');

interface MonthData {
  label: string;   // "Oca", "Şub" vb.
  avg: number;
}

interface Props {
  months: MonthData[]; // 1, 2 veya 3 ay verisi
}

export default function MonthlyComparisonChart({ months }: Props) {
  const valid = months.filter((m) => m.avg > 0);
  if (valid.length < 2) return null; // en az 2 ay olsun

  const data = {
    labels: valid.map((m) => m.label),
    datasets: [{ data: valid.map((m) => parseFloat(m.avg.toFixed(1))) }],
  };

  return (
    <View style={styles.wrapper}>
      <BarChart
        data={data}
        width={width - 32}
        height={160}
        chartConfig={{
          backgroundColor: '#1a1a2e',
          backgroundGradientFrom: '#1a1a2e',
          backgroundGradientTo: '#1a1a2e',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(93,173,226,${opacity})`,
          labelColor: (opacity = 1) => `rgba(150,150,180,${opacity})`,
          propsForBackgroundLines: { stroke: 'rgba(255,255,255,0.06)' },
        }}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
        yAxisLabel=""
        yAxisSuffix=""
      />

      {/* Ay karşılaştırma tablosu */}
      <View style={styles.row}>
        {valid.map((m) => (
          <View key={m.label} style={styles.cell}>
            <Text style={styles.cellLabel}>{m.label}</Text>
            <Text style={[styles.cellValue, { color: getScoreColor(m.avg) }]}>
              {m.avg.toFixed(1)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  chart: { borderRadius: 8 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cell: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  cellLabel: { color: '#888', fontSize: 12, marginBottom: 2 },
  cellValue: { fontSize: 20, fontWeight: '800' },
});
