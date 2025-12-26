import { Home, Upload, Folder, LayoutTemplate } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const navItems = [
    { to: "/", icon: Home, label: "Dashboard" },
    { to: "/files", icon: Folder, label: "Files" },
    { to: "/album-builder", icon: LayoutTemplate, label: "Album Builder" },
    { to: "/upload", icon: Upload, label: "Upload" },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col p-4 sticky top-0">
      <div className="text-2xl font-bold text-sidebar-foreground mb-8 px-4">
        Admin
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
