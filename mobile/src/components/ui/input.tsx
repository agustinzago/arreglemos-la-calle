// Campo de texto del diseño: alto ≥56 dp, borde de 2 px, azul con foco y rojo con error (invalid).
import { useColorScheme } from 'nativewind';
import { TextInput, type TextInputProps } from 'react-native';

import { THEME } from '@/lib/theme';
import { cn } from '@/lib/utils';

function Input({ className, invalid, ...props }: TextInputProps & { invalid?: boolean }) {
  const theme = THEME[useColorScheme().colorScheme ?? 'light'];
  return (
    <TextInput
      className={cn(
        'min-h-[56px] rounded-md border-2 border-border bg-card px-3.5 py-3 font-sans text-base text-foreground focus:border-primary',
        invalid && 'border-destructive focus:border-destructive',
        props.multiline && 'min-h-24',
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
