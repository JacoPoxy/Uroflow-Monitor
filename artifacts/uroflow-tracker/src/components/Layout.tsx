import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Droplet, Activity, History, Plus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: Activity },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0 flex flex-col md:flex-row">
      
      {/* Mobile Top Header */}
      <header className="md:hidden glass-panel sticky top-0 z-40 px-4 h-16 flex items-center justify-center border-b border-border/50">
        <div className="flex items-center gap-2 text-primary">
          <Droplet className="w-6 h-6 fill-primary/20" />
          <h1 className="font-display font-bold text-xl tracking-tight">Uroflow</h1>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col glass-panel border-r border-border/50 min-h-screen sticky top-0 px-6 py-8">
        <div className="flex items-center gap-3 text-primary mb-12 px-2">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Droplet className="w-8 h-8 fill-primary/20" />
          </div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Uroflow</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}>
                  <item.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="active-nav-indicator"
                      className="absolute left-0 w-1.5 h-8 bg-primary rounded-r-full"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="pt-8">
          <Link href="/log" className="block w-full">
            <div className="w-full bg-gradient-to-br from-primary to-blue-600 text-white rounded-xl p-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 font-bold group cursor-pointer">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              Log Voiding
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-border/50 pb-safe z-50 px-6 h-20 flex items-center justify-between">
        {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                  isActive ? "text-primary" : "text-slate-400"
                )}>
                  <item.icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </div>
              </Link>
            );
        })}
        
        {/* Floating Action Button for Mobile */}
        <div className="absolute left-1/2 -top-6 -translate-x-1/2">
          <Link href="/log">
            <div className="bg-gradient-to-br from-primary to-blue-600 w-16 h-16 rounded-full flex items-center justify-center shadow-xl shadow-primary/30 text-white hover:scale-105 active:scale-95 transition-all cursor-pointer border-4 border-background">
              <Plus className="w-8 h-8" />
            </div>
          </Link>
        </div>
      </nav>
      
      {/* Safe area padding for mobile */}
      <div className="h-6 md:hidden bg-transparent pb-safe" />
    </div>
  );
}
