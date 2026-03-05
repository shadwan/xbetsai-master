import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Image
            src="/logo_dark.svg"
            alt="xBetsAI"
            width={160}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 text-text-primary shadow-xl">
          {children}
        </div>
      </div>
    </div>
  );
}
