// React Native Reusables `Text`, ajustado a los tokens del diseño (Rubik, escala de letra grande).
// Respeta el tamaño de letra del sistema: cuerpo hasta 200%, títulos hasta 150%.
import { cn } from '@/lib/utils';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Text as RNText, type Role } from 'react-native';

const textVariants = cva('text-foreground text-base font-sans', {
  variants: {
    variant: {
      default: '',
      h1: 'text-2xl font-sans-bold tracking-tight',
      h2: 'text-xl font-sans-bold',
      muted: 'text-muted-foreground text-sm',
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextVariant = NonNullable<VariantProps<typeof textVariants>['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = { h1: 'heading', h2: 'heading' };
const MAX_SCALE: Record<TextVariant, number> = { default: 2, muted: 2, h1: 1.5, h2: 1.5 };

const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = 'default',
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  VariantProps<typeof textVariants> & { asChild?: boolean }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot : RNText;
  const v = variant ?? 'default';
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={ROLE[v]}
      maxFontSizeMultiplier={MAX_SCALE[v]}
      {...props}
    />
  );
}

export { Text, TextClassContext };
