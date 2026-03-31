import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp } = useAuth();

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Hata', 'E-posta ve şifre giriniz');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password);
        Alert.alert('Hesap Oluşturuldu ✅', 'Giriş yapabilirsiniz.');
        setIsSignUp(false);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🌿</Text>
        <Text style={styles.title}>Sağlıklı Yaşam</Text>
        <Text style={styles.subtitle}>{isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}</Text>

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor="#555"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor="#555"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)} style={styles.toggleBtn}>
          <Text style={styles.toggleText}>
            {isSignUp ? 'Zaten hesabın var mı? Giriş yap' : 'Hesap oluştur'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  inner: { flex: 1, justifyContent: 'center', padding: 32 },
  logo: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  title: { color: '#2ecc71', fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 36 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 16, color: '#fff',
    fontSize: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  btn: {
    backgroundColor: '#2ecc71', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8, marginBottom: 16,
  },
  btnText: { color: '#000', fontSize: 16, fontWeight: '700' },
  toggleBtn: { alignItems: 'center', padding: 8 },
  toggleText: { color: '#555', fontSize: 14 },
});
