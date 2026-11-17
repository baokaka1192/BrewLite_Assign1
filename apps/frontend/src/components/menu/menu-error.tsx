import { StateIllustration } from '@/components/shared/state-illustration';
import { Button } from '@/components/ui/button';

export function MenuError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="motion-safe:animate-fade-in border border-border bg-surface px-6 py-12 text-center">
      <StateIllustration variant="error" className="mx-auto mb-4" />
      <p className="text-lg font-semibold">We couldn&rsquo;t load the menu.</p>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <Button className="mt-6" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
