export default function OpsLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-24 rounded bg-line" />
      <div className="mt-3 h-9 w-64 rounded bg-line" />
      <div className="mt-4 h-4 w-full max-w-xl rounded bg-line" />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-24 rounded-lg border border-line bg-card" />
        ))}
      </div>
    </div>
  );
}
