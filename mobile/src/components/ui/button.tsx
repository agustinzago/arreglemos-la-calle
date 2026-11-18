// React Native Reusables `Button`, con las variantes del diseño: botones grandes (≥58 dp el
// principal, ≥48 dp el resto), principal azul, éxito verde y contorno azul.
import { Pressable } from '@/components/ui/pressable';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('flex-row items-center justify-center gap-2.5 rounded-lg px-5 py-3.5', {
  variants: {
    variant: {
      default: 'bg-primary',
      success: 'bg-success',
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
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-45', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
