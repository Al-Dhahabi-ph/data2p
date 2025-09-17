import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { CourseCard } from '@/components/CourseCard';
import { TodaySchedule } from '@/components/TodaySchedule';
import { Sidebar } from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { useObject } from 'react-firebase-hooks/database';
import { getCurrentDayName } from '@/utils/dateUtils';

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  hasPracticals: boolean;
  lectureCount?: number;
  sectionCount?: number;
}

const Index = () => {
  console.log("Index component rendering...");
  
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recentItems, setRecentItems] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);

  // Load courses from Firebase and get real counts
  const [snapshot, loading, error] = useObject(ref(database, 'courses'));

  useEffect(() => {
    if (snapshot?.exists()) {
      const coursesData = snapshot.val();
      const coursesArray = Object.keys(coursesData).map(key => ({
        id: key,
        ...coursesData[key],
        lectureCount: 0,
        sectionCount: 0
      }));

      // Update counts in real-time
      coursesArray.forEach((course) => {
        const lecturesRef = ref(database, `lectures/${course.id}`);
        const sectionsRef = ref(database, `sections/${course.id}`);
        
        onValue(lecturesRef, (lecturesSnapshot) => {
          const lectureCount = lecturesSnapshot.exists() ? Object.keys(lecturesSnapshot.val()).length : 0;
          setCourses(prev => prev.map(c => 
            c.id === course.id ? { ...c, lectureCount } : c
          ));
        });

        if (course.hasPracticals) {
          onValue(sectionsRef, (sectionsSnapshot) => {
            const sectionCount = sectionsSnapshot.exists() ? Object.keys(sectionsSnapshot.val()).length : 0;
            setCourses(prev => prev.map(c => 
              c.id === course.id ? { ...c, sectionCount } : c
            ));
          });
        }
      });
      
      setCourses(coursesArray);
    }
  }, [snapshot]);

  // Load real data from Firebase
  useEffect(() => {
    // Load recent items (latest lectures and sections)
    const lecturesRef = ref(database, 'lectures');
    const sectionsRef = ref(database, 'sections');
    const schedulesRef = ref(database, 'schedules');

    // Get recent lectures and sections - filtered to last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const unsubscribeLectures = onValue(lecturesRef, (snapshot) => {
      if (snapshot.exists()) {
        const allLectures: any[] = [];
        const lecturesData = snapshot.val();
        
        Object.keys(lecturesData).forEach(courseId => {
          const courseLectures = lecturesData[courseId];
          Object.keys(courseLectures).forEach(lectureId => {
            const lecture = courseLectures[lectureId];
            const dateAdded = new Date(lecture.dateAdded || new Date());
            
            // Only include if within last 3 days
            if (dateAdded >= threeDaysAgo) {
              allLectures.push({
                id: lectureId,
                courseId: courseId,
                type: 'lecture',
                ...lecture
              });
            }
          });
        });

        const unsubscribeSections = onValue(sectionsRef, (snapshot) => {
          const allItems = [...allLectures];
          
          if (snapshot.exists()) {
            const sectionsData = snapshot.val();
            Object.keys(sectionsData).forEach(courseId => {
              const courseSections = sectionsData[courseId];
              Object.keys(courseSections).forEach(sectionId => {
                const section = courseSections[sectionId];
                const dateAdded = new Date(section.dateAdded || new Date());
                
                // Only include if within last 3 days
                if (dateAdded >= threeDaysAgo) {
                  allItems.push({
                    id: sectionId,
                    courseId: courseId,
                    type: 'section',
                    ...section
                  });
                }
              });
            });
          }

          // Sort by date and take the latest items
          allItems.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
          setRecentItems(allItems);
        });
      }
    });

    // Load today's schedule
    const today = getCurrentDayName().toLowerCase();
    const todayScheduleRef = ref(database, `schedules/${today}`);
    
    const unsubscribeSchedule = onValue(todayScheduleRef, (snapshot) => {
      if (snapshot.exists()) {
        const scheduleData = snapshot.val();
        const scheduleArray = Object.keys(scheduleData).map(key => ({
          id: key,
          ...scheduleData[key]
        }));
        setTodaySchedule(scheduleArray);
      } else {
        setTodaySchedule([]);
      }
    });

    return () => {
      unsubscribeLectures();
      unsubscribeSchedule();
    };
  }, []);

  const handleAdminClick = () => {
    navigate('/admin');
  };

  const rightAction = (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={handleAdminClick}
      className="hover:bg-accent/10"
    >
      <Settings className="w-5 h-5" />
    </Button>
  );

  const leftAction = <Sidebar items={recentItems} />;

  return (
    <Layout 
      title="Data2P"
      rightAction={rightAction}
      leftAction={leftAction}
    >
      {/* Today's Schedule */}
      <TodaySchedule courses={todaySchedule} />

      {/* Courses Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Courses</h2>
        
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error loading courses</p>
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses available yet. Add some courses from the admin panel.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Index;
