import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  hasPracticals: boolean;
  lectureCount?: number;
  sectionCount?: number;
}

const SubjectsManagement = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    hasPracticals: false
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCourse) {
        // Update existing course
        const courseRef = ref(database, `courses/${editingCourse.id}`);
        await set(courseRef, formData);
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
      } else {
        // Add new course
        const coursesRef = ref(database, 'courses');
        await push(coursesRef, formData);
        toast({
          title: "Success",
          description: "Course added successfully",
        });
      }
      
      handleCloseDialog();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description || '',
      hasPracticals: course.hasPracticals
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const courseRef = ref(database, `courses/${courseId}`);
        await remove(courseRef);
        
        // Also remove related lectures and sections
        const lecturesRef = ref(database, `lectures/${courseId}`);
        const sectionsRef = ref(database, `sections/${courseId}`);
        await remove(lecturesRef);
        await remove(sectionsRef);
        
        toast({
          title: "Success",
          description: "Course deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      hasPracticals: false
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subjects Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Add Course</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Course Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="code">Course Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="hasPracticals"
                    checked={formData.hasPracticals}
                    onCheckedChange={(checked) => setFormData({ ...formData, hasPracticals: checked })}
                  />
                  <Label htmlFor="hasPracticals">Has Practical Sections</Label>
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingCourse ? 'Update' : 'Add'} Course
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Lectures</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Has Practicals</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.name}</TableCell>
                <TableCell>{course.code}</TableCell>
                <TableCell>{course.lectureCount || 0}</TableCell>
                <TableCell>{course.sectionCount || 0}</TableCell>
                <TableCell>{course.hasPracticals ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(course)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(course.id)}
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
        
        {courses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No courses available. Add your first course!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectsManagement;