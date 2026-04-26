import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../types/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderSuccessScreen from '../screens/OrderSuccessScreen';
import ScannerScreen from '../screens/ScannerScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tabs para customer
function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Cardápio', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🍿</Text> }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Carrinho', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🛒</Text> }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }} />
    </Tab.Navigator>
  );
}

// Tabs para seller/admin
function SellerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Cardápio', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🍿</Text> }} />
      <Tab.Screen name="Scanner" component={ScannerScreen} options={{ title: 'Scanner', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🎫</Text> }} />
      <Tab.Screen name="Admin" component={AdminScreen} options={{ title: 'Painel', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>⚙️</Text> }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Pedidos', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
    </View>
  );

  const isStaff = user?.role === 'super_admin' || user?.role === 'manager' || user?.role === 'seller';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : isStaff ? (
          <>
            <Stack.Screen name="Main" component={SellerTabs} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={CustomerTabs} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
