import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTurkishDate } from "@/hooks/use-turkish-date";
import VildanLogoPng from "@/assets/vildan-logo.png";
import { 
  LayoutDashboard, 
  Calendar,
  CalendarDays, 
  ClipboardList, 
  UserX, 
  PlusCircle, 
  Users, 
  School, 
  BookOpen, 
  Settings, 
  Bell, 
  LogOut, 
  Menu, 
  UserCog,
  X,
  GraduationCap,
  BookOpenCheck,
  Backpack
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  isActive: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
}

export default function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const { formattedDate, formattedTime } = useTurkishDate({ updateInterval: 30000 });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Menü öğeleri için renk fonksiyonları
  const getMenuItemStyle = (href: string) => {
    const isActive = location === href;
    
    // Her menü öğesi için farklı renk
    if (isActive) {
      if (href === "/") return "bg-blue-100 text-blue-700";
      if (href === "/schedule" || href === "/schedule-management") return "bg-green-100 text-green-700";
      if (href === "/periods") return "bg-purple-100 text-purple-700";
      if (href === "/duty") return "bg-amber-100 text-amber-700";
      if (href === "/absent") return "bg-red-100 text-red-700";
      if (href === "/extra-lesson") return "bg-indigo-100 text-indigo-700";
      if (href === "/students") return "bg-orange-100 text-orange-700";
      if (href === "/student-courses") return "bg-pink-100 text-pink-700";
      if (href === "/homework-sessions") return "bg-cyan-100 text-cyan-700";
      if (href === "/homework-attendance") return "bg-lime-100 text-lime-700";
      if (href.includes("/admin")) return "bg-teal-100 text-teal-700";
      
      // Varsayılan aktif stil
      return "bg-primary/10 text-primary";
    }
    
    // Aktif olmayan stil
    return "hover:bg-neutral-100 text-neutral-500";
  };
  
  // İkon renkleri
  const getIconColor = (href: string) => {
    if (href === "/") return "text-blue-500";
    if (href === "/schedule" || href === "/schedule-management") return "text-green-500";
    if (href === "/periods") return "text-purple-500";
    if (href === "/duty") return "text-amber-500";
    if (href === "/absent") return "text-red-500";
    if (href === "/extra-lesson") return "text-indigo-500";
    if (href === "/students") return "text-orange-500";
    if (href === "/student-courses") return "text-pink-500";
    if (href === "/homework-sessions") return "text-cyan-500";
    if (href === "/homework-attendance") return "text-lime-500";
    if (href.includes("/admin")) return "text-teal-500";
    
    return "";
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navSections: NavSection[] = [
    {
      title: "ANA MENÜ",
      items: [
        {
          title: "Hızlı Bakış",
          href: "/",
          icon: <LayoutDashboard className="w-4 h-4" />,
          isActive: location === "/",
        },
      ],
    },
    {
      title: "DERS VE NÖBET YÖNETİMİ",
      items: [
        {
          title: "Ders Programı",
          href: "/schedule",
          icon: <Calendar className="w-4 h-4" />,
          isActive: location === "/schedule",
        },
        {
          title: "Ders Programı Yönetimi",
          href: "/schedule-management",
          icon: <Calendar className="w-4 h-4" />,
          isActive: location === "/schedule-management",
        },
        {
          title: "Zil ve Teneffüs Saatleri",
          href: "/periods",
          icon: <Bell className="w-4 h-4" />,
          isActive: location === "/periods",
        },
        {
          title: "Nöbet Yönetimi",
          href: "/duty",
          icon: <ClipboardList className="w-4 h-4" />,
          isActive: location === "/duty",
        },
        {
          title: "Öğretmen Yoklama",
          href: "/absent",
          icon: <UserX className="w-4 h-4" />,
          isActive: location === "/absent",
        },
        {
          title: "Ek Ders Hesaplaması",
          href: "/extra-lesson",
          icon: <PlusCircle className="w-4 h-4" />,
          isActive: location === "/extra-lesson",
        },
      ],
    },
    {
      title: "ETÜT VE ÖĞRENCİ YÖNETİMİ",
      items: [
        {
          title: "Öğrenci Yönetimi",
          href: "/students",
          icon: <GraduationCap className="w-4 h-4" />,
          isActive: location === "/students",
        },
        {
          title: "Öğrenci Kursları",
          href: "/student-courses",
          icon: <Backpack className="w-4 h-4" />,
          isActive: location === "/student-courses",
        },
        {
          title: "Etüt Programı",
          href: "/homework-sessions",
          icon: <BookOpenCheck className="w-4 h-4" />,
          isActive: location === "/homework-sessions",
        },
        {
          title: "Etüt Yoklama",
          href: "/homework-attendance",
          icon: <ClipboardList className="w-4 h-4" />,
          isActive: location === "/homework-attendance",
        },
      ],
    },
    {
      title: "SİSTEM YÖNETİMİ",
      items: [
        {
          title: "Öğretmenler",
          href: "/admin/teachers",
          icon: <Users className="w-4 h-4" />,
          isActive: location === "/admin/teachers",
        },
        {
          title: "Sınıflar",
          href: "/admin/classes",
          icon: <School className="w-4 h-4" />,
          isActive: location === "/admin/classes",
        },
        {
          title: "Dersler",
          href: "/admin/subjects",
          icon: <BookOpen className="w-4 h-4" />,
          isActive: location === "/admin/subjects",
        },
        {
          title: "Yönetim Paneli",
          href: "/admin",
          icon: <Settings className="w-4 h-4" />,
          isActive: location === "/admin",
        },
      ],
    },
  ];

  // Sidebar content component
  const SidebarContent = () => (
    <>
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center">
          <img src={VildanLogoPng} alt="Vildan Koleji Logo" className="h-10 w-auto mr-2" />
          <div>
            <h1 className="text-xl font-bold text-primary">Vildan İdare</h1>
            <p className="text-sm text-neutral-400">Okul Yönetim Sistemi</p>
          </div>
        </div>
      </div>
      
      <nav className="p-2 flex-1 overflow-y-auto">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-4">
            <div className="mb-1 text-neutral-400 text-xs font-medium px-3 py-2">
              {section.title}
            </div>
            
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                <Button
                  variant="ghost"
                  className={cn(
                    "flex w-full justify-start items-center px-3 py-2 rounded-md text-sm font-medium mb-1 transition-colors",
                    getMenuItemStyle(item.href)
                  )}
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    window.location.href = item.href;
                  }}
                >
                  <span className={cn("mr-3", getIconColor(item.href))}>{item.icon}</span>
                  <span>{item.title}</span>
                </Button>
              </div>
            ))}
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-t border-neutral-200 mt-auto">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
            <UserCog className="h-4 w-4" />
          </div>
          <div className="ml-2">
            <div className="text-sm font-medium">{user?.fullName || "Yönetici"}</div>
            <div className="text-xs text-neutral-400">{user?.username}</div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="ml-auto text-neutral-400 hover:text-neutral-600"
            title="Çıkış Yap"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-neutral-50">
      {/* Desktop Sidebar */}
      <aside className="bg-white shadow-md w-64 hidden md:flex md:flex-col md:h-screen">
        <SidebarContent />
      </aside>
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-64 sm:max-w-none">
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon"
              className="md:hidden mr-2"
              onClick={() => setIsMobileSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-medium">{title}</h2>
          </div>
          
          <div className="flex items-center">
            <div className="text-right mr-3">
              <div className="text-sm font-bold">{formattedDate}</div>
              <div className="text-xs text-neutral-500">{formattedTime}</div>
            </div>
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 bg-accent rounded-full w-2 h-2"></span>
              </Button>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <div className="p-4 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
