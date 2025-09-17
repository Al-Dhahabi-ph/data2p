import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, BookOpen, Users, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SidebarItem {
  id: string;
  title: string;
  type: 'lecture' | 'section';
  courseName: string;
  courseCode: string;
  dateAdded: Date;
}

interface SidebarProps {
  items: SidebarItem[];
}

export const Sidebar = ({ items }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (item: SidebarItem) => {
    const path = item.type === 'lecture' ? `/lecture/${item.id}` : `/section/${item.id}`;
    navigate(path);
    setIsOpen(false);
  };

  const getIcon = (type: 'lecture' | 'section') => {
    return type === 'lecture' ? BookOpen : Users;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="hover:bg-accent/10"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center space-x-2 text-accent">
            <Calendar className="w-5 h-5" />
            <span>Latest Updates</span>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          {items.length > 0 ? (
            items.map((item) => {
              const Icon = getIcon(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="p-3 rounded-lg border border-border hover:bg-accent/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-4 h-4 mt-1 text-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.type === 'lecture' ? 'Lecture' : 'Section'} • {item.courseCode}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.courseName}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground text-center py-8 text-sm">
              No recent updates
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};