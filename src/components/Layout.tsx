
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Brain } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Chat", href: "/chat" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Resources", href: "/resources" },
  { label: "Upload", href: "/upload" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-memora-gray">
      <header className="w-full py-4 px-6 flex items-center justify-between backdrop-blur-sm bg-white/50 border-b border-slate-100 sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-memora-purple to-memora-purple-dark flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-xl text-gradient">Memora</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={`text-sm font-medium transition-colors ${
                location.pathname === item.href
                  ? "text-memora-purple-dark"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu size={24} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`text-lg font-medium transition-colors p-2 rounded-md ${
                    location.pathname === item.href
                      ? "bg-memora-purple/10 text-memora-purple-dark"
                      : "hover:bg-memora-purple/5"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </header>

      <main className="container mx-auto px-4 py-6">{children}</main>

      <footer className="py-6 px-4 text-center text-sm text-foreground/60">
        <p>© {new Date().getFullYear()} Memora - Supporting Alzheimer's patients and caregivers</p>
      </footer>
    </div>
  );
}
