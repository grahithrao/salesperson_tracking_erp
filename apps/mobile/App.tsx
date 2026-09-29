import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { MobileAuthProvider, useMobileAuth } from './src/context/MobileAuthContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ClientsScreen from './src/screens/ClientsScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import CollectScreen from './src/screens/CollectScreen';
import ProfileScreen from './src/screens/ProfileScreen';

type TabType = 'Home' | 'Clients' | 'Orders' | 'Collect' | 'Profile';

function MainApp() {
  const { user, isLoading, dutyStatus, pendingSyncCount } = useMobileAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const [preselectedClientForOrder, setPreselectedClientForOrder] = useState<any>(null);
  const [preselectedClientForPayment, setPreselectedClientForPayment] = useState<any>(null);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284c7" />
        <Text style={styles.loadingText}>Initializing FieldTrack ERP...</Text>
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
  };

  const handleSelectClientForOrder = (client: any) => {
    setPreselectedClientForOrder(client);
    setActiveTab('Orders');
  };

  const handleSelectClientForPayment = (client: any) => {
    setPreselectedClientForPayment(client);
    setActiveTab('Collect');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Top App Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>FT</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>FieldTrack ERP</Text>
            <Text style={styles.headerSubtitle}>{user.name} • {user.employeeCode || 'Sales'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {pendingSyncCount > 0 && (
            <View style={styles.syncBadge}>
              <Text style={styles.syncBadgeText}>{pendingSyncCount} offline</Text>
            </View>
          )}
          <View
            style={[
              styles.dutyBadge,
              dutyStatus === 'ON_DUTY' ? styles.dutyOn : styles.dutyOff,
            ]}
          >
            <View
              style={[
                styles.dutyDot,
                { backgroundColor: dutyStatus === 'ON_DUTY' ? '#10b981' : '#94a3b8' },
              ]}
            />
            <Text
              style={[
                styles.dutyText,
                { color: dutyStatus === 'ON_DUTY' ? '#065f46' : '#475569' },
              ]}
            >
              {dutyStatus === 'ON_DUTY' ? 'ON DUTY' : 'OFF DUTY'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>
        {activeTab === 'Home' && <HomeScreen onNavigateTab={navigateToTab} />}
        {activeTab === 'Clients' && (
          <ClientsScreen
            onSelectClientForOrder={handleSelectClientForOrder}
            onSelectClientForPayment={handleSelectClientForPayment}
          />
        )}
        {activeTab === 'Orders' && (
          <OrdersScreen preselectedClient={preselectedClientForOrder} />
        )}
        {activeTab === 'Collect' && (
          <CollectScreen preselectedClient={preselectedClientForPayment} />
        )}
        {activeTab === 'Profile' && <ProfileScreen />}
      </View>

      {/* Bottom Navigation Bar (Section 32) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Home' && styles.activeTabButton]}
          onPress={() => setActiveTab('Home')}
          accessibilityRole="tab"
          accessibilityLabel="Home"
        >
          <Text style={[styles.tabIcon, activeTab === 'Home' && styles.activeTabIcon]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'Home' && styles.activeTabLabel]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Clients' && styles.activeTabButton]}
          onPress={() => setActiveTab('Clients')}
          accessibilityRole="tab"
          accessibilityLabel="Clients"
        >
          <Text style={[styles.tabIcon, activeTab === 'Clients' && styles.activeTabIcon]}>👥</Text>
          <Text style={[styles.tabLabel, activeTab === 'Clients' && styles.activeTabLabel]}>Clients</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Orders' && styles.activeTabButton]}
          onPress={() => setActiveTab('Orders')}
          accessibilityRole="tab"
          accessibilityLabel="Orders"
        >
          <Text style={[styles.tabIcon, activeTab === 'Orders' && styles.activeTabIcon]}>📦</Text>
          <Text style={[styles.tabLabel, activeTab === 'Orders' && styles.activeTabLabel]}>Orders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Collect' && styles.activeTabButton]}
          onPress={() => setActiveTab('Collect')}
          accessibilityRole="tab"
          accessibilityLabel="Collect"
        >
          <Text style={[styles.tabIcon, activeTab === 'Collect' && styles.activeTabIcon]}>💳</Text>
          <Text style={[styles.tabLabel, activeTab === 'Collect' && styles.activeTabLabel]}>Collect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Profile' && styles.activeTabButton]}
          onPress={() => setActiveTab('Profile')}
          accessibilityRole="tab"
          accessibilityLabel="Profile"
        >
          <Text style={[styles.tabIcon, activeTab === 'Profile' && styles.activeTabIcon]}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === 'Profile' && styles.activeTabLabel]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <MobileAuthProvider>
      <MainApp />
    </MobileAuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandIconText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  syncBadgeText: {
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
  },
  dutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  dutyOn: {
    backgroundColor: '#d1fae5',
  },
  dutyOff: {
    backgroundColor: '#f1f5f9',
  },
  dutyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dutyText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 6,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeTabButton: {},
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabLabel: {
    color: '#0284c7',
    fontWeight: '700',
  },
});
