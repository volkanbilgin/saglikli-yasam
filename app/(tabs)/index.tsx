import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelectedDate } from '../../src/context/DateContext';
import { todayStr, formatDisplayDate, toDateStr, fromDateStr } from '../../src/utils/dateHelpers';
import { useDailyEntry } from '../../src/hooks/useDailyEntry';
import ActivityRow from '../../src/components/ActivityRow';
import ScoreRing from '../../src/components/ScoreRing';
import SectionHeader from '../../src/components/SectionHeader';
import SocialMediaSlider from '../../src/components/SocialMediaSlider';
import WalkInput from '../../src/components/WalkInput';
import DatePickerModal from '../../src/components/DatePickerModal';
import { isWeekday, getScoreColor } from '../../src/utils/scoring';

export default function TodayScreen() {
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const { entry, loading, update, score } = useDailyEntry(selectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isToday = selectedDate === todayStr();
  const weekday = isWeekday(fromDateStr(selectedDate));

  function goDay(delta: number) {
    const d = fromDateStr(selectedDate);
    d.setDate(d.getDate() + delta);
    const next = toDateStr(d);
    if (next <= todayStr()) setSelectedDate(next);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  const morningMax = 50; // haftasonu da ingilizce var
  const eveningMax = weekday ? 50 : 40; // haftasonu kitap da var

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Üst bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.navBtn} onPress={() => goDay(-1)}>
          <Ionicons name="chevron-back" size={22} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.dateArea} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateText}>{formatDisplayDate(selectedDate)}</Text>
          <Ionicons name="calendar-outline" size={14} color="#555" style={{ marginLeft: 6 }} />
          {isToday && <View style={styles.todayDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, isToday && styles.navBtnDisabled]}
          onPress={() => goDay(1)}
          disabled={isToday}
        >
          <Ionicons name="chevron-forward" size={22} color={isToday ? '#333' : '#aaa'} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Puan halkası */}
          <View style={styles.scoreArea}>
            <ScoreRing score={score.totalScore} size={150} />
            <View style={styles.scoreDetails}>
              <ScoreChip label="Sabah" value={score.morningScore} max={morningMax} />
              <ScoreChip label="Akşam" value={score.eveningScore} max={eveningMax} />
              <ScoreChip label="Günlük" value={score.dailyExtrasScore} />
            </View>
          </View>

          {/* SABAH */}
          <SectionHeader title="☀️ Sabah" points={score.morningScore} maxPoints={morningMax} />
          <ActivityRow label="Yoga" icon="🧘" value={entry.morning_yoga} points={10}
            onValueChange={(v) => update('morning_yoga', v)} />
          <ActivityRow label="Mekik + Squat" icon="💪" value={entry.morning_pushup_squat} points={10}
            onValueChange={(v) => update('morning_pushup_squat', v)} />
          <ActivityRow label="Vitaminler" icon="💊" value={entry.morning_vitamins} points={10}
            onValueChange={(v) => update('morning_vitamins', v)} />
          <ActivityRow label="Diş Fırçala" icon="🦷" value={entry.morning_teeth} points={10}
            onValueChange={(v) => update('morning_teeth', v)} />
          <ActivityRow label="İngilizce Çalış" icon="📖" value={entry.morning_english} points={10}
            onValueChange={(v) => update('morning_english', v)} />

          {/* AKŞAM */}
          <SectionHeader title="🌙 Akşam" points={score.eveningScore} maxPoints={eveningMax} />
          <ActivityRow label="Vitaminler" icon="💊" value={entry.evening_vitamins} points={10}
            onValueChange={(v) => update('evening_vitamins', v)} />
          <ActivityRow label="Mekik + Squat" icon="💪" value={entry.evening_pushup_squat} points={10}
            onValueChange={(v) => update('evening_pushup_squat', v)} />
          <ActivityRow label="Diş Fırçala" icon="🦷" value={entry.evening_teeth} points={10}
            onValueChange={(v) => update('evening_teeth', v)} />
          <ActivityRow label="İngilizce Kitap" icon="📚" value={entry.evening_english} points={10}
            onValueChange={(v) => update('evening_english', v)} />
          <ActivityRow label="Mesleki Çalışma" icon="💼" value={entry.evening_professional} points={10}
            onValueChange={(v) => update('evening_professional', v)} />

          {/* GÜNLÜK */}
          <SectionHeader title="📊 Günlük" points={score.dailyExtrasScore} />
          <ActivityRow label="Su" icon="💧" value={entry.water_glasses} points={2}
            isVariable unit="bardak" onValueChange={(v) => update('water_glasses', v)} />
          <ActivityRow label="Kitap" icon="📕" value={entry.book_pages} points={1}
            isVariable unit="sayfa" onValueChange={(v) => update('book_pages', v)} />
          <ActivityRow label="Spor" icon="🏋️" value={entry.exercise_done} points={20}
            onValueChange={(v) => update('exercise_done', v)} />
          <WalkInput km={entry.walk_km} onChange={(km) => update('walk_km', km)} />
          <SocialMediaSlider minutes={entry.social_media_minutes}
            onChange={(m) => update('social_media_minutes', m)} />

          {/* NOT */}
          <SectionHeader title="📝 Günlük Not" />
          <View style={styles.noteBox}>
            <TextInput
              style={styles.noteInput}
              value={entry.note}
              onChangeText={(t) => update('note', t)}
              placeholder="Bugün nasıldı? Ne hissettin?"
              placeholderTextColor="#444"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={showDatePicker}
        currentDate={selectedDate}
        onSelect={(d) => setSelectedDate(d)}
        onClose={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

function ScoreChip({ label, value, max }: { label: string; value: number; max?: number }) {
  return (
    <View style={chipStyles.chip}>
      <Text style={chipStyles.label}>{label}</Text>
      <Text style={[chipStyles.value, { color: getScoreColor(value) }]}>
        {value.toFixed(0)}{max !== undefined ? `/${max}` : ''}
      </Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 72,
  },
  label: { color: '#888', fontSize: 11, marginBottom: 2 },
  value: { fontSize: 15, fontWeight: '700' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f0f1a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f1a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  navBtn: { padding: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)' },
  navBtnDisabled: { opacity: 0.3 },
  dateArea: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  dateText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2ecc71', marginLeft: 4 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12 },
  scoreArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  scoreDetails: {
    flex: 1,
    paddingLeft: 16,
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  noteBox: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 12,
    marginBottom: 6,
  },
  noteInput: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 22,
    minHeight: 90,
  },
});
