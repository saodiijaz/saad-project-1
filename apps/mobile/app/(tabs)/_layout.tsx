import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#0F6E56',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Upptäck' }} />
      <Tabs.Screen name="feed" options={{ title: 'Flöde' }} />
      <Tabs.Screen name="events" options={{ title: 'Events' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
    </Tabs>
  )
}
