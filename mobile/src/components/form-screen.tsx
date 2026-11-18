// Esqueleto de las pantallas del formulario: cuerpo que scrollea y un pie fijo con la acción
// principal a lo ancho, que el teclado no tapa. `scrollRef`: para bajar a un campo (iOS no lo hace solo).
import { useRef, useState, type ComponentRef, type Ref } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function FormScreen({
  children,
  footer,
  scrollRef,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
  scrollRef?: Ref<ComponentRef<typeof ScrollView>>;
}) {
  // El offset del teclado es dónde empieza el formulario en la pantalla. No es la altura de la cabecera:
  // en iOS 26 la cabecera es de vidrio y el formulario empieza arriba de todo, debajo de ella. Con la altura
  // de la cabecera sobraba ese espacio entre el pie y el teclado y el contenido se iba para arriba.
  const ref = useRef<ComponentRef<typeof View>>(null);
  const [top, setTop] = useState(0);
  return (
    <View ref={ref} className="flex-1" onLayout={() => ref.current?.measureInWindow((_x, y) => setTop(y))}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={top}
        className="flex-1 bg-background"
      >
        {/* iOS 26: la cabecera es de vidrio y el contenido pasa por debajo; "automatic" lo corre hacia abajo. */}
        <ScrollView
          ref={scrollRef}
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
    </View>
  );
}
