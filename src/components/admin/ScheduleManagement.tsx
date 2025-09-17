import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, Plus, Edit2, Trash2 } from 'lucide-react';
import { database } from '@/lib/firebase';
import { ref, push, set, remove, onValue } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';

interface ScheduleItem {
  id: string;
  name: string;
  code: string;
  type: 'lecture' | 'section';
  time: string;
}

interface DaySchedule {
  [key: string]: ScheduleItem;
}

interface WeekSchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const ScheduleManagement = () => {
  const [schedule, setSchedule] = useState<WeekSchedule>({
    monday: {},
    tuesday: {},
    wednesday: {},
    thursday: {},
    friday: {},
    saturday: {},
    sunday: {}
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [newItem, setNewItem] = useState({
    name: '',
    code: '',
    type: 'lecture' as 'lecture' | 'section',
    time: ''
  });
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const { toast } = useToast();

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  useEffect(() => {
    // Load courses
    const coursesRef = ref(database, 'courses');
    const unsubscribeCourses = onValue(coursesRef, (snapshot) => {
      if (snapshot.exists()) {
        const coursesData = snapshot.val();
        const coursesArray = Object.keys(coursesData).map(key => ({
          id: key,
          ...coursesData[key]
        }));
        setCourses(coursesArray);
      }
    });

    // Load schedules
    const schedulesRef = ref(database, 'schedules');
    const unsubscribeSchedules = onValue(schedulesRef, (snapshot) => {
      if (snapshot.exists()) {
        setSchedule(snapshot.val());
      }
    });

    return () => {
      unsubscribeCourses();
      unsubscribeSchedules();
    };
  }, []);

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.code || !newItem.time) {
      toast({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const dayScheduleRef = ref(database, `schedules/${selectedDay}`);
      const newItemRef = push(dayScheduleRef);
      
      await set(newItemRef, {
        name: newItem.name,
        code: newItem.code,
        type: newItem.type,
        time: newItem.time
      });

      setNewItem({
        name: '',
        code: '',
        type: 'lecture',
        time: ''
      });

      toast({
        title: "Success",
        description: "Schedule item added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add schedule item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const itemRef = ref(database, `schedules/${selectedDay}/${itemId}`);
      await remove(itemRef);

      toast({
        title: "Success",
        description: "Schedule item deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete schedule item",
        variant: "destructive",
      });
    }
  };

  const handleCourseSelect = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (course) {
      setNewItem({
        ...newItem,
        name: course.name,
        code: course.code
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Weekly Schedule Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              Manage the weekly schedule that appears on the home page. Add courses for each day of the week.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {days.map((day) => (
            <TabsTrigger key={day.key} value={day.key} className="text-xs">
              {day.label.slice(0, 3)}
            </TabsTrigger>
          ))}
        </TabsList>

        {days.map((day) => (
          <TabsContent key={day.key} value={day.key} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{day.label} Schedule</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Item Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border border-border rounded-lg bg-muted/50">
                  <div>
                    <Label htmlFor="course-select">Select Course</Label>
                    <Select onValueChange={handleCourseSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select course" />
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

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newItem.type} onValueChange={(value: 'lecture' | 'section') => setNewItem({...newItem, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture</SelectItem>
                        <SelectItem value="section">Section</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({...newItem, time: e.target.value})}
                      placeholder="e.g., 9:00 AM"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-1 flex items-end">
                    <Button onClick={handleAddItem} className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {/* Schedule Items List */}
                <div className="space-y-2">
                  {Object.keys(schedule[day.key] || {}).length > 0 ? (
                    Object.entries(schedule[day.key] || {}).map(([itemId, item]) => {
                      const scheduleItem = item as ScheduleItem;
                      return (
                        <div key={itemId} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Clock className="w-4 h-4 text-accent" />
                            <div>
                              <p className="font-medium text-foreground">{scheduleItem.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {scheduleItem.code} • {scheduleItem.type === 'lecture' ? 'Lecture' : 'Section'} • {scheduleItem.time}
                              </p>
                            </div>
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(itemId)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No classes scheduled for {day.label}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default ScheduleManagement;