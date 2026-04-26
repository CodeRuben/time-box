function LoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-start justify-center bg-background px-4 pt-[35vh] pb-6 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
    >
      <span className="animate-pulse text-base font-semibold text-muted-foreground motion-reduce:animate-none sm:text-lg">
        Loading...
      </span>
    </div>
  );
}

export { LoadingScreen };
