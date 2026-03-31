import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Pressable,
} from 'react-native';

interface Props {
  visible: boolean;
  currentDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const FULL_MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function DatePickerModal({ visible, currentDate, onSelect, onClose }: Props) {
  const parts = currentDate.split('-');
  const [year, setYear] = useState(parseInt(parts[0]));
  const [month, setMonth] = useState(parseInt(parts[1]));
  const [day, setDay] = useState(parseInt(parts[2]));

  const today = new Date();
  const maxDay = daysInMonth(year, month);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function confirm() {
    const d = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelect(d);
    onClose();
  }

  function adjustDay(d: number) {
    const clamped = Math.min(d, daysInMonth(year, month));
    setDay(clamped);
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>Tarih Seç</Text>

          {/* Yıl */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.arrowBtn} onPress={() => setYear((y) => y - 1)}>
              <Text style={styles.arrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.yearText}>{year}</Text>
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={() => setYear((y) => Math.min(y + 1, today.getFullYear()))}
            >
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Ay grid */}
          <View style={styles.monthGrid}>
            {MONTHS.map((m, i) => {
              const mn = i + 1;
              const isActive = mn === month;
              const isFuture = year === today.getFullYear() && mn > today.getMonth() + 1;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.monthBtn, isActive && styles.monthActive, isFuture && styles.disabled]}
                  onPress={() => { if (!isFuture) { setMonth(mn); adjustDay(day); } }}
                  disabled={isFuture}
                >
                  <Text style={[styles.monthText, isActive && styles.monthTextActive, isFuture && styles.disabledText]}>
                    {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Gün grid */}
          <Text style={styles.subTitle}>{FULL_MONTHS[month - 1]} — Gün</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
            <View style={styles.dayGrid}>
              {days.map((d) => {
                const isActive = d === day;
                const date = new Date(year, month - 1, d);
                const isFuture = date > today;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dayBtn, isActive && styles.dayActive, isFuture && styles.disabled]}
                    onPress={() => { if (!isFuture) setDay(d); }}
                    disabled={isFuture}
                  >
                    <Text style={[styles.dayText, isActive && styles.dayTextActive, isFuture && styles.disabledText]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirm}>
              <Text style={styles.confirmText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  handle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  subTitle: { color: '#888', fontSize: 12, marginBottom: 8, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  arrowBtn: { padding: 8 },
  arrow: { color: '#2ecc71', fontSize: 28, fontWeight: '300' },
  yearText: { color: '#fff', fontSize: 22, fontWeight: '700', minWidth: 60, textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  monthBtn: {
    width: '22%',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#252535',
    alignItems: 'center',
  },
  monthActive: { backgroundColor: '#2ecc71' },
  monthText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  monthTextActive: { color: '#000' },
  dayScroll: { marginBottom: 16 },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, width: '100%' },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#252535',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: { backgroundColor: '#2ecc71' },
  dayText: { color: '#aaa', fontSize: 13, fontWeight: '600' },
  dayTextActive: { color: '#000' },
  disabled: { opacity: 0.3 },
  disabledText: { color: '#555' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#252535', alignItems: 'center',
  },
  cancelText: { color: '#888', fontWeight: '600' },
  confirmBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    backgroundColor: '#2ecc71', alignItems: 'center',
  },
  confirmText: { color: '#000', fontWeight: '700', fontSize: 15 },
});
