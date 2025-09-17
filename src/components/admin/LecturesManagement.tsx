import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, BookOpen, Users } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';

interface Course {
  id: string;
  name: string;
  code: string;
  hasPracticals: boolean;
}

interface LectureOrSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  dateAdded: Date;
  courseId: string;
}

const LecturesManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [lectures, setLectures] = useState<LectureOrSection[]>([]);
  const [sections, setSections] = useState<LectureOrSection[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentType, setCurrentType] = useState<'lecture' | 'section'>('lecture');
  const [editingItem, setEditingItem] = useState<LectureOrSection | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    const coursesRef = ref(database, 'courses');
    const unsubscribe = onValue(coursesRef, (snapshot) => {
      if (snapshot.exists()) {
        const coursesData = snapshot.val();
        const coursesArray = Object.keys(coursesData).map(key => ({
          id: key,
          ...coursesData[key]
        }));
        setCourses(coursesArray);
      } else {
        setCourses([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;

    const lecturesRef = ref(database, `lectures/${selectedCourseId}`);
    const sectionsRef = ref(database, `sections/${selectedCourseId}`);

    const unsubscribeLectures = onValue(lecturesRef, (snapshot) => {
      if (snapshot.exists()) {
        const lecturesData = snapshot.val();
        const lecturesArray = Object.keys(lecturesData)
          .map(key => ({ id: key, ...lecturesData[key], courseId: selectedCourseId }))
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
          .map(key => ({ id: key, ...sectionsData[key], courseId: selectedCourseId }))
          .sort((a, b) => b.order - a.order);
        setSections(sectionsArray);
      } else {
        setSections([]);
      }
    });

    return () => {
      unsubscribeLectures();
      unsubscribeSections();
    };
  }, [selectedCourseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }

    try {
      const itemData = {
        ...formData,
        order: editingItem ? editingItem.order : Date.now(),
        dateAdded: editingItem ? editingItem.dateAdded : new Date().toISOString(),
      };

      const basePath = currentType === 'lecture' ? 'lectures' : 'sections';
      
      if (editingItem) {
        // Update existing item
        const itemRef = ref(database, `${basePath}/${selectedCourseId}/${editingItem.id}`);
        await set(itemRef, itemData);
        toast({
          title: "Success",
          description: `${currentType === 'lecture' ? 'Lecture' : 'Section'} updated successfully`,
        });
      } else {
        // Add new item
        const itemsRef = ref(database, `${basePath}/${selectedCourseId}`);
        await push(itemsRef, itemData);
        toast({
          title: "Success",
          description: `${currentType === 'lecture' ? 'Lecture' : 'Section'} added successfully`,
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save ${currentType}`,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: LectureOrSection, type: 'lecture' | 'section') => {
    setEditingItem(item);
    setCurrentType(type);
    setFormData({
      title: item.title,
      description: item.description || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (itemId: string, type: 'lecture' | 'section') => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const basePath = type === 'lecture' ? 'lectures' : 'sections';
        const itemRef = ref(database, `${basePath}/${selectedCourseId}/${itemId}`);
        await remove(itemRef);
        
        // Also remove related resources
        const resourcesRef = ref(database, `resources/${itemId}`);
        await remove(resourcesRef);
        
        toast({
          title: "Success",
          description: `${type === 'lecture' ? 'Lecture' : 'Section'} deleted successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete ${type}`,
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      title: '',
      description: '',
    });
  };

  const handleAddNew = (type: 'lecture' | 'section') => {
    if (!selectedCourseId) {
      toast({
        title: "Error",
        description: "Please select a course first",
        variant: "destructive",
      });
      return;
    }
    setCurrentType(type);
    setIsDialogOpen(true);
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  const renderTable = (items: LectureOrSection[], type: 'lecture' | 'section') => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Date Added</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.title}</TableCell>
            <TableCell>{item.description || '-'}</TableCell>
            <TableCell>{formatDate(new Date(item.dateAdded))}</TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(item, type)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(item.id, type)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lectures & Sections Management</CardTitle>
        <div className="w-full max-w-sm">
          <Label htmlFor="course-select">Select Course</Label>
          <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {selectedCourseId ? (
          <Tabs defaultValue="lectures" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lectures" className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Lectures</span>
              </TabsTrigger>
              {selectedCourse?.hasPracticals && (
                <TabsTrigger value="sections" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Sections</span>
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="lectures" className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Lectures</h3>
                <Button onClick={() => handleAddNew('lecture')} className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Add Lecture</span>
                </Button>
              </div>
              
              {lectures.length > 0 ? (
                renderTable(lectures, 'lecture')
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No lectures available for this course.</p>
                </div>
              )}
            </TabsContent>
            
            {selectedCourse?.hasPracticals && (
              <TabsContent value="sections" className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Sections</h3>
                  <Button onClick={() => handleAddNew('section')} className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Add Section</span>
                  </Button>
                </div>
                
                {sections.length > 0 ? (
                  renderTable(sections, 'section')
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No sections available for this course.</p>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please select a course to manage lectures and sections.</p>
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit' : 'Add New'} {currentType === 'lecture' ? 'Lecture' : 'Section'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingItem ? 'Update' : 'Add'} {currentType === 'lecture' ? 'Lecture' : 'Section'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default LecturesManagement;