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
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#081224',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0B1320',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#586570',
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: '#FDF2F2',
    borderColor: '#F8C4C4',
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#CBD2D7',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B1320',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#CBD2D7',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0B1320',
  },
  submitBtn: {
    backgroundColor: '#081224',
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
    color: '#80909D',
    letterSpacing: 1,
    marginBottom: 8,
  },
  demoBtn: {
    backgroundColor: '#F3F5F6',
    borderColor: '#CBD2D7',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  demoBtnText: {
    color: '#0B1320',
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
