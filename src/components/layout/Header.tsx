import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Wallet, 
  ArrowLeftRight, 
  History, 
  Settings, 
  User,
  Menu,
  X,
  Shield,
  LayoutDashboard,
  Send,
  Download,
  Clock,
  LogOut,
  ChevronDown,
  FileSpreadsheet
} from "lucide-react";

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const Header = ({ activeTab, onTabChange }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const isAdminPage = location.pathname === "/admin";

  const navItems = [
    { id: "dashboard", label: "داشبورد", icon: Wallet },
    { id: "exchange", label: "تبدیل ارز", icon: ArrowLeftRight },
    { id: "history", label: "تراکنش‌ها", icon: History },
    { id: "settings", label: "تنظیمات", icon: Settings },
  ];

  const walletLink = { href: "/wallets", label: "کیف پول‌ها", icon: Wallet };

  const transferMenuItems = [
    { href: "/hawala/new", label: "حواله جدید", icon: Send },
    { href: "/exchange/new", label: "تبدیل ارز جدید", icon: ArrowLeftRight },
    { href: "/transfers/send", label: "ارسال حواله", icon: Send },
    { href: "/transfers/receive", label: "دریافت حواله", icon: Download },
    { href: "/transfers/pending", label: "حواله‌های در انتظار", icon: Clock },
    { href: "/transfers/history", label: "تاریخچه حواله‌ها", icon: History },
    { href: "/import", label: "ایمپورت گزارش اکسل", icon: FileSpreadsheet },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
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
          </Link>

          {/* Desktop Navigation */}
          {!isAdminPage && onTabChange && (
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

              {/* Wallet Link */}
              {user && (
                <Link
                  to="/wallets"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300"
                >
                  <Wallet className="h-4 w-4" />
                  کیف پول
                </Link>
              )}

              {/* Transfer Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300">
                    <Send className="h-4 w-4" />
                    حواله
                    <ChevronDown className="h-3 w-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {transferMenuItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link to={item.href} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          )}

          {isAdminPage && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
              >
                <Wallet className="h-4 w-4" />
                صفحه اصلی
              </Link>
            </nav>
          )}

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {isAdmin && !isAdminPage && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="hidden sm:flex text-accent">
                      <LayoutDashboard className="h-4 w-4 ml-2" />
                      پنل ادمین
                    </Button>
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      <User className="h-4 w-4 ml-2" />
                      حساب کاربری
                    </Button>
                  </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-muted-foreground text-xs">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4 ml-2" />
                        تنظیمات
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="h-4 w-4 ml-2" />
                      خروج
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <User className="h-4 w-4 ml-2" />
                    ورود
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="hidden sm:flex">
                    ثبت‌نام
                  </Button>
                </Link>
              </>
            )}

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
            {!isAdminPage && onTabChange ? (
              <>
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

                <div className="border-t border-border/50 my-2 pt-2">
                  <p className="px-4 py-2 text-xs text-muted-foreground font-semibold">حواله‌ها</p>
                  {transferMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Wallet className="h-5 w-5" />
                صفحه اصلی
              </Link>
            )}

            {user && isAdmin && !isAdminPage && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-accent hover:bg-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                پنل ادمین
              </Link>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
              {user ? (
                <Button variant="destructive" className="flex-1" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 ml-2" />
                  خروج
                </Button>
              ) : (
                <>
                  <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      ورود
                    </Button>
                  </Link>
                  <Link to="/auth" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">
                      ثبت‌نام
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
