// Esqueleto de las pantallas del formulario: cuerpo que scrollea y un pie fijo con la acción
// principal a lo ancho, que el teclado no tapa.
import { useHeaderHeight } from 'expo-router/react-navigation';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FormScreen({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const headerHeight = useHeaderHeight();
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}
      className="flex-1 bg-background"
    >
      {/* iOS 26: la cabecera es de vidrio y el contenido pasa por debajo; "automatic" lo corre hacia abajo. */}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="gap-5 px-screen py-5"
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
      <SafeAreaView edges={['bottom']} className="border-t border-border bg-background">
        <View className="gap-2 px-screen py-3">{footer}</View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
