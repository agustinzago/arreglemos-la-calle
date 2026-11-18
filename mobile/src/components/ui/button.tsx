// React Native Reusables `Button`, con las variantes del diseño: botones grandes (≥58 dp el
// principal, ≥48 dp el resto), principal azul, éxito verde y contorno azul.
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

const buttonVariants = cva('flex-row items-center justify-center gap-2.5 rounded-lg px-5 py-3.5', {
  variants: {
    variant: {
      default: 'bg-primary active:scale-[0.98]',
      success: 'bg-success active:scale-[0.98]',
      outline: 'border-2 border-primary bg-transparent active:bg-primary-soft',
      ghost: 'active:bg-accent',
    },
    size: {
      default: 'min-h-button w-full',
      sm: 'min-h-touch px-3 py-2',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('shrink text-center text-lg font-sans-bold', {
  variants: {
    variant: {
      default: 'text-primary-foreground',
      success: 'text-success-foreground',
      outline: 'text-primary-ink',
      ghost: 'text-foreground',
    },
    size: { default: '', sm: 'text-base' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, onPress, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-45', buttonVariants({ variant, size }), className)}
        role="button"
        onPress={
          onPress &&
          ((e) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            onPress(e);
          })
        }
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
