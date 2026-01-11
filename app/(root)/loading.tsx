export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent mb-4" />
        <p className="text-sm text-muted-foreground">Fetching your data...</p> 
      </div>
    </div>
  );
}