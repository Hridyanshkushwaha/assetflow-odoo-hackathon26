export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-16">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-accent" />
    </div>
  );
}
