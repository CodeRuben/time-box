function LoadingScreen() {
  return (
    <div
      className="flex min-h-screen items-start justify-center px-4 pt-[35vh] pb-6 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
    >
      <span className="shimmer text-base font-semibold text-muted-foreground sm:text-lg">
        Loading...
      </span>
    </div>
  );
}

export { LoadingScreen };
