import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

interface Props {
  pct: number;       // 0–100
  color: string;
  size?: number;
  label: string;
  sublabel: string;
}

export default function MiniPie({ pct, color, size = 54, label, sublabel }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;
  const bgColor = '#1e1e30';
  const clampedPct = Math.max(0, Math.min(100, pct));

  let sectorPath: string | null = null;
  if (clampedPct > 0 && clampedPct < 100) {
    const angle = (clampedPct / 100) * 360;
    const rad = (angle * Math.PI) / 180;
    const endX = cx + r * Math.sin(rad);
    const endY = cy - r * Math.cos(rad);
    const largeArc = angle > 180 ? 1 : 0;
    sectorPath = `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 ${largeArc} 1 ${endX} ${endY} Z`;
  }

  const fontSize = Math.floor(size * 0.15);

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill={clampedPct >= 100 ? color : bgColor} />
        {sectorPath ? <Path d={sectorPath} fill={color} /> : null}
        <SvgText
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dy="0.35em"
          fill="#fff"
          fontSize={fontSize}
          fontWeight="bold"
        >
          %{Math.round(pct)}
        </SvgText>
      </Svg>
      <Text style={styles.label} numberOfLines={1}>{label}</Text>
      <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', flex: 1, marginBottom: 8 },
  label: { color: '#ccc', fontSize: 8, marginTop: 3, textAlign: 'center' },
  sublabel: { color: '#555', fontSize: 7, textAlign: 'center' },
});
