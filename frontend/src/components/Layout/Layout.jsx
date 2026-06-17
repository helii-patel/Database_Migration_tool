import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 transition-colors duration-200">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className="transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
        <Topbar collapsed={collapsed} />
        <main className="p-6 pt-24 min-h-screen">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
