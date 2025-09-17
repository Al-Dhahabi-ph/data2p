import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  BookOpen, 
  GraduationCap, 
  FolderOpen, 
  Settings,
  BarChart3,
  Users,
  FileText,
  Calendar
} from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import SubjectsManagement from './SubjectsManagement';
import LecturesManagement from './LecturesManagement';
import ResourcesManagement from './ResourcesManagement';
import SystemSettings from './SystemSettings';
import ScheduleManagement from './ScheduleManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    subjects: 0,
    lectures: 0,
    sections: 0,
    recentActivity: null as any
  });

  useEffect(() => {
    // Load real stats from Firebase
    const coursesRef = ref(database, 'courses');
    const lecturesRef = ref(database, 'lectures');
    const sectionsRef = ref(database, 'sections');

    // Count subjects
    const unsubscribeCourses = onValue(coursesRef, (snapshot) => {
      const subjectsCount = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      setStats(prev => ({ ...prev, subjects: subjectsCount }));
    });

    // Count lectures
    const unsubscribeLectures = onValue(lecturesRef, (snapshot) => {
      let lecturesCount = 0;
      let latestActivity: any = null;
      let latestDate = 0;

      if (snapshot.exists()) {
        const lecturesData = snapshot.val();
        Object.keys(lecturesData).forEach(courseId => {
          const courseLectures = lecturesData[courseId];
          lecturesCount += Object.keys(courseLectures).length;
          
          // Find most recent activity
          Object.values(courseLectures).forEach((lecture: any) => {
            const lectureDate = new Date(lecture.dateAdded || lecture.createdAt || 0).getTime();
            if (lectureDate > latestDate) {
              latestDate = lectureDate;
              latestActivity = {
                title: lecture.title,
                type: 'lecture',
                course: lecture.courseCode || 'Unknown'
              };
            }
          });
        });
      }
      
      setStats(prev => ({ ...prev, lectures: lecturesCount, recentActivity: latestActivity }));
    });

    // Count sections
    const unsubscribeSections = onValue(sectionsRef, (snapshot) => {
      let sectionsCount = 0;
      
      if (snapshot.exists()) {
        const sectionsData = snapshot.val();
        Object.keys(sectionsData).forEach(courseId => {
          const courseSections = sectionsData[courseId];
          sectionsCount += Object.keys(courseSections).length;
        });
      }
      
      setStats(prev => ({ ...prev, sections: sectionsCount }));
    });

    return () => {
      unsubscribeCourses();
      unsubscribeLectures();
      unsubscribeSections();
    };
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6 mb-8">
        <TabsTrigger value="dashboard" className="flex items-center space-x-2">
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="subjects" className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Subjects</span>
        </TabsTrigger>
        <TabsTrigger value="lectures" className="flex items-center space-x-2">
          <GraduationCap className="w-4 h-4" />
          <span className="hidden sm:inline">Lectures</span>
        </TabsTrigger>
        <TabsTrigger value="resources" className="flex items-center space-x-2">
          <FolderOpen className="w-4 h-4" />
          <span className="hidden sm:inline">Resources</span>
        </TabsTrigger>
        <TabsTrigger value="schedule" className="flex items-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Schedule</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex items-center space-x-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Settings</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.subjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Lectures</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.lectures}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.sections}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">+23%</div>
              <p className="text-xs text-muted-foreground">from last month</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity ? (
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-accent rounded-full"></div>
                <div>
                  <p className="font-medium text-foreground">{stats.recentActivity.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.recentActivity.type} added to {stats.recentActivity.course}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="subjects">
        <SubjectsManagement />
      </TabsContent>

      <TabsContent value="lectures">
        <LecturesManagement />
      </TabsContent>

      <TabsContent value="resources">
        <ResourcesManagement />
      </TabsContent>

      <TabsContent value="schedule">
        <ScheduleManagement />
      </TabsContent>

      <TabsContent value="settings">
        <SystemSettings />
      </TabsContent>
    </Tabs>
  );
};

export default AdminDashboard;