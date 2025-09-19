import { toast as sonnerToast } from 'sonner';

type ToastVariant = 'default' | 'destructive';

interface ToastOptions {
  title: string;
  description: string;
  variant?: ToastVariant;
}

const useToast = () => {
  const toast = ({ title, description, variant = 'default' }: ToastOptions) => {
    if (variant === 'destructive') {
      sonnerToast.error(title, {
        description,
        // You can add custom styling here if needed
      });
    } else {
      sonnerToast.success(title, {
        description,
      });
    }
  };

  return { toast };
};

export { useToast };
