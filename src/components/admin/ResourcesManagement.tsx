import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, FileText, Volume2, Video } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { isYouTubeLink } from '@/utils/linkConverter';

interface Course {
  id: string;
  name: string;
  code: string;
  hasPracticals: boolean;
}

interface LectureOrSection {
  id: string;
  title: string;
}

interface Resource {
  id: string;
  title: string;
  type: 'file' | 'audio' | 'video';
  originalUrl: string;
  parentId: string;
  parentType: 'lecture' | 'section';
}

const ResourcesManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedParentType, setSelectedParentType] = useState<'lecture' | 'section'>('lecture');
  const [parentItems, setParentItems] = useState<LectureOrSection[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'file' as 'file' | 'audio' | 'video',
    originalUrl: '',
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
    if (!selectedCourseId || !selectedParentType) return;

    const itemsPath = selectedParentType === 'lecture' ? 'lectures' : 'sections';
    const itemsRef = ref(database, `${itemsPath}/${selectedCourseId}`);

    const unsubscribe = onValue(itemsRef, (snapshot) => {
      if (snapshot.exists()) {
        const itemsData = snapshot.val();
        const itemsArray = Object.keys(itemsData).map(key => ({
          id: key,
          ...itemsData[key]
        }));
        setParentItems(itemsArray);
      } else {
        setParentItems([]);
      }
    });

    return () => unsubscribe();
  }, [selectedCourseId, selectedParentType]);

  useEffect(() => {
    if (!selectedParentId) return;

    const resourcesRef = ref(database, `resources/${selectedParentId}`);
    const unsubscribe = onValue(resourcesRef, (snapshot) => {
      if (snapshot.exists()) {
        const resourcesData = snapshot.val();
        const resourcesArray = Object.keys(resourcesData).map(key => ({
          id: key,
          ...resourcesData[key],
          parentId: selectedParentId,
          parentType: selectedParentType
        }));
        setResources(resourcesArray);
      } else {
        setResources([]);
      }
    });

    return () => unsubscribe();
  }, [selectedParentId, selectedParentType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParentId) {
      toast({
        title: "Error",
        description: "Please select a lecture or section first",
        variant: "destructive",
      });
      return;
    }

    try {
      const resourceData = {
        ...formData,
        parentType: selectedParentType,
      };

      if (editingResource) {
        // Update existing resource
        const resourceRef = ref(database, `resources/${selectedParentId}/${editingResource.id}`);
        await set(resourceRef, resourceData);
        toast({
          title: "Success",
          description: "Resource updated successfully",
        });
      } else {
        // Add new resource
        const resourcesRef = ref(database, `resources/${selectedParentId}`);
        await push(resourcesRef, resourceData);
        toast({
          title: "Success",
          description: "Resource added successfully",
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save resource",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      type: resource.type,
      originalUrl: resource.originalUrl,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        const resourceRef = ref(database, `resources/${selectedParentId}/${resourceId}`);
        await remove(resourceRef);
        toast({
          title: "Success",
          description: "Resource deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete resource",
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResource(null);
    setFormData({
      title: '',
      type: 'file',
      originalUrl: '',
    });
  };

  const getResourceIcon = (type: 'file' | 'audio' | 'video') => {
    switch (type) {
      case 'file': return FileText;
      case 'audio': return Volume2;
      case 'video': return Video;
    }
  };

  const selectedCourse = courses.find(c => c.id === selectedCourseId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources Management</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
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

          {selectedCourseId && (
            <div>
              <Label htmlFor="type-select">Select Type</Label>
              <Select value={selectedParentType} onValueChange={(value: 'lecture' | 'section') => setSelectedParentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture</SelectItem>
                  {selectedCourse?.hasPracticals && (
                    <SelectItem value="section">Section</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCourseId && selectedParentType && (
            <div>
              <Label htmlFor="parent-select">Select {selectedParentType === 'lecture' ? 'Lecture' : 'Section'}</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger>
                  <SelectValue placeholder={`Choose a ${selectedParentType}`} />
                </SelectTrigger>
                <SelectContent>
                  {parentItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {selectedParentId ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Resources</h3>
              <Button onClick={() => setIsDialogOpen(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Resource</span>
              </Button>
            </div>
            
            {resources.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => {
                    const Icon = getResourceIcon(resource.type);
                    return (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4" />
                            <span className="capitalize">{resource.type}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell>
                          <a 
                            href={resource.originalUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-accent hover:underline truncate block max-w-[200px]"
                          >
                            {resource.originalUrl}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(resource)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(resource.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No resources available. Add your first resource!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Please select a course, type, and {selectedParentType || 'lecture/section'} to manage resources.</p>
          </div>
        )}
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingResource ? 'Edit Resource' : 'Add New Resource'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Resource Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="type">Resource Type</Label>
                <Select value={formData.type} onValueChange={(value: 'file' | 'audio' | 'video') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="audio">Audio</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="url">Resource URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.originalUrl}
                  onChange={(e) => setFormData({ ...formData, originalUrl: e.target.value })}
                  placeholder="Google Drive or YouTube link"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: Google Drive links, YouTube links
                </p>
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingResource ? 'Update' : 'Add'} Resource
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

export default ResourcesManagement;