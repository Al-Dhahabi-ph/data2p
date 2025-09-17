import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import { getCurrentDayName } from '@/utils/dateUtils';

interface TodayScheduleProps {
  courses: Array<{
    id: string;
    name: string;
    code: string;
    type: 'lecture' | 'section';
    time?: string;
  }>;
}

export const TodaySchedule = ({ courses }: TodayScheduleProps) => {
  const today = getCurrentDayName();

  return (
    <Card className="mb-8 bg-gradient-to-r from-accent/10 to-primary/10 border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-accent">
          <Calendar className="w-5 h-5" />
          <span>Today's Schedule - {today}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {courses.length > 0 ? (
          <div className="space-y-3">
            {courses.map((course, index) => (
              <div 
                key={course.id + index}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-border/50"
              >
                <div>
                  <h4 className="font-medium text-foreground">{course.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {course.code} • {course.type === 'lecture' ? 'Lecture' : 'Section'}
                  </p>
                </div>
                
                {course.time && (
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{course.time}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">
            No classes scheduled for today
          </p>
        )}
      </CardContent>
    </Card>
  );
};