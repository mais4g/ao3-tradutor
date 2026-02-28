import { AuthForm } from '@/components/auth-form';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          AO3 Tradutor
        </h1>
        <p className="mt-2 text-muted-foreground">
          Traduza fanfics do AO3 automaticamente e gerencie sua biblioteca.
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
