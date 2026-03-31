import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { calcSocialMediaScore } from '../utils/scoring';

interface Props {
  minutes: number;
  onChange: (m: number) => void;
}

export default function SocialMediaSlider({ minutes, onChange }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(String(minutes));
  const score = calcSocialMediaScore(minutes);
  const isGood = minutes <= 50;

  const presets: number[] = [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>📱</Text>
        <View style={styles.titleArea}>
          <Text style={styles.title}>Sosyal Medya</Text>
          <Text style={styles.subtitle}>Hedef: ≤50 dk</Text>
        </View>
        <Text style={[styles.score, score >= 0 ? styles.positive : styles.negative]}>
          {score >= 0 ? '+' : ''}{score.toFixed(1)}
        </Text>
      </View>

      <View style={styles.inputRow}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, minutes === p && styles.presetActive]}
            onPress={() => onChange(p)}
          >
            <Text style={[styles.presetText, minutes === p && styles.presetTextActive]}>
              {p}dk
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.manualRow}>
        <Text style={styles.manualLabel}>Elle gir:</Text>
        <TextInput
          style={styles.manualInput}
          value={editing ? text : String(minutes)}
          onChangeText={(t) => { setEditing(true); setText(t); }}
          onBlur={() => {
            const v = parseInt(text, 10);
            if (!isNaN(v)) onChange(Math.max(0, v));
            setEditing(false);
          }}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Text style={styles.manualUnit}>dk</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min((minutes / 120) * 100, 100)}%`,
              backgroundColor: isGood ? '#2ecc71' : '#e74c3c',
            },
          ]}
        />
        <View style={styles.targetLine} />
      </View>
      <View style={styles.barLabels}>
        <Text style={styles.barLabel}>0</Text>
        <Text style={[styles.barLabel, { color: '#f1c40f' }]}>50 dk hedef</Text>
        <Text style={styles.barLabel}>120+</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  icon: { fontSize: 20 },
  titleArea: { flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '600' },
  subtitle: { color: '#666', fontSize: 11, marginTop: 1 },
  score: { fontSize: 15, fontWeight: '700' },
  positive: { color: '#2ecc71' },
  negative: { color: '#e74c3c' },
  inputRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  preset: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  presetActive: {
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderColor: '#2ecc71',
  },
  presetText: { color: '#888', fontSize: 12 },
  presetTextActive: { color: '#2ecc71', fontWeight: '700' },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  manualLabel: { color: '#666', fontSize: 12 },
  manualInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: '#444',
    minWidth: 60,
    textAlign: 'center',
  },
  manualUnit: { color: '#666', fontSize: 12 },
  barBg: {
    height: 6,
    backgroundColor: '#1e1e2e',
    borderRadius: 3,
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 3,
  },
  targetLine: {
    position: 'absolute',
    left: `${(50 / 120) * 100}%` as unknown as number,
    top: -3,
    width: 2,
    height: 12,
    backgroundColor: '#f1c40f',
    borderRadius: 1,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  barLabel: { color: '#444', fontSize: 10 },
});
