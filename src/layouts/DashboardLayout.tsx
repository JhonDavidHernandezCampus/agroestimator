import React, { useState } from "react";
import {
  Navigate,
  Outlet,
  NavLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader } from "../components/common/Loader";
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Truck,
  User,
  LogOut,
  Menu,
  X,
  Leaf,
  CloudLightning,
} from "lucide-react";
import { navigationRoutes } from "../routes/appRoutes";

export function DashboardLayout() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Loading Session Recovery
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Auth Guard: Redirect anonymous users to the login screen
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = navigationRoutes;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background-custom font-sans text-on-background-custom pb-16 md:pb-0">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-lowest border-r border-[#EEFFCD] shadow-[4px_0_20px_rgba(30,41,59,0.02)] fixed h-screen z-30">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-outline-variant bg-surface-bright shrink-0">
          <Leaf className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-xl font-extrabold text-primary tracking-tight">
            AgroEstimador
          </span>
        </div>

        {/* User Badge inside Sidebar */}
        <div className="p-4 border-b border-outline-variant/50 bg-surface-container-low/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold border border-primary/20">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-on-surface truncate">
                {user?.name}
              </span>
              <span className="text-xs text-on-surface-variant truncate">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:bg-[#bfff8a]/20 hover:text-primary"
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout bottom trigger */}
        <div className="p-4 border-t border-outline-variant bg-surface-bright shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 h-12 rounded-xl text-sm font-semibold text-error-custom hover:bg-error-container/20 transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-40 bg-surface-lowest/85 backdrop-blur-md border-b border-outline-variant h-16 flex items-center justify-between px-6 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-full hover:bg-surface-container text-on-surface-variant cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            <h1 className="text-lg font-bold text-primary tracking-tight md:hidden">
              AgroEstimador
            </h1>
            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
              <span>Sistemas de Precisión</span>
              <span className="text-outline-variant">/</span>
              <span className="text-primary capitalize">
                {location.pathname.split("/")[1] || "Panel"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/*   <div className="hidden sm:flex items-center bg-secondary-container px-3 py-1 rounded-full text-on-secondary-container gap-1.5 text-xs font-bold border border-on-secondary-container/10">
              <CloudLightning className="w-3.5 h-3.5 animate-bounce" />
              <span>API AWS Lambda</span>
            </div> */}
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs">
              {user?.name.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Mobile Drawer Navigation overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-30 flex">
            <div
              className="absolute inset-0 bg-on-background-custom/45 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative bg-surface-lowest w-64 max-w-sm h-full flex flex-col border-r border-[#EEFFCD] shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="h-16 flex items-center gap-3 px-6 border-b border-outline-variant">
                <Leaf className="w-6 h-6 text-primary" />
                <span className="text-lg font-extrabold text-primary">
                  AgroEstimador
                </span>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 h-12 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-on-surface-variant hover:bg-[#bfff8a]/20 hover:text-primary"
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
              <div className="p-4 border-t border-outline-variant">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 h-12 rounded-xl text-sm font-semibold text-error-custom hover:bg-error-container/20 transition-all cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable contents view */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </div>

        {/* 3. Mobile Navigation Bottom Bar */}
        <nav className="md:hidden fixed bottom-1 left-3 right-3 z-40 bg-surface-lowest/90 backdrop-blur-md rounded-2xl border border-[#EEFFCD] shadow-[0_-4px_20px_rgba(30,41,59,0.08)] flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all text-center rounded-xl ${
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                <div
                  className={`p-1.5 px-3 rounded-full flex items-center justify-center ${isActive ? "bg-primary-container text-on-primary-container scale-105 shadow-sm" : ""} transition-all`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                </div>
                <span className="text-[10px] font-bold mt-1 tracking-tight">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
