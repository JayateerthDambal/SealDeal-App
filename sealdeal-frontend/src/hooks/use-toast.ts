import { toast as sonnerToast } from 'sonner';
import { ReactNode } from 'react';

// Define the types for our toast function
interface ToastProps {
  title?: ReactNode;
  description?: ReactNode;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Create a new toast function that maps our props to sonner's API
const toast = (props: ToastProps) => {
  const { title, description, variant = 'default', action, ...rest } = props;

  // Map our variants to sonner's functions
  switch (variant) {
    case 'success':
      sonnerToast.success(title, {
        description,
        action,
        ...rest,
      });
      break;
    case 'destructive':
      sonnerToast.error(title, {
        description,
        action,
        ...rest,
      });
      break;
    default:
      sonnerToast(title, {
        description,
        action,
        ...rest,
      });
      break;
  }
};

// The custom hook now simply returns our new toast function
export function useToast() {
  return { toast };
}

