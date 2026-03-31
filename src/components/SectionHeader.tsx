import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  title: string;
  subtitle?: string;
  points?: number;
  maxPoints?: number;
}

export default function SectionHeader({ title, subtitle, points, maxPoints }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {points !== undefined && maxPoints !== undefined && (
        <Text style={styles.points}>
          <Text style={styles.earned}>{points.toFixed(0)}</Text>
          <Text style={styles.max}>/{maxPoints}</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#666',
    fontSize: 11,
    marginTop: 1,
  },
  points: {
    fontSize: 14,
  },
  earned: {
    color: '#2ecc71',
    fontWeight: '700',
  },
  max: {
    color: '#444',
    fontWeight: '500',
  },
});
