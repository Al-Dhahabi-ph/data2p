import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, Users, User } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  hasPracticals: boolean;
  theoryProfessors?: string[];
  practicalProfessors?: string[];
}

interface Lecture {
  id: string;
  title: string;
  description?: string;
  order: number;
  dateAdded: Date;
}

interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  dateAdded: Date;
}

const CoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    // Load course data
    const courseRef = ref(database, `courses/${courseId}`);
    const lecturesRef = ref(database, `lectures/${courseId}`);
    const sectionsRef = ref(database, `sections/${courseId}`);

    const unsubscribeCourse = onValue(courseRef, (snapshot) => {
      if (snapshot.exists()) {
        setCourse({ id: courseId, ...snapshot.val() });
      }
    });

    const unsubscribeLectures = onValue(lecturesRef, (snapshot) => {
      if (snapshot.exists()) {
        const lecturesData = snapshot.val();
        const lecturesArray = Object.keys(lecturesData)
          .map(key => ({ id: key, ...lecturesData[key] }))
          .sort((a, b) => b.order - a.order);
        setLectures(lecturesArray);
      } else {
        setLectures([]);
      }
    });

    const unsubscribeSections = onValue(sectionsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sectionsData = snapshot.val();
        const sectionsArray = Object.keys(sectionsData)
          .map(key => ({ id: key, ...sectionsData[key] }))
          .sort((a, b) => b.order - a.order);
        setSections(sectionsArray);
      } else {
        setSections([]);
      }
    });

    setLoading(false);

    return () => {
      unsubscribeCourse();
      unsubscribeLectures();
      unsubscribeSections();
    };
  }, [courseId]);

  const handleBackClick = () => {
    navigate('/');
  };

  const handleLectureClick = (lectureId: string) => {
    navigate(`/lecture/${lectureId}`);
  };

  const handleSectionClick = (sectionId: string) => {
    navigate(`/section/${sectionId}`);
  };

  const leftAction = (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={handleBackClick}
      className="hover:bg-accent/10"
    >
      <ArrowLeft className="w-5 h-5" />
    </Button>
  );

  if (loading) {
    return (
      <Layout title="Loading..." leftAction={leftAction}>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout title="Course Not Found" leftAction={leftAction}>
        <div className="text-center py-12">
          <p className="text-destructive">Course not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={course.name} leftAction={leftAction}>
      {/* Course Info Card */}
      <Card className="mb-8 border-accent/20">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">{course.name}</CardTitle>
          <p className="text-lg text-muted-foreground font-medium">{course.code}</p>
        </CardHeader>
        
        <CardContent>
          {course.description && (
            <p className="text-muted-foreground mb-4">{course.description}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.theoryProfessors && course.theoryProfessors.length > 0 && (
              <div className="flex items-start space-x-2">
                <User className="w-4 h-4 mt-1 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Theory Professors</p>
                  <ul className="text-sm text-muted-foreground">
                    {course.theoryProfessors.map((prof, index) => (
                      <li key={index}>{prof}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {course.practicalProfessors && course.practicalProfessors.length > 0 && (
              <div className="flex items-start space-x-2">
                <Users className="w-4 h-4 mt-1 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Practical Professors</p>
                  <ul className="text-sm text-muted-foreground">
                    {course.practicalProfessors.map((prof, index) => (
                      <li key={index}>{prof}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lectures and Sections Tabs */}
      <Tabs defaultValue="lectures" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lectures" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Lectures</span>
          </TabsTrigger>
          {course.hasPracticals && (
            <TabsTrigger value="sections" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Sections</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="lectures" className="mt-6">
          <div className="space-y-4">
            {lectures.length > 0 ? (
              lectures.map((lecture) => (
                <Card 
                  key={lecture.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-accent"
                  onClick={() => handleLectureClick(lecture.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-2">{lecture.title}</h3>
                    {lecture.description && (
                      <p className="text-sm text-muted-foreground">{lecture.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No lectures available</p>
            )}
          </div>
        </TabsContent>
        
        {course.hasPracticals && (
          <TabsContent value="sections" className="mt-6">
            <div className="space-y-4">
              {sections.length > 0 ? (
                sections.map((section) => (
                  <Card 
                    key={section.id}
                    className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary"
                    onClick={() => handleSectionClick(section.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
                      {section.description && (
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No sections available</p>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </Layout>
  );
};

export default CoursePage;