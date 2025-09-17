import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Volume2, Video } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';

interface LectureOrSection {
  id: string;
  title: string;
  description?: string;
  courseName: string;
  courseCode: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'file' | 'audio' | 'video';
  originalUrl: string;
}

const LecturePage = () => {
  const { lectureId, sectionId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<LectureOrSection | null>(null);
  const [resources, setResources] = useState<{
    files: Resource[];
    audios: Resource[];
    videos: Resource[];
  }>({
    files: [],
    audios: [],
    videos: []
  });
  const [loading, setLoading] = useState(true);

  const isSection = !!sectionId;
  const itemId = lectureId || sectionId;

  useEffect(() => {
    if (!itemId) return;

    // First, find the item across all courses since we only have the item ID
    const lecturesRef = ref(database, 'lectures');
    const sectionsRef = ref(database, 'sections');

    const findItemInCourses = (coursesData: any, searchId: string) => {
      for (const courseId of Object.keys(coursesData)) {
        const courseItems = coursesData[courseId];
        if (courseItems && courseItems[searchId]) {
          return {
            item: { id: searchId, ...courseItems[searchId] },
            courseId
          };
        }
      }
      return null;
    };

    if (isSection) {
      // Search in sections
      const unsubscribeSections = onValue(sectionsRef, (snapshot) => {
        if (snapshot.exists()) {
          const result = findItemInCourses(snapshot.val(), itemId);
          if (result) {
            setItem(result.item);
            // Load resources for this section
            loadResources(itemId);
          }
        }
        setLoading(false);
      });

      return () => unsubscribeSections();
    } else {
      // Search in lectures
      const unsubscribeLectures = onValue(lecturesRef, (snapshot) => {
        if (snapshot.exists()) {
          const result = findItemInCourses(snapshot.val(), itemId);
          if (result) {
            setItem(result.item);
            // Load resources for this lecture
            loadResources(itemId);
          }
        }
        setLoading(false);
      });

      return () => unsubscribeLectures();
    }
  }, [itemId, isSection]);

  const loadResources = (id: string) => {
    const resourcesRef = ref(database, `resources/${id}`);
    
    onValue(resourcesRef, (snapshot) => {
      if (snapshot.exists()) {
        const resourcesData = snapshot.val();
        const resourcesArray = Object.keys(resourcesData).map(key => ({
          id: key,
          ...resourcesData[key]
        }));

        setResources({
          files: resourcesArray.filter(r => r.type === 'file'),
          audios: resourcesArray.filter(r => r.type === 'audio'),
          videos: resourcesArray.filter(r => r.type === 'video')
        });
      } else {
        setResources({ files: [], audios: [], videos: [] });
      }
    });
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleResourceClick = (resourceId: string) => {
    navigate(`/data/${resourceId}`);
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
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </Layout>
    );
  }

  if (!item) {
    return (
      <Layout title="Content Not Found" leftAction={leftAction}>
        <div className="text-center py-12">
          <p className="text-destructive">Content not found</p>
        </div>
      </Layout>
    );
  }

  const getIcon = (type: 'file' | 'audio' | 'video') => {
    switch (type) {
      case 'file': return FileText;
      case 'audio': return Volume2;
      case 'video': return Video;
    }
  };

  const renderResourceList = (resourceList: Resource[], type: 'file' | 'audio' | 'video') => {
    const Icon = getIcon(type);
    
    return (
      <div className="space-y-3">
        {resourceList.length > 0 ? (
          resourceList.map((resource) => (
            <Card 
              key={resource.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleResourceClick(resource.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">{resource.title}</span>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-center text-muted-foreground py-8">
            No {type}s available
          </p>
        )}
      </div>
    );
  };

  return (
    <Layout title={item.title} leftAction={leftAction}>
      {/* Info Card */}
      <Card className="mb-8 border-accent/20">
        <CardHeader>
          <CardTitle className="text-2xl text-foreground">{item.title}</CardTitle>
          <p className="text-lg text-muted-foreground font-medium">
            {item.courseName} ({item.courseCode})
          </p>
        </CardHeader>
        
        {item.description && (
          <CardContent>
            <p className="text-muted-foreground">{item.description}</p>
          </CardContent>
        )}
      </Card>

      {/* Resources Tabs */}
      <Tabs defaultValue="files" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="files" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Files</span>
          </TabsTrigger>
          <TabsTrigger value="audios" className="flex items-center space-x-2">
            <Volume2 className="w-4 h-4" />
            <span>Audios</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex items-center space-x-2">
            <Video className="w-4 h-4" />
            <span>Videos</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="files" className="mt-6">
          {renderResourceList(resources.files, 'file')}
        </TabsContent>
        
        <TabsContent value="audios" className="mt-6">
          {renderResourceList(resources.audios, 'audio')}
        </TabsContent>
        
        <TabsContent value="videos" className="mt-6">
          {renderResourceList(resources.videos, 'video')}
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default LecturePage;