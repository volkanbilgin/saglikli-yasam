import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ActivityRowProps {
  label: string;
  icon: string;
  value: number; // 0.0 - 1.0
  points: number;
  disabled?: boolean; // Hafta sonu için kapalı
  onValueChange: (v: number) => void;
  isVariable?: boolean; // Su veya kitap sayfası gibi serbest değerler
  unit?: string; // "bardak", "sayfa" vb
  maxValue?: number; // isVariable için
}

export default function ActivityRow({
  label,
  icon,
  value,
  points,
  disabled = false,
  onValueChange,
  isVariable = false,
  unit = '',
  maxValue,
}: ActivityRowProps) {
  const [showModal, setShowModal] = useState(false);
  const [inputText, setInputText] = useState('');

  const isActive = value > 0;
  const isPartial = value > 0 && value < 1 && !isVariable;

  function handleToggle() {
    if (disabled) return;
    if (isVariable) {
      setInputText('');
      setShowModal(true);
      return;
    }
    if (value >= 1) {
      onValueChange(0);
    } else {
      onValueChange(1);
    }
  }

  function handleLongPress() {
    if (disabled) return;
    setInputText('');
    setShowModal(true);
  }

  function handleModalConfirm() {
    const raw = parseFloat(inputText.replace(',', '.'));
    if (isNaN(raw)) {
      setShowModal(false);
      return;
    }
    if (isVariable) {
      onValueChange(Math.max(0, raw));
    } else {
      // % olarak girildi, 0'ın altına inemez ama üst sınır yok
      const clamped = Math.max(0, raw);
      onValueChange(clamped / 100);
    }
    setShowModal(false);
  }

  const earnedPoints = isVariable
    ? value * points
    : value * points;

  const bgColor = disabled
    ? '#1a1a1a'
    : isActive
    ? isPartial
      ? 'rgba(241,196,15,0.15)'
      : 'rgba(46,204,113,0.12)'
    : 'rgba(255,255,255,0.04)';

  const borderColor = disabled
    ? 'transparent'
    : isActive
    ? isPartial
      ? '#f1c40f'
      : '#2ecc71'
    : 'rgba(255,255,255,0.1)';

  return (
    <>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: bgColor, borderColor }]}
        onPress={handleToggle}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <View style={styles.left}>
          <Text style={[styles.icon, disabled && styles.disabledText]}>{icon}</Text>
          <View>
            <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
            {disabled && (
              <Text style={styles.disabledHint}>Bugün gerekli değil</Text>
            )}
          </View>
        </View>

        <View style={styles.right}>
          {isVariable ? (
            <Text style={[styles.valueText, disabled && styles.disabledText]}>
              {value > 0 ? `${value} ${unit}` : `-- ${unit}`}
            </Text>
          ) : isPartial ? (
            <Text style={styles.partialText}>{Math.round(value * 100)}%</Text>
          ) : null}

          <Text style={[styles.pointsText, !isActive && styles.pointsInactive]}>
            {isVariable
              ? `+${earnedPoints.toFixed(1)}`
              : isActive
              ? `+${earnedPoints.toFixed(1)}`
              : `+${points}`}
          </Text>

          {!isVariable && (
            <View
              style={[
                styles.checkbox,
                isActive && { backgroundColor: isPartial ? '#f1c40f' : '#2ecc71', borderColor: 'transparent' },
                disabled && styles.checkboxDisabled,
              ]}
            >
              {isActive && (
                <Ionicons
                  name={isPartial ? 'remove' : 'checkmark'}
                  size={14}
                  color="#000"
                />
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>{label}</Text>
            <Text style={styles.modalSubtitle}>
              {isVariable
                ? `${unit} sayısını gir`
                : 'Tamamlanma oranını gir (0-100%)'}
            </Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="decimal-pad"
              value={inputText}
              onChangeText={setInputText}
              autoFocus
              placeholder={isVariable ? '0' : '100'}
              placeholderTextColor="#555"
              selectTextOnFocus
            />
            {!isVariable && (
              <View style={styles.quickButtons}>
                {[25, 50, 75, 100].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={styles.quickBtn}
                    onPress={() => setInputText(String(pct))}
                  >
                    <Text style={styles.quickBtnText}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleModalConfirm}
              >
                <Text style={styles.confirmBtnText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledText: {
    color: '#444',
  },
  disabledHint: {
    color: '#333',
    fontSize: 11,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  valueText: {
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: '600',
  },
  partialText: {
    color: '#f1c40f',
    fontSize: 12,
    fontWeight: '600',
  },
  pointsText: {
    color: '#2ecc71',
    fontSize: 13,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
  pointsInactive: {
    color: '#444',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDisabled: {
    borderColor: '#222',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#1e1e2e',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#444',
    marginBottom: 12,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  quickBtnText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    padding: 13,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#2a2a3e',
    borderWidth: 1,
    borderColor: '#444',
  },
  cancelBtnText: {
    color: '#888',
    fontWeight: '600',
  },
  confirmBtn: {
    backgroundColor: '#2ecc71',
  },
  confirmBtnText: {
    color: '#000',
    fontWeight: '700',
  },
});
