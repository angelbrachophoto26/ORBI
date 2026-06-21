import Sidebar from "@/components/layout/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-orbi-bg overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">{children}</main>
    </div>
  );
}
