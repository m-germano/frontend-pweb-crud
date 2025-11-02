import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Globe,
  Flag,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/continents', label: 'Continents', icon: Globe },
  { to: '/countries', label: 'Countries', icon: Flag },
  { to: '/cities', label: 'Cities', icon: MapPin },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function Sidebar({ collapsed, onToggle, isMobile = false }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-background border-r border-border transition-all duration-300 flex flex-col',
        // Largura fixa baseada no estado
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="font-bold text-lg text-foreground flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            GeoInfo
          </div>
        )}
        {/* Mostra botão toggle apenas no desktop */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
        {/* No mobile, mostra apenas o ícone do globo quando colapsado */}
        {isMobile && collapsed && (
          <div className="flex items-center justify-center w-8 h-8">
            <Globe className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  // Sempre centralizado quando colapsado (mobile ou desktop)
                  collapsed ? 'justify-center' : ''
                )
              }
              end={item.to === '/'}
            >
              <Icon className={cn('h-5 w-5', !collapsed && 'mr-3')} />
              {!collapsed && item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}