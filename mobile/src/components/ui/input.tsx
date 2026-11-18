// Campo de texto del diseño: alto ≥56 dp, borde de 2 px, azul con foco y rojo con error (invalid).
import { useColorScheme } from 'nativewind';
import type { ComponentRef, Ref } from 'react';
import { TextInput, type TextInputProps } from 'react-native';

import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

type InputProps = TextInputProps & { invalid?: boolean; ref?: Ref<ComponentRef<typeof TextInput>> };

function Input({ className, invalid, ...props }: InputProps) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  return (
    <TextInput
      className={cn(
        'min-h-[56px] rounded-md border-2 border-border bg-card px-3.5 py-3 font-sans text-base text-foreground focus:border-primary',
        invalid && 'border-destructive focus:border-destructive',
        // Multilínea: crece hasta 192 dp y después scrollea adentro. Sin tope crecía dentro del ScrollView de
        // la pantalla y en iOS lo que se escribía quedaba tapado por el pie o el teclado.
        props.multiline && 'min-h-24 max-h-48',
        className,
      )}
      placeholderTextColor={theme.mutedForeground}
      textAlignVertical={props.multiline ? 'top' : 'center'}
      maxFontSizeMultiplier={2}
      {...props}
    />
  );
}

export { Input };
