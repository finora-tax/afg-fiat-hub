import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  ArrowLeftRight, 
  History, 
  Settings, 
  User,
  Menu,
  X,
  Shield
} from "lucide-react";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "داشبورد", icon: Wallet },
    { id: "exchange", label: "تبدیل ارز", icon: ArrowLeftRight },
    { id: "history", label: "تراکنش‌ها", icon: History },
    { id: "settings", label: "تنظیمات", icon: Settings },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">صرافی افغان</h1>
              <p className="text-xs text-muted-foreground">Afghan Exchange</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <User className="h-4 w-4 ml-2" />
              ورود
            </Button>
            <Button size="sm" className="hidden sm:flex">
              ثبت‌نام
            </Button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            ))}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
              <Button variant="outline" className="flex-1">
                ورود
              </Button>
              <Button className="flex-1">
                ثبت‌نام
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
