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

type LoginMode = 'ACCESS_CODE' | 'PASSWORD';

export default function LoginScreen() {
  const { login } = useMobileAuth();
  const [loginMode, setLoginMode] = useState<LoginMode>('ACCESS_CODE');

  // Form states
  const [identifier, setIdentifier] = useState('EMP-001');
  const [accessCode, setAccessCode] = useState('');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (idToUse?: string) => {
    setError('');
    setLoading(true);

    const targetIdentifier = (idToUse || identifier).trim();

    try {
      // 1. Request location permissions on onboarding
      await requestLocationPermissions();

      let res;
      if (loginMode === 'ACCESS_CODE') {
        if (!targetIdentifier || !accessCode.trim()) {
          throw new Error('Please enter both your Employee ID / Phone and Personal Access Code.');
        }

        res = await apiRequest('/api/auth/access-code-login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: targetIdentifier,
            accessCode: accessCode.trim().toUpperCase(),
          }),
        });
      } else {
        if (!targetIdentifier || !password) {
          throw new Error('Please enter both your identifier and password.');
        }

        res = await apiRequest('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier: targetIdentifier, password }),
        });
      }

      const initialDuty = res.user.dutyStatus === 'ON_DUTY' ? 'ON_DUTY' : 'OFF_DUTY';
      await login(res.token, res.user, initialDuty);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          <View style={styles.iconBox}>
            <View style={styles.iconInner}>
              <View style={styles.iconDot} />
            </View>
          </View>
          <Text style={styles.brandTitle}>FieldTrack</Text>
          <Text style={styles.brandSubtitle}>Sales Representative Companion</Text>
        </View>

        {/* Login Method Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, loginMode === 'ACCESS_CODE' && styles.toggleBtnActive]}
            onPress={() => {
              setLoginMode('ACCESS_CODE');
              setError('');
            }}
          >
            <Text
              style={[
                styles.toggleBtnText,
                loginMode === 'ACCESS_CODE' && styles.toggleBtnTextActive,
              ]}
            >
              Access Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, loginMode === 'PASSWORD' && styles.toggleBtnActive]}
            onPress={() => {
              setLoginMode('PASSWORD');
              setError('');
            }}
          >
            <Text
              style={[
                styles.toggleBtnText,
                loginMode === 'PASSWORD' && styles.toggleBtnTextActive,
              ]}
            >
              Password
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.card}>
          <Text style={styles.label}>
            {loginMode === 'ACCESS_CODE' ? 'Employee ID or Mobile Number' : 'Employee ID, Phone, or Email'}
          </Text>
          <TextInput
            style={styles.input}
            value={identifier}
            onChangeText={setIdentifier}
            placeholder={loginMode === 'ACCESS_CODE' ? 'e.g. EMP-001 or 9876543212' : 'e.g. rahul@erp.com'}
            placeholderTextColor="#8C9BA5"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {loginMode === 'ACCESS_CODE' ? (
            <>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { marginTop: 14 }]}>Personal Access Code</Text>
                <Text style={styles.hintText}>Issued by Admin</Text>
              </View>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={accessCode}
                onChangeText={(val) => setAccessCode(val.toUpperCase())}
                placeholder="e.g. TRK-8924"
                placeholderTextColor="#8C9BA5"
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <Text style={styles.securityNote}>
                Your individual code locks automatically after 5 consecutive failed attempts.
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#8C9BA5"
                secureTextEntry
              />
            </>
          )}

          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {loginMode === 'ACCESS_CODE' ? 'Sign In with Access Code' : 'Sign In with Password'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Demo Sign-in Helper */}
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>TEST CREDENTIALS</Text>
          <View style={styles.demoRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => {
                setLoginMode('ACCESS_CODE');
                setIdentifier('EMP-001');
                setAccessCode('TRK-9842');
              }}
            >
              <Text style={styles.demoBtnText}>Pre-fill Rahul (EMP-001)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => {
                setLoginMode('PASSWORD');
                setIdentifier('rahul@erp.com');
                setPassword('Password123!');
              }}
            >
              <Text style={styles.demoBtnText}>Password Login (Rahul)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#081224',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconInner: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 8,
    height: 8,
    backgroundColor: '#B4E39C',
    borderRadius: 2,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0B1320',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#586570',
    marginTop: 4,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E8EDEF',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#CBD2D7',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#586570',
  },
  toggleBtnTextActive: {
    color: '#0B1320',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD2D7',
    padding: 20,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0B1320',
    marginBottom: 6,
  },
  hintText: {
    fontSize: 11,
    color: '#8C9BA5',
  },
  input: {
    backgroundColor: '#F5F7F8',
    borderColor: '#CBD2D7',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0B1320',
  },
  codeInput: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    letterSpacing: 2,
  },
  securityNote: {
    fontSize: 11,
    color: '#586570',
    marginTop: 6,
    lineHeight: 15,
  },
  submitBtn: {
    backgroundColor: '#081224',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
    minHeight: 46,
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  demoBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#CBD2D7',
    borderRadius: 12,
    padding: 14,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C9BA5',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoRow: {
    gap: 8,
  },
  demoBtn: {
    backgroundColor: '#F5F7F8',
    borderColor: '#CBD2D7',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0B1320',
  },
});
