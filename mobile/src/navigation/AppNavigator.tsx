import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import type { NavigationContainerRef } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../types/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import MoviesScreen from '../screens/MoviesScreen';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import HomeScreen from '../screens/HomeScreen';
import PedidosScreen from '../screens/PedidosScreen';
import ContaScreen from '../screens/ContaScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import CreateMovieScreen from '../screens/CreateMovieScreen';

// Staff
import ScannerScreen from '../screens/ScannerScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── 4 tabs do cliente ───────────────────────────────────
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: '#222', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Sessoes"
        component={MoviesScreen}
        options={{ title: 'Sessões', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🎬</Text> }}
      />
      <Tab.Screen
        name="Cardapio"
        component={HomeScreen}
        options={{ title: 'Cardápio', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🍿</Text> }}
      />
      <Tab.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🛒</Text> }}
      />
      <Tab.Screen
        name="Conta"
        component={ContaScreen}
        options={{ title: 'Conta', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

// ─── Tabs do vendedor/admin ───────────────────────────────
function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: '#222', height: 60, paddingBottom: 8 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Sessoes"
        component={MoviesScreen}
        options={{ title: 'Sessões', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🎬</Text> }}
      />
      <Tab.Screen
        name="Cardapio"
        component={HomeScreen}
        options={{ title: 'Cardápio', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🍿</Text> }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{ title: 'Scanner', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>🎫</Text> }}
      />
      <Tab.Screen
        name="Painel"
        component={AdminScreen}
        options={{ title: 'Painel', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>⚙️</Text> }}
      />
      <Tab.Screen
        name="Conta"
        component={ContaScreen}
        options={{ title: 'Conta', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 22 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

// ─── Navigator raiz ───────────────────────────────────────
export default function AppNavigator() {
  const { user, loading } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useEffect(() => {
    if (!loading && !user && navigationRef.current?.isReady()) {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  }, [user, loading]);

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const isStaff = ['super_admin', 'manager', 'seller'].includes(user?.role || '');

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login"          component={LoginScreen} />
            <Stack.Screen name="Register"       component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        ) : isStaff ? (
          <>
            <Stack.Screen name="Main"          component={SellerTabs} />
            <Stack.Screen name="MovieDetail"   component={MovieDetailScreen} />
            <Stack.Screen name="CreateMovie"   component={CreateMovieScreen} />
            <Stack.Screen name="OrderSuccess"  component={OrderSuccessScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main"         component={CustomerTabs} />
            <Stack.Screen name="MovieDetail"  component={MovieDetailScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
