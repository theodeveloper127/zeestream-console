import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Film,
  Users,
  MessageSquare,
  Play,
  Settings,
  TrendingUp,
} from 'lucide-react';

const menuItems = [
  {
    title: 'Dashboard',
    url: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Movies',
    url: '/admin/movies',
    icon: Film,
  },
  {
    title: 'Episodes',
    url: '/admin/episodes',
    icon: Play,
  },
  {
    title: 'Users',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Comments',
    url: '/admin/comments',
    icon: MessageSquare,
  },
  {
    title: 'Analytics',
    url: '/admin/analytics',
    icon: TrendingUp,
  },
];

export const AdminSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar
      className={`border-r border-border bg-card transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
      collapsible="icon"
    >
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 px-2">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Film className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">Zeestream</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? 'sr-only' : ''}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer */}
        {!collapsed && (
          <div className="mt-auto pt-4 border-t border-border">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">
                © 2024 Zeestream Admin
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
};