import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';

interface Props {
  km: number;
  onChange: (km: number) => void;
}

export default function WalkInput({ km, onChange }: Props) {
  const [text, setText] = useState(km > 0 ? String(km) : '');
  const score = km * 2; // 1km = 2 puan, 10km = 20 puan

  const presets = [2, 4, 6, 8, 10];

  return (
    <View style={[styles.container, km > 0 && styles.active]}>
      <View style={styles.header}>
        <Text style={styles.icon}>🚶</Text>
        <View style={styles.titleArea}>
          <Text style={styles.title}>Yürüyüş / Koşu</Text>
          <Text style={styles.subtitle}>10.000 km yıllık hedef</Text>
        </View>
        <Text style={[styles.score, km > 0 ? styles.positive : styles.inactive]}>
          {km > 0 ? `+${score.toFixed(1)}` : '+0'}
        </Text>
      </View>

      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          onBlur={() => {
            const v = parseFloat(text.replace(',', '.'));
            if (!isNaN(v) && v >= 0) onChange(v);
            else if (text === '') onChange(0);
          }}
          keyboardType="decimal-pad"
          placeholder="0.0"
          placeholderTextColor="#444"
          selectTextOnFocus
        />
        <Text style={styles.unit}>km</Text>
      </View>

      <View style={styles.presets}>
        {presets.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, km === p && styles.presetActive]}
            onPress={() => {
              onChange(p);
              setText(String(p));
            }}
          >
            <Text style={[styles.presetText, km === p && styles.presetTextActive]}>
              {p} km
            </Text>
          </TouchableOpacity>
        ))}
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
  active: {
    borderColor: 'rgba(46,204,113,0.3)',
    backgroundColor: 'rgba(46,204,113,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  icon: { fontSize: 20 },
  titleArea: { flex: 1 },
  title: { color: '#fff', fontSize: 14, fontWeight: '600' },
  subtitle: { color: '#666', fontSize: 11, marginTop: 1 },
  score: { fontSize: 15, fontWeight: '700' },
  positive: { color: '#2ecc71' },
  inactive: { color: '#444' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  input: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 90,
    textAlign: 'center',
  },
  unit: { color: '#888', fontSize: 16, fontWeight: '600' },
  presets: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  preset: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  presetActive: {
    backgroundColor: 'rgba(46,204,113,0.2)',
    borderColor: '#2ecc71',
  },
  presetText: { color: '#666', fontSize: 12 },
  presetTextActive: { color: '#2ecc71', fontWeight: '700' },
});
