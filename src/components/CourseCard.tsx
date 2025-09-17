import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  hasPracticals: boolean;
}

interface CourseCardProps {
  course: Course;
}

export const CourseCard = ({ course }: CourseCardProps) => {
  const navigate = useNavigate();

  const handleDetailsClick = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-accent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-foreground font-semibold">
          {course.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground font-medium">
          {course.code}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <Button 
          onClick={handleDetailsClick}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
};