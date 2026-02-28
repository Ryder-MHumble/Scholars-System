export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-[72px] h-[72px] rounded-xl bg-gray-100 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-6 bg-gray-100 rounded animate-pulse w-32" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
          <div className="h-4 bg-gray-100 rounded animate-pulse w-28" />
        </div>
      </div>
      <div className="h-4 bg-gray-100 rounded animate-pulse w-40 mb-4" />
      <div className="flex gap-1.5 mb-4">
        <div className="h-6 bg-gray-100 rounded-full animate-pulse w-20" />
        <div className="h-6 bg-gray-100 rounded-full animate-pulse w-24" />
      </div>
      <div className="flex gap-2 mb-4">
        <div className="flex-1 h-9 bg-gray-100 rounded-lg animate-pulse" />
        <div className="flex-1 h-9 bg-gray-100 rounded-lg animate-pulse" />
      </div>
      <div className="flex justify-between pt-3 border-t border-gray-100">
        <div className="h-4 bg-gray-100 rounded animate-pulse w-24" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-20" />
      </div>
    </div>
  );
}

export function SidebarSectionSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="h-5 bg-gray-200 rounded animate-pulse w-24 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="h-5 bg-gray-200 rounded animate-pulse w-32 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
}

export function StatsSidebarSkeleton() {
  return (
    <aside className="w-80 shrink-0 space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-24 mb-4" />
        <div className="h-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="h-5 bg-gray-200 rounded animate-pulse w-24 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-24 mb-6" />

        <div className="flex gap-5">
          {/* Left Sidebar */}
          <aside className="w-[400px] shrink-0 space-y-4">
            <ProfileCardSkeleton />
            <SidebarSectionSkeleton />
            <SidebarSectionSkeleton />
            <SidebarSectionSkeleton />
          </aside>

          {/* Center Content */}
          <main className="flex-1 min-w-0 space-y-4">
            <ContentCardSkeleton />
            <ContentCardSkeleton />
            <ContentCardSkeleton />
          </main>

          {/* Right Sidebar */}
          <StatsSidebarSkeleton />
        </div>
      </div>
    </div>
  );
}
