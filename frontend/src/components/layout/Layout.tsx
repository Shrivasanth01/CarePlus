import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { DemoToolbar } from '../common/DemoToolbar';
import { LoginModal } from '../common/LoginModal';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col font-sans">
      {/* Top Demo Toolbar */}
      <DemoToolbar />

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content Area */}
        <div
          className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
            collapsed ? 'ml-20' : 'ml-64'
          }`}
        >
          <Header sidebarCollapsed={collapsed} />

          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Role Selection / Portal Login Modal */}
      <LoginModal />
    </div>
  );
};
