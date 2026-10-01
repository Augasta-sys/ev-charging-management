import { useState } from "react";
import { Outlet } from "react-router-dom";

import Header from "../layouts/Header";
import Sidebar from "../layouts/Sidebar";

function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="fixed left-0 right-0 top-0 z-50 w-full max-w-full">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
        />
      </div>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-primary)] pt-20 lg:pl-72">
        <main className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-[2000px] overflow-x-hidden bg-[var(--bg-primary)] p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="w-full min-w-0 max-w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;