import { Navbar } from "@/components/Navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container py-4 sm:py-6">{children}</main>
    </div>
  );
}
