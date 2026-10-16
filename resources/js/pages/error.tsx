import { Head } from '@inertiajs/react';
import { Button } from '@admin-panel/ui';

type ErrorProps = {
  status: 403 | 404 | 500;
  homeUrl: string;
  messages: Record<'403' | '404' | '500', { title: string; description: string }> & {
    home: string;
    retry: string;
  };
};

export default function ErrorPage({ status, homeUrl, messages }: ErrorProps) {
  const message = messages[String(status) as '403' | '404' | '500'];

  return (
    <>
      <Head title={`${status} · ${message.title}`} />
      <main className="flex min-h-svh items-center justify-center bg-background px-5 py-10 text-foreground">
        <section className="flex w-full max-w-md flex-col items-center text-center">
          <p className="mb-6 text-8xl font-semibold leading-none tracking-tighter text-muted-foreground/40 sm:text-9xl">{status}</p>
          <h1 className="text-xl font-semibold tracking-tight">{message.title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{message.description}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button nativeButton={false} render={<a href={homeUrl} />}>
              {messages.home}
            </Button>
            {status === 500 && (
              <Button variant="outline" onClick={() => window.location.reload()}>
                {messages.retry}
              </Button>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
