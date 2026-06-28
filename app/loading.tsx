export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#FAFAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#6D4AFF]/30 border-t-[#6D4AFF] rounded-full animate-spin" />
        <p className="text-sm text-[#9CA3AF]">Loading...</p>
      </div>
    </div>
  );
}
