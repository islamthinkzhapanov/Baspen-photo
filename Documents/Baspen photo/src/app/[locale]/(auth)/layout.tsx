export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: photo */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold text-primary mb-4 font-[var(--font-display)]">
            Baspen
          </h1>
          <p className="text-text-secondary text-lg">
            Photo distribution platform for events
          </p>
        </div>
      </div>
      {/* Right: form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
