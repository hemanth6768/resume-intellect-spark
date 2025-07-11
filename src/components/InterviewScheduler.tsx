import React, { useState } from 'react';
import { Calendar, Clock, Plus, Users, Check, X, Mail, MapPin, ChevronDown, ChevronUp, UserCheck, Download, CalendarIcon, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TimeSlot {
  start: string;
  end: string;
}

interface PanelistAvailability {
  id: string;
  name: string;
  email: string;
  skills: string[];
  weeklyAvailability: {
    [key: string]: TimeSlot[];
  };
  unavailableDates: string[];
}

interface ScheduledInterview {
  id: string;
  candidateName: string;
  candidateSkills: string[];
  panelistId: string;
  panelistName: string;
  panelistEmail: string;
  date: string;
  time: string;
  meetingLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface ShortlistedResume {
  id: string;
  resume_filename: string;
  candidate_name: string;
  experience: number;
  matched_skills: string[];
  missing_skills: string[];
  tech_stack: string[];
  reason: string;
  shortlisted: boolean;
  worked_on: string[];
  timestamp: string;
  assigned_panelist?: string;
}

interface Panelist {
  id: number;
  name: string;
  email: string;
  skills: string[];
  availability: {
    [key: string]: TimeSlot[];
  };
  created_at: string;
}

interface InterviewSession {
  session_id: number;
  resume_id: number;
  resume_file: string;
  candidate_name: string;
  panelist_id: number;
  panelist_name: string;
  panelist_email: string;
  session_date: string;
  session_start: string;
  session_end: string;
  status: string;
  created_at: string;
}

interface DayAvailability {
  day: string;
  selected: boolean;
  timeSlots: TimeSlot[];
}

interface PanelistWithAvailability extends Panelist {
  availableSlots?: { start_time: string; end_time: string }[];
}

const InterviewScheduler = () => {
  const [panelists, setPanelists] = useState<PanelistAvailability[]>([]);
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);
  const [isAddingPanelist, setIsAddingPanelist] = useState(false);
  const [availablePanelists, setAvailablePanelists] = useState<Panelist[]>([]);
  const [shortlistedResumes, setShortlistedResumes] = useState<ShortlistedResume[]>([]);
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [loadingPanelists, setLoadingPanelists] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [addingPanelist, setAddingPanelist] = useState(false);
  const [assigningPanelist, setAssigningPanelist] = useState<Record<string, boolean>>({});
  const [selectedDates, setSelectedDates] = useState<Record<string, Date>>({});
  const [availablePanelistsForDate, setAvailablePanelistsForDate] = useState<Record<string, PanelistWithAvailability[]>>({});
  const [checkingAvailability, setCheckingAvailability] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const [newPanelist, setNewPanelist] = useState({
    name: '',
    email: '',
    skills: [] as string[],
    skillInput: ''
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    dayAvailabilities: [
      { day: 'Mon', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Tue', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Wed', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Thu', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Fri', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Sat', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
      { day: 'Sun', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] }
    ] as DayAvailability[]
  });

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayShorts = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Helper function to get available days from API response
  const getAvailableDaysDisplay = (availability: { [key: string]: TimeSlot[] }) => {
    if (!availability || typeof availability !== 'object') {
      return 'No availability set';
    }
    
    const availableDays = Object.keys(availability).filter(day => 
      availability[day] && Array.isArray(availability[day]) && availability[day].length > 0
    );
    
    if (availableDays.length === 0) {
      return 'No availability set';
    }
    
    return availableDays.join(', ');
  };

  // Helper function to get time range from availability
  const getTimeRangesDisplay = (availability: { [key: string]: TimeSlot[] }) => {
    if (!availability || typeof availability !== 'object') {
      return '';
    }
    
    const timeRanges: string[] = [];
    Object.keys(availability).forEach(day => {
      if (availability[day] && Array.isArray(availability[day]) && availability[day].length > 0) {
        availability[day].forEach(slot => {
          timeRanges.push(`${day}: ${slot.start}-${slot.end}`);
        });
      }
    });
    
    return timeRanges.length > 0 ? timeRanges.join(', ') : 'No time slots';
  };

  const addSkillToPanelist = () => {
    if (newPanelist.skillInput.trim() && !newPanelist.skills.includes(newPanelist.skillInput.trim())) {
      setNewPanelist(prev => ({
        ...prev,
        skills: [...prev.skills, prev.skillInput.trim()],
        skillInput: ''
      }));
    }
  };

  const removeSkillFromPanelist = (skill: string) => {
    setNewPanelist(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const toggleDayAvailability = (dayIndex: number) => {
    setAvailabilityForm(prev => ({
      dayAvailabilities: prev.dayAvailabilities.map((day, index) => 
        index === dayIndex ? { ...day, selected: !day.selected } : day
      )
    }));
  };

  const addTimeSlot = (dayIndex: number) => {
    setAvailabilityForm(prev => ({
      dayAvailabilities: prev.dayAvailabilities.map((day, index) => 
        index === dayIndex 
          ? { ...day, timeSlots: [...day.timeSlots, { start: '09:00', end: '17:00' }] }
          : day
      )
    }));
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    setAvailabilityForm(prev => ({
      dayAvailabilities: prev.dayAvailabilities.map((day, index) => 
        index === dayIndex 
          ? { ...day, timeSlots: day.timeSlots.filter((_, sIndex) => sIndex !== slotIndex) }
          : day
      )
    }));
  };

  const updateTimeSlot = (dayIndex: number, slotIndex: number, field: 'start' | 'end', value: string) => {
    setAvailabilityForm(prev => ({
      dayAvailabilities: prev.dayAvailabilities.map((day, index) => 
        index === dayIndex 
          ? {
              ...day,
              timeSlots: day.timeSlots.map((slot, sIndex) =>
                sIndex === slotIndex ? { ...slot, [field]: value } : slot
              )
            }
          : day
      )
    }));
  };

  const addPanelist = async () => {
    // Validate required fields
    if (!newPanelist.name.trim() || !newPanelist.email.trim() || newPanelist.skills.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Email, and at least one skill)",
        variant: "destructive"
      });
      return;
    }

    const selectedDays = availabilityForm.dayAvailabilities.filter(day => day.selected);
    if (selectedDays.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select at least one day of availability",
        variant: "destructive"
      });
      return;
    }

    // Validate time slots
    for (const day of selectedDays) {
      if (day.timeSlots.length === 0) {
        toast({
          title: "Validation Error",
          description: `Please add at least one time slot for ${day.day}`,
          variant: "destructive"
        });
        return;
      }
      
      for (const slot of day.timeSlots) {
        if (!slot.start || !slot.end || slot.start >= slot.end) {
          toast({
            title: "Validation Error",
            description: `Invalid time slot for ${day.day}. Start time must be before end time.`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    setAddingPanelist(true);

    try {
      // Build availability object in the new API format
      const availability: Record<string, TimeSlot[]> = {};
      
      // Initialize all days with empty arrays
      dayShorts.forEach(day => {
        availability[day] = [];
      });
      
      // Add time slots for selected days
      selectedDays.forEach(day => {
        availability[day.day] = day.timeSlots.map(slot => ({
          start: slot.start,
          end: slot.end
        }));
      });

      const panelistData = {
        name: newPanelist.name.trim(),
        email: newPanelist.email.trim(),
        skills: newPanelist.skills,
        availability: availability
      };

      console.log('Sending panelist data to API:', panelistData);

      const response = await fetch('http://localhost:5000/add-panelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(panelistData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Panelist added successfully:', result);
        
        toast({
          title: "Success!",
          description: `Panelist ${newPanelist.name} has been added successfully.`,
        });

        // Reset form
        setNewPanelist({
          name: '',
          email: '',
          skills: [],
          skillInput: ''
        });
        setAvailabilityForm({
          dayAvailabilities: [
            { day: 'Mon', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
            { day: 'Tue', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
            { day: 'Wed', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
            { day: 'Thu', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
            { day: 'Fri', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
            { day: 'Sat', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] },
            { day: 'Sun', selected: false, timeSlots: [{ start: '09:00', end: '17:00' }] }
          ]
        });
        setIsAddingPanelist(false);

        // Refresh the panelists list
        fetchPanelists();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to add panelist:', response.status, errorData);
        
        toast({
          title: "Error",
          description: errorData.message || `Failed to add panelist. Server responded with status ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error adding panelist:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setAddingPanelist(false);
    }
  };

  const fetchPanelists = async () => {
    setLoadingPanelists(true);
    try {
      const response = await fetch('http://localhost:5000/panelists');
      if (response.ok) {
        const data = await response.json();
        setAvailablePanelists(data);
        console.log('Available panelists:', data);
        toast({
          title: "Success!",
          description: `Found ${data.length} available panelists!`,
        });
      } else {
        console.error('Failed to fetch panelists:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch panelists. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching panelists:', error);
      toast({
        title: "Network Error",
        description: "Error fetching panelists. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingPanelists(false);
    }
  };

  const fetchShortlistedResumes = async () => {
    setLoadingResumes(true);
    try {
      const response = await fetch('http://localhost:5000/shortlist-resume/list');
      if (response.ok) {
        const data = await response.json();
        setShortlistedResumes(data);
        console.log('Shortlisted resumes:', data);
        toast({
          title: "Success!",
          description: `Found ${data.length} shortlisted resumes!`,
        });
      } else {
        console.error('Failed to fetch shortlisted resumes:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch shortlisted resumes. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching shortlisted resumes:', error);
      toast({
        title: "Network Error",
        description: "Error fetching shortlisted resumes. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchInterviewSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await fetch('http://localhost:5000/interview-sessions');
      if (response.ok) {
        const data = await response.json();
        setInterviewSessions(data);
        console.log('Interview sessions:', data);
        toast({
          title: "Success!",
          description: `Found ${data.length} interview sessions!`,
        });
      } else {
        console.error('Failed to fetch interview sessions:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch interview sessions. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching interview sessions:', error);
      toast({
        title: "Network Error",
        description: "Error fetching interview sessions. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const checkAvailabilityForDate = async (resumeId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setCheckingAvailability(prev => ({ ...prev, [resumeId]: true }));

    try {
      const availablePanelistsForSelectedDate: PanelistWithAvailability[] = [];

      for (const panelist of availablePanelists) {
        // Get the day of the week from the date
        const dayOfWeek = format(date, 'EEE'); // Get short day name (Mon, Tue, etc.)
        
        // Check if panelist has availability for this day
        if (panelist.availability[dayOfWeek] && panelist.availability[dayOfWeek].length > 0) {
          // Check availability for each time slot
          const availableSlots = [];
          
          for (const slot of panelist.availability[dayOfWeek]) {
            try {
              const response = await fetch(
                `http://localhost:5000/check-availability?panelist_id=${panelist.id}&date=${dateStr}&start_time=${slot.start}&end_time=${slot.end}`
              );
              if (response.ok) {
                const data = await response.json();
                console.log(`Availability check for panelist ${panelist.id}, slot ${slot.start}-${slot.end}:`, data);
                if (data.available) {
                  availableSlots.push({
                    start_time: slot.start,
                    end_time: slot.end
                  });
                }
              }
            } catch (error) {
              console.error(`Error checking availability for panelist ${panelist.id}, slot ${slot.start}-${slot.end}:`, error);
            }
          }
          
          if (availableSlots.length > 0) {
            availablePanelistsForSelectedDate.push({
              ...panelist,
              availableSlots: availableSlots
            });
          }
        }
      }

      setAvailablePanelistsForDate(prev => ({
        ...prev,
        [resumeId]: availablePanelistsForSelectedDate
      }));

      toast({
        title: "Availability Check Complete",
        description: `Found ${availablePanelistsForSelectedDate.length} available panelists for ${format(date, 'PPP')}`,
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      toast({
        title: "Error",
        description: "Failed to check panelist availability.",
        variant: "destructive"
      });
    } finally {
      setCheckingAvailability(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const assignPanelistToResume = async (resumeId: string, panelistId: string, timeSlot?: { start_time: string; end_time: string }) => {
    if (!panelistId || !selectedDates[resumeId]) return;

    setAssigningPanelist(prev => ({ ...prev, [resumeId]: true }));

    try {
      const sessionDate = format(selectedDates[resumeId], 'yyyy-MM-dd');
      
      const requestBody = {
        resume_id: Number(resumeId),
        panelist_id: Number(panelistId),
        session_date: sessionDate,
        session_start: timeSlot?.start_time || "10:00",
        session_end: timeSlot?.end_time || "11:00"
      };

      console.log('Assigning panelist with data:', requestBody);

      const response = await fetch('http://localhost:5000/assign-panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Panelist assigned successfully:', result);
        
        // Update local state
        setShortlistedResumes(prev => prev.map(resume => 
          resume.id === resumeId 
            ? { ...resume, assigned_panelist: panelistId }
            : resume
        ));

        const assignedPanelist = availablePanelists.find(p => p.id.toString() === panelistId);
        toast({
          title: "Success!",
          description: `Interview scheduled with ${assignedPanelist?.name} on ${sessionDate} from ${requestBody.session_start} to ${requestBody.session_end}`,
        });

        // Clear the date selection and available panelists for this resume
        setSelectedDates(prev => {
          const updated = { ...prev };
          delete updated[resumeId];
          return updated;
        });
        setAvailablePanelistsForDate(prev => {
          const updated = { ...prev };
          delete updated[resumeId];
          return updated;
        });

        // Refresh interview sessions
        fetchInterviewSessions();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to assign panelist:', response.status, errorData);
        
        // Handle specific error for already assigned resume
        if (errorData.error === "This resume is already assigned to a panelist.") {
          toast({
            title: "Already Assigned",
            description: "This resume is already assigned to a panelist.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: errorData.message || errorData.error || "Failed to assign panelist and schedule interview.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error assigning panelist:', error);
      toast({
        title: "Network Error",
        description: "Failed to assign panelist. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAssigningPanelist(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const mockScheduleInterview = (candidateName: string, requiredSkills: string[]) => {
    // Find available panelists with matching skills
    const matchingPanelists = panelists.filter(panelist => 
      panelist.skills.some(skill => requiredSkills.includes(skill))
    );

    if (matchingPanelists.length === 0) {
      toast({
        title: "No Match",
        description: "No panelists available with the required skills",
        variant: "destructive"
      });
      return;
    }

    // For demo purposes, schedule with the first matching panelist
    const selectedPanelist = matchingPanelists[0];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const interview: ScheduledInterview = {
      id: `interview-${Date.now()}`,
      candidateName,
      candidateSkills: requiredSkills,
      panelistId: selectedPanelist.id,
      panelistName: selectedPanelist.name,
      panelistEmail: selectedPanelist.email,
      date: nextWeek.toISOString().split('T')[0],
      time: '14:00',
      meetingLink: `https://meet.google.com/demo-${Date.now()}`,
      status: 'scheduled'
    };

    setScheduledInterviews(prev => [...prev, interview]);
    toast({
      title: "Success!",
      description: `Interview scheduled with ${selectedPanelist.name} for ${candidateName}`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
            📅 Interview Panel Scheduler
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Manage panel availability and auto-schedule interviews with shortlisted candidates
          </p>
        </div>

        {/* Data Management Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Data Management</h2>
            <div className="flex gap-2">
              <Button
                onClick={fetchPanelists}
                disabled={loadingPanelists}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <UserCheck className="w-4 h-4" />
                {loadingPanelists ? 'Loading...' : 'Check Panelists'}
              </Button>
              <Button
                onClick={fetchShortlistedResumes}
                disabled={loadingResumes}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                {loadingResumes ? 'Loading...' : 'Get Shortlisted Resumes'}
              </Button>
              <Button
                onClick={fetchInterviewSessions}
                disabled={loadingSessions}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
              >
                <Calendar className="w-4 h-4" />
                {loadingSessions ? 'Loading...' : 'Get Interview Sessions'}
              </Button>
            </div>

          </div>

          {/* Available Panelists Display */}
          {availablePanelists.length > 0 && (
            <Card className="mb-4 border-blue-200 shadow-md">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-800">Available Panelists ({availablePanelists.length})</CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availablePanelists.map((panelist) => (
                    <div key={panelist.id} className="border rounded-lg p-3 bg-white">
                      <h3 className="font-semibold text-gray-800">{panelist.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {panelist.email}
                      </p>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {(panelist.skills || []).map((skill) => (
                            <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Available Days:</p>
                        <p className="text-xs text-gray-600 mb-1">
                          {getAvailableDaysDisplay(panelist.availability)}
                        </p>
                        <p className="text-sm font-medium text-gray-700 mb-1">Time Slots:</p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {Object.keys(panelist.availability).map(day => {
                            if (panelist.availability[day] && panelist.availability[day].length > 0) {
                              return (
                                <div key={day} className="flex flex-wrap gap-1">
                                  <span className="font-medium">{day}:</span>
                                  {panelist.availability[day].map((slot, index) => (
                                    <span key={index} className="bg-blue-100 text-blue-800 px-1 py-0.5 rounded text-xs">
                                      {slot.start}-{slot.end}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shortlisted Resumes Display */}
          {shortlistedResumes.length > 0 && (
            <Card className="mb-4 border-green-200 shadow-md">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">Shortlisted Resumes ({shortlistedResumes.length})</CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="space-y-4">
                  {shortlistedResumes.map((resume) => (
                    <div key={resume.id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{resume.candidate_name}</h3>
                          <p className="text-sm text-gray-600">{resume.experience} years experience</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Shortlisted
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Matched Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {(resume.matched_skills || []).map((skill) => (
                              <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Tech Stack:</p>
                          <div className="flex flex-wrap gap-1">
                            {(resume.tech_stack || []).slice(0, 3).map((tech) => (
                              <span key={tech} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                            {resume.tech_stack && resume.tech_stack.length > 3 && (
                              <span className="text-xs text-gray-500">+{resume.tech_stack.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assignment Workflow */}
                      <div className="pt-3 border-t space-y-3">
                        {!resume.assigned_panelist && (
                          <>
                            {/* Step 1: Select Date */}
                            <div className="flex items-center gap-2">
                              <label className="text-sm font-medium text-gray-700">1. Select Interview Date:</label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-[240px] justify-start text-left font-normal",
                                      !selectedDates[resume.id] && "text-muted-foreground"
                                    )}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDates[resume.id] ? format(selectedDates[resume.id], "PPP") : <span>Pick a date</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={selectedDates[resume.id]}
                                    onSelect={(date) => {
                                      if (date) {
                                        setSelectedDates(prev => ({ ...prev, [resume.id]: date }));
                                      }
                                    }}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              {selectedDates[resume.id] && (
                                <Button
                                  onClick={() => checkAvailabilityForDate(resume.id, selectedDates[resume.id])}
                                  disabled={checkingAvailability[resume.id]}
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  {checkingAvailability[resume.id] ? 'Checking...' : 'Check Availability'}
                                </Button>
                              )}
                            </div>

                            {/* Step 2: Show Available Panelists */}
                            {availablePanelistsForDate[resume.id] && availablePanelistsForDate[resume.id].length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">2. Available Panelists:</p>
                                <div className="space-y-2">
                                  {availablePanelistsForDate[resume.id].map((panelist) => (
                                    <div key={panelist.id} className="border rounded p-3 bg-gray-50">
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm">{panelist.name}</p>
                                          <p className="text-xs text-gray-600">{panelist.email}</p>
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {(panelist.skills || []).slice(0, 3).map((skill) => (
                                              <span key={skill} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                                {skill}
                                              </span>
                                            ))}
                                          </div>
                                          {panelist.availableSlots && panelist.availableSlots.length > 0 && (
                                            <div className="mt-2">
                                              <p className="text-xs text-gray-600 mb-1">Available Time Slots:</p>
                                              <div className="flex flex-wrap gap-1">
                                                {panelist.availableSlots.map((slot, index) => (
                                                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                                    {slot.start_time} - {slot.end_time}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <div className="ml-4">
                                          <Button
                                            size="sm"
                                            onClick={() => assignPanelistToResume(resume.id, panelist.id.toString(), panelist.availableSlots?.[0])}
                                            disabled={assigningPanelist[resume.id]}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2"
                                          >
                                            {assigningPanelist[resume.id] ? 'Assigning...' : 'Assign'}
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {availablePanelistsForDate[resume.id] && availablePanelistsForDate[resume.id].length === 0 && (
                              <p className="text-sm text-orange-600">No panelists available for the selected date.</p>
                            )}
                          </>
                        )}
                        
                        {resume.assigned_panelist && (
                          <div className="text-sm text-green-600 font-medium">
                            ✅ Assigned to: {availablePanelists.find(p => p.id.toString() === resume.assigned_panelist)?.name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Interview Sessions Display */}
          {interviewSessions.length > 0 && (
            <Card className="mb-4 border-purple-200 shadow-md">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-800">Scheduled Interview Sessions ({interviewSessions.length})</CardTitle>
              </CardHeader>
              <CardContent className="mt-4">
                <div className="space-y-4">
                  {interviewSessions.map((session) => (
                    <div key={session.session_id} className="border rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">{session.candidate_name}</h3>
                          <p className="text-sm text-gray-600">with {session.panelist_name}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          session.status === 'Scheduled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">📅 {session.session_date}</p>
                          <p className="text-sm text-gray-600">🕒 {session.session_start} - {session.session_end}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">📧 {session.panelist_email}</p>
                          <p className="text-sm text-gray-600">📄 {session.resume_file}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel Management Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Interview Panel Management</h2>
            <Button
              onClick={() => setIsAddingPanelist(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Panelist
            </Button>
          </div>

          {/* Add Panelist Form */}
          {isAddingPanelist && (
            <Card className="mb-6 border-blue-200 shadow-md">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-800">Add New Panelist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name *</Label>
                    <Input
                      placeholder="Enter panelist name"
                      value={newPanelist.name}
                      onChange={(e) => setNewPanelist(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email *</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newPanelist.email}
                      onChange={(e) => setNewPanelist(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Skills/Expertise *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      placeholder="Enter a skill and press Enter..."
                      value={newPanelist.skillInput}
                      onChange={(e) => setNewPanelist(prev => ({ ...prev, skillInput: e.target.value }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkillToPanelist();
                        }
                      }}
                    />
                    <Button type="button" onClick={addSkillToPanelist} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPanelist.skills.map((skill) => (
                      <span
                        key={skill}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {skill}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-blue-600"
                          onClick={() => removeSkillFromPanelist(skill)}
                        />
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Weekly Availability *</Label>
                  <div className="space-y-3 mt-2">
                    {availabilityForm.dayAvailabilities.map((day, dayIndex) => (
                      <div key={day.day} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={day.selected}
                              onChange={() => toggleDayAvailability(dayIndex)}
                              className="rounded border-gray-300"
                            />
                            <span className="font-medium text-sm">{dayNames[dayIndex]} ({day.day})</span>
                          </div>
                          {day.selected && (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addTimeSlot(dayIndex)}
                              className="text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Time Slot
                            </Button>
                          )}
                        </div>
                        {day.selected && (
                          <div className="space-y-2 mt-2">
                            {day.timeSlots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="grid grid-cols-5 gap-2 items-center">
                                <div>
                                  <Label className="text-xs text-gray-600">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.start}
                                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">End Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.end}
                                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="col-span-2 text-xs text-gray-600 pt-6">
                                  {slot.start} - {slot.end}
                                </div>
                                <div className="pt-6">
                                  {day.timeSlots.length > 1 && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={addPanelist} 
                    disabled={addingPanelist}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {addingPanelist ? 'Adding...' : 'Add Panelist'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingPanelist(false)}
                    disabled={addingPanelist}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Panelists List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {panelists.map((panelist) => (
              <Card key={panelist.id} className="border-gray-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{panelist.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {panelist.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {panelist.skills.map((skill) => (
                          <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Availability:</p>
                      <div className="text-xs text-gray-600">
                        {Object.keys(panelist.weeklyAvailability).length > 0 ? (
                          Object.entries(panelist.weeklyAvailability).map(([day, slots]) => (
                            <div key={day} className="flex justify-between">
                              <span>{day}:</span>
                              <span>
                                {slots.map(slot => `${slot.start}-${slot.end}`).join(', ')}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500">No availability set</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Mock Scheduling Section */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Auto-Schedule Interview (Demo)</h2>
          <Card className="border-green-200 shadow-md">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">Schedule Interview for Shortlisted Candidate</CardTitle>
            </CardHeader>
            <CardContent className="mt-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => mockScheduleInterview('John Doe', ['Python', 'React'])}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={panelists.length === 0}
                >
                  Schedule for John Doe (Python, React)
                </Button>
                <Button
                  onClick={() => mockScheduleInterview('Jane Smith', ['C#', 'Azure'])}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={panelists.length === 0}
                >
                  Schedule for Jane Smith (C#, Azure)
                </Button>
              </div>
              {panelists.length === 0 && (
                <p className="text-sm text-gray-500 mt-2">Add panelists first to enable scheduling</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scheduled Interviews */}
        {scheduledInterviews.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Scheduled Interviews</h2>
            <div className="space-y-4">
              {scheduledInterviews.map((interview) => (
                <Card key={interview.id} className="border-orange-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-800">
                          {interview.candidateName} → {interview.panelistName}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {interview.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {interview.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {interview.panelistEmail}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Skills:</span>
                          {interview.candidateSkills.map((skill) => (
                            <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          interview.status === 'scheduled' ? 'bg-green-100 text-green-800' :
                          interview.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                        </span>
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Join Meeting
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewScheduler;
