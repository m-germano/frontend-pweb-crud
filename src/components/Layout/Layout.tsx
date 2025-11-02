import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useMobile();

  // No mobile, força colapsado (apenas ícones)
  // No desktop, usa o estado normal
  const isCollapsed = isMobile ? true : sidebarCollapsed;

  const toggleSidebar = () => {
    if (!isMobile) {
      setSidebarCollapsed(!sidebarCollapsed);
    }
    // No mobile não faz nada quando clica no toggle, pois sempre fica colapsado
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar 
        collapsed={isCollapsed}
        isMobile={isMobile}
        onToggle={toggleSidebar}
      />
      
      {/* Conteúdo principal */}
      <div className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        // No mobile: margem fixa para sidebar colapsada
        isMobile && "ml-16",
        // No desktop: margem variável baseada no estado
        !isMobile && (sidebarCollapsed ? "ml-16" : "ml-64")
      )}>
        <main className="p-4 md:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}