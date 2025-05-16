import React from 'react';
import { Link, useLocation } from 'wouter';
import { FaTasks, FaHome, FaUserGraduate, FaSignOutAlt } from 'react-icons/fa';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface TeacherLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const TeacherLayout: React.FC<TeacherLayoutProps> = ({ children, title = 'Öğretmen Paneli' }) => {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/teacher">
              <div className="cursor-pointer flex items-center">
                <img 
                  src="/vildan-logo.png" 
                  alt="Vildan Koleji" 
                  className="h-10 w-auto" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/40x40?text=VK";
                  }}
                />
                <span className="ml-2 font-bold text-primary hidden sm:inline">Vildan Koleji</span>
              </div>
            </Link>
            <h1 className="text-xl font-bold truncate">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback>ÖĞ</AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/logout" className="flex items-center space-x-1">
                <FaSignOutAlt className="h-4 w-4" />
                <span>Çıkış</span>
              </a>
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content with Navigation */}
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 shrink-0 bg-white rounded-lg shadow p-4">
          <ul className="space-y-2">
            <li>
              <Link href="/teacher">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 ${location === '/teacher' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                  <FaHome className="h-5 w-5" />
                  <span>Ana Sayfa</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/teacher/attendance">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 ${location === '/teacher/attendance' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                  <FaTasks className="h-5 w-5" />
                  <span>Etüt Yoklama</span>
                </a>
              </Link>
            </li>
            <li>
              <Link href="/teacher/students">
                <a className={`flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 ${location === '/teacher/students' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                  <FaUserGraduate className="h-5 w-5" />
                  <span>Öğrenciler</span>
                </a>
              </Link>
            </li>
          </ul>
        </nav>
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="py-4 text-center text-sm text-gray-500 mt-auto">
        <p>© {new Date().getFullYear()} Vildan Koleji - Tüm Hakları Saklıdır</p>
      </footer>
    </div>
  );
};

export default TeacherLayout;