/**
 * Mobile App Entry Point
 */

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import './i18n/config';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  AuthScreen,
  DashboardScreen,
  JobsScreen,
  ProjectsScreen,
  StudioScreen,
} from './screens';
import { colors } from './theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { color: colors.text },
  tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
};

function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('nav.dashboard') }}
      />
      <Tab.Screen
        name="Studio"
        component={StudioScreen}
        options={{ title: t('nav.studio') }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ title: t('nav.jobs') }}
      />
      <Tab.Screen
        name="Projects"
        component={ProjectsScreen}
        options={{ title: t('nav.projects') }}
      />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { authenticated, ready } = useAuth();

  // Avoid flashing the login screen before the secure-storage session check.
  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {authenticated ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}

function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});

export default App;
