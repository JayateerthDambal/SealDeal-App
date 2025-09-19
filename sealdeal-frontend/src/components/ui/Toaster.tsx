import { Toaster as SonnerToaster } from 'sonner';

const Toaster = () => {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: 'bg-card border border-primary/20 text-foreground',
          title: 'text-foreground',
          description: 'text-muted-foreground',
          error: '!bg-destructive !text-destructive-foreground',
          success: '!bg-primary !text-primary-foreground',
        },
      }}
    />
  );
};

export { Toaster };
