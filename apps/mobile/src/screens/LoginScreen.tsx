import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useMobileAuth } from '../context/MobileAuthContext';
import { apiRequest } from '../services/api';
import { requestLocationPermissions } from '../services/locationService';

export default function LoginScreen() {
  const { login } = useMobileAuth();
  const [identifier, setIdentifier] = useState('rahul@erp.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (idToUse?: string) => {
    setError('');
    setLoading(true);

    const targetIdentifier = idToUse || identifier;

    try {
      // 1. Request location permissions on login onboarding
      await requestLocationPermissions();

      // 2. Perform login
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier: targetIdentifier, password }),
      });

      const initialDuty = res.user.dutyStatus === 'ON_DUTY' ? 'ON_DUTY' : 'OFF_DUTY';
      await login(res.token, res.user, initialDuty);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check network/credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>FT</Text>
          </View>
          <Text style={styles.brandTitle}>FIELD TRACK ERP</Text>
          <Text style={styles.brandSubtitle}>Sales Representative Field Companion</Text>
        </View>

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Input Fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Employee ID, Phone, or Email</Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="e.g. EMP-001 or 9876543212"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
          />

          <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Sign In & Start Session</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Demo Login */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>TEST DEMO ACCOUNT</Text>
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={() => {
              setIdentifier('rahul@erp.com');
              handleLogin('rahul@erp.com');
            }}
          >
            <Text style={styles.demoBtnText}>Quick Sign-in: Rahul (Mangalore North)</Text>
          </TouchableOpacity>
        </View>

        {/* Location Notice (Section 26) */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyNoticeTitle}>Location Transparency Notice</Text>
          <Text style={styles.privacyNoticeText}>
            GPS coordinates are recorded strictly while you are ON DUTY to verify client visits and travel distance. Tracking ceases immediately upon End Day.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  submitBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 8,
  },
  demoBtn: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  demoBtnText: {
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '600',
  },
  privacyNotice: {
    marginTop: 24,
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
  },
  privacyNoticeTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 2,
  },
  privacyNoticeText: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 14,
  },
});
