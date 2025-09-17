import { ReactNode, useState, useEffect } from 'react';
import logo from '@/assets/data2p-logo.png';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: ReactNode;
  leftAction?: ReactNode;
}

export const Layout = ({ 
  children, 
  title = "Data2P", 
  showBackButton = false, 
  onBackClick,
  rightAction,
  leftAction 
}: LayoutProps) => {
  const [logoUrl, setLogoUrl] = useState(logo);

  useEffect(() => {
    // Check for custom logo in localStorage
    const customLogo = localStorage.getItem('data2p-logo-url');
    if (customLogo) {
      setLogoUrl(customLogo);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left Action */}
            <div className="w-10 h-10 flex items-center justify-center">
              {leftAction}
            </div>

            {/* Center - Logo Only */}
            <div className="flex items-center justify-center">
              <img 
                src={logoUrl} 
                alt="Data2P Logo" 
                className="h-8 w-auto animate-fade-in"
                onError={(e) => {
                  // Fallback to default logo if custom logo fails
                  (e.target as HTMLImageElement).src = logo;
                }}
              />
            </div>

            {/* Right Action */}
            <div className="w-10 h-10 flex items-center justify-center">
              {rightAction}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 animate-fade-in">
        {children}
      </main>

      <footer className="bg-card border-t border-border mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground">© Data2P - By Al Dhahabi</p>
        </div>
      </footer>
    </div>
  );
};