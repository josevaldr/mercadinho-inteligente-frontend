import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import ScanScreen from './src/screens/ScanScreen';
import FavoriteScreen from './src/screens/FavoriteScreen';
import { cores } from './src/styles/styles';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerTintColor: cores.texto,
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="Scan" component={ScanScreen} options={{ title: 'Escanear' }} />
        <Stack.Screen
          name="Favorites"
          component={FavoriteScreen}
          options={{ title: 'Favoritos' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}