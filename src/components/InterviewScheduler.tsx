import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Users, Check, X, Mail, MapPin, ChevronDown, ChevronUp, UserCheck, Download, CalendarIcon, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { API_ENDPOINTS } from '@/config/api';

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
  id: number;
  candidate_email: string;
  candidate_name: string;
  candidate_type: string;
  experience: number;
  shortlisted: boolean;
  shortlisted_position_name: string;
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

interface JobRequirement {
  id: number;
  position_name: string;
  description: string;
  skills: string[];
  tech_stack: string[];
  experience_required: number;
  created_at: string;
}

interface PanelistWithPosition {
  id: number;
  name: string;
  email: string;
  skills: string[];
  position_name: string;
  availability: {
    [key: string]: string[];
  };
  created_at: string;
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
  const [deletingPanelist, setDeletingPanelist] = useState<Record<number, boolean>>({});
  const [deletingResume, setDeletingResume] = useState<Record<string, boolean>>({});
  const [deletingSession, setDeletingSession] = useState<Record<number, boolean>>({});
  const [panelistSearch, setPanelistSearch] = useState('');
  const [resumeSearch, setResumeSearch] = useState('');
  const [availableJobRequirements, setAvailableJobRequirements] = useState<JobRequirement[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('All');
  const [loadingJobRequirements, setLoadingJobRequirements] = useState(false);
  const [displayedPanelists, setDisplayedPanelists] = useState<PanelistWithPosition[]>([]);
  const [activeDataType, setActiveDataType] = useState<'panelists' | 'resumes' | 'sessions' | null>(null);
  const { toast } = useToast();

  // Fetch job requirements when component mounts
  useEffect(() => {
    fetchJobRequirements();
  }, []);

  const fetchJobRequirements = async () => {
    setLoadingJobRequirements(true);
    try {
      const response = await fetch(API_ENDPOINTS.JOB_REQUIREMENTS);
      if (response.ok) {
        const data = await response.json();
        setAvailableJobRequirements(data);
        console.log('Job requirements fetched:', data);
      } else {
        console.error('Failed to fetch job requirements:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch job requirements. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching job requirements:', error);
      toast({
        title: "Network Error",
        description: "Error fetching job requirements. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingJobRequirements(false);
    }
  };

  const fetchPanelistsByPosition = async (positionName: string) => {
    setLoadingPanelists(true);
    try {
      let url = API_ENDPOINTS.PANELISTS;
      if (positionName !== 'All') {
        url += `?position_name=${encodeURIComponent(positionName)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDisplayedPanelists(data);
        console.log('Panelists fetched for position:', positionName, data);
        toast({
          title: "Success!",
          description: `Found ${data.length} panelists for ${positionName === 'All' ? 'all positions' : positionName}!`,
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

  // Handle position selection change
  const handlePositionChange = (value: string) => {
    setSelectedPosition(value);
    
    // Call appropriate function based on active data type
    if (activeDataType === 'panelists') {
      fetchPanelistsByPosition(value);
    } else if (activeDataType === 'resumes') {
      fetchShortlistedResumesByPosition(value);
    } else if (activeDataType === 'sessions') {
      fetchInterviewSessions();
    }
  };

  // Button click handlers
  const handleLoadPanelists = () => {
    setActiveDataType('panelists');
    fetchPanelistsByPosition(selectedPosition);
  };

  const handleLoadResumes = () => {
    setActiveDataType('resumes');
    fetchShortlistedResumesByPosition(selectedPosition);
  };

  const handleLoadSessions = () => {
    setActiveDataType('sessions');
    fetchInterviewSessions();
  };
  
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

  // Filter functions for search
  const filteredPanelists = displayedPanelists.filter(panelist =>
    panelist.name.toLowerCase().includes(panelistSearch.toLowerCase()) ||
    panelist.email.toLowerCase().includes(panelistSearch.toLowerCase()) ||
    panelist.skills.some(skill => skill.toLowerCase().includes(panelistSearch.toLowerCase())) ||
    panelist.position_name.toLowerCase().includes(panelistSearch.toLowerCase())
  );

  const filteredResumes = shortlistedResumes.filter(resume =>
    resume.candidate_name.toLowerCase().includes(resumeSearch.toLowerCase()) ||
    resume.candidate_email.toLowerCase().includes(resumeSearch.toLowerCase()) ||
    resume.candidate_type.toLowerCase().includes(resumeSearch.toLowerCase()) ||
    resume.shortlisted_position_name.toLowerCase().includes(resumeSearch.toLowerCase())
  );

  // Delete functions
  const deletePanelist = async (panelistId: number) => {
    setDeletingPanelist(prev => ({ ...prev, [panelistId]: true }));
    
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_PANELIST(panelistId), {
        method: 'DELETE',
      });

      if (response.ok) {
        setAvailablePanelists(prev => prev.filter(p => p.id !== panelistId));
        toast({
          title: "Success!",
          description: "Panelist deleted successfully.",
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete panelist.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting panelist:', error);
      toast({
        title: "Network Error",
        description: "Failed to delete panelist. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingPanelist(prev => ({ ...prev, [panelistId]: false }));
    }
  };

  const deleteResume = async (resumeId: string) => {
    setDeletingResume(prev => ({ ...prev, [resumeId]: true }));
    
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_RESUME(resumeId), {
        method: 'DELETE',
      });

      if (response.ok) {
        setShortlistedResumes(prev => prev.filter(r => r.id.toString() !== resumeId));
        toast({
          title: "Success!",
          description: "Resume deleted successfully.",
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete resume.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        title: "Network Error",
        description: "Failed to delete resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingResume(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  const deleteInterviewSession = async (sessionId: number) => {
    setDeletingSession(prev => ({ ...prev, [sessionId]: true }));
    
    try {
      const response = await fetch(API_ENDPOINTS.DELETE_SESSION(sessionId), {
        method: 'DELETE',
      });

      if (response.ok) {
        setInterviewSessions(prev => prev.filter(s => s.session_id !== sessionId));
        toast({
          title: "Success!",
          description: "Interview session deleted successfully.",
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.message || "Failed to delete interview session.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting interview session:', error);
      toast({
        title: "Network Error",
        description: "Failed to delete interview session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDeletingSession(prev => ({ ...prev, [sessionId]: false }));
    }
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

      const response = await fetch(API_ENDPOINTS.ADD_PANELIST, {
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
      const response = await fetch(API_ENDPOINTS.PANELISTS);
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
      const response = await fetch(API_ENDPOINTS.SHORTLISTED_RESUMES);
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

  const fetchShortlistedResumesByPosition = async (positionName: string) => {
    setLoadingResumes(true);
    try {
      let url = API_ENDPOINTS.SHORTLISTED_RESUMES;
      if (positionName !== 'All') {
        url += `?shortlisted_position_name=${encodeURIComponent(positionName)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setShortlistedResumes(data);
        console.log('Shortlisted resumes fetched for position:', positionName, data);
        toast({
          title: "Success!",
          description: `Found ${data.length} shortlisted resumes for ${positionName === 'All' ? 'all positions' : positionName}!`,
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
      const response = await fetch(API_ENDPOINTS.INTERVIEW_SESSIONS);
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
                API_ENDPOINTS.CHECK_AVAILABILITY(panelist.id, dateStr, slot.start, slot.end)
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

      const response = await fetch(API_ENDPOINTS.ASSIGN_PANEL, {
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
          resume.id.toString() === resumeId 
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-2 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        <div className="text-center px-2">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-gray-800 mb-2">
            📅 Interview Panel Scheduler
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600">
            Manage panel availability and auto-schedule interviews with shortlisted candidates
          </p>
        </div>

        {/* Data Management Section */}
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl text-gray-800">Data Management</CardTitle>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full sm:w-auto">
                <Button
                  onClick={handleLoadPanelists}
                  disabled={loadingPanelists}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
                >
                  <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                  {loadingPanelists ? 'Loading...' : 'Load Panelists'}
                </Button>
                <Button
                  onClick={handleLoadResumes}
                  disabled={loadingResumes}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                  {loadingResumes ? 'Loading...' : 'Shortlisted Resumes'}
                </Button>
                <Button
                  onClick={handleLoadSessions}
                  disabled={loadingSessions}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
                >
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {loadingSessions ? 'Loading...' : 'Load Sessions'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            {activeDataType && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">Filter by Position:</Label>
                {loadingJobRequirements ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span className="text-sm text-gray-500">Loading positions...</span>
                  </div>
                ) : (
                  <Select value={selectedPosition} onValueChange={handlePositionChange}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      {availableJobRequirements.map((job) => (
                        <SelectItem key={job.id} value={job.position_name}>
                          {job.position_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Panelists Display */}
        {displayedPanelists.length > 0 && (
          <Card className="border-blue-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-blue-800 text-lg sm:text-xl">Available Panelists ({filteredPanelists.length})</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <Input
                    placeholder="Search panelists..."
                    value={panelistSearch}
                    onChange={(e) => setPanelistSearch(e.target.value)}
                    className="text-sm w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredPanelists.map((panelist) => (
                  <div key={panelist.id} className="border border-gray-200 rounded-xl p-3 sm:p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex items-start justify-between mb-3">
                       <div className="flex-1 min-w-0">
                         <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{panelist.name}</h3>
                         <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-1 mt-1 truncate">
                           <Mail className="w-3 h-3 flex-shrink-0" />
                           <span className="truncate">{panelist.email}</span>
                         </p>
                         <p className="text-xs sm:text-sm text-blue-600 font-medium mt-1">
                           Position: {panelist.position_name}
                         </p>
                       </div>
                      <Button
                        onClick={() => deletePanelist(panelist.id)}
                        disabled={deletingPanelist[panelist.id]}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 ml-2 flex-shrink-0"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {(panelist.skills || []).map((skill) => (
                            <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                       <div>
                         <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Available Days:</p>
                         <div className="text-xs text-gray-600 space-y-1 max-h-20 overflow-y-auto">
                           {Object.keys(panelist.availability).map(day => {
                             if (panelist.availability[day] && Array.isArray(panelist.availability[day]) && panelist.availability[day].length > 0) {
                               return (
                                 <div key={day} className="flex flex-wrap gap-1 items-center">
                                   <span className="font-medium text-gray-700 min-w-[35px]">{day}:</span>
                                   <div className="flex flex-wrap gap-1">
                                     {panelist.availability[day].map((timeSlot, index) => (
                                       <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                         {timeSlot}
                                       </span>
                                     ))}
                                   </div>
                                 </div>
                               );
                             }
                             return null;
                           })}
                         </div>
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
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="text-green-800 text-lg sm:text-xl">Shortlisted Resumes ({filteredResumes.length})</CardTitle>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <Input
                    placeholder="Search resumes..."
                    value={resumeSearch}
                    onChange={(e) => setResumeSearch(e.target.value)}
                    className="text-sm w-full sm:w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {filteredResumes.map((resume) => (
                  <div key={resume.id} className="border border-gray-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{resume.candidate_name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{resume.candidate_email}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-sm text-gray-600">{resume.experience} years experience</span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                            {resume.shortlisted_position_name}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => deleteResume(resume.id.toString())}
                          disabled={deletingResume[resume.id.toString()]}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interview Sessions Display */}
        {interviewSessions.length > 0 && (
          <Card className="border-purple-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b p-3 sm:p-6">
              <CardTitle className="text-purple-800 text-lg sm:text-xl">Scheduled Interview Sessions ({interviewSessions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                {interviewSessions.map((session) => (
                  <div key={session.session_id} className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row items-start justify-between mb-4 gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">{session.candidate_name}</h3>
                        <p className="text-sm text-gray-600 truncate">with {session.panelist_name}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          onClick={() => deleteInterviewSession(session.session_id)}
                          disabled={deletingSession[session.session_id]}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.status === 'Scheduled' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="truncate">{session.session_date}</span>
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="truncate">{session.session_start} - {session.session_end}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-600 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="truncate">{session.panelist_email}</span>
                        </p>
                        <p className="text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4 text-orange-600 flex-shrink-0" />
                          <span className="truncate">{session.resume_file}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Panel Management Section */}
        <Card className="border-indigo-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-indigo-800 text-lg sm:text-xl">Interview Panel Management</CardTitle>
              <Button
                onClick={() => setIsAddingPanelist(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm text-xs sm:text-sm w-full sm:w-auto"
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                Add Panelist
              </Button>
            </div>
          </CardHeader>

          {/* Add Panelist Form */}
          {isAddingPanelist && (
            <CardContent className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                <h3 className="text-base sm:text-lg font-semibold text-blue-800">Add New Panelist</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Name *</Label>
                    <Input
                      placeholder="Enter panelist name"
                      value={newPanelist.name}
                      onChange={(e) => setNewPanelist(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email *</Label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={newPanelist.email}
                      onChange={(e) => setNewPanelist(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 text-sm"
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
                      className="text-sm"
                    />
                    <Button type="button" onClick={addSkillToPanelist} variant="outline" className="text-xs sm:text-sm">
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
                      <div key={day.day} className="border rounded-lg p-3 bg-white shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
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
                              className="text-xs w-full sm:w-auto"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Time Slot
                            </Button>
                          )}
                        </div>
                        {day.selected && (
                          <div className="space-y-2 mt-2">
                            {day.timeSlots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                                <div>
                                  <Label className="text-xs text-gray-600">Start Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.start}
                                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'start', e.target.value)}
                                    className="mt-1 text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs text-gray-600">End Time</Label>
                                  <Input
                                    type="time"
                                    value={slot.end}
                                    onChange={(e) => updateTimeSlot(dayIndex, slotIndex, 'end', e.target.value)}
                                    className="mt-1 text-sm"
                                  />
                                </div>
                                <div className="col-span-1 sm:col-span-2 text-xs text-gray-600 pt-2 sm:pt-6">
                                  {slot.start} - {slot.end}
                                </div>
                                <div className="pt-0 sm:pt-6">
                                  {day.timeSlots.length > 1 && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs w-full sm:w-auto"
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

                <div className="flex flex-col sm:flex-row gap-2 pt-4">
                  <Button 
                    onClick={addPanelist} 
                    disabled={addingPanelist}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm"
                  >
                    {addingPanelist ? 'Adding...' : 'Add Panelist'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddingPanelist(false)}
                    disabled={addingPanelist}
                    className="text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Mock Scheduling Section */}
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b p-3 sm:p-6">
            <CardTitle className="text-green-800 text-lg sm:text-xl">Auto-Schedule Interview (Demo)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4">
              <Button
                onClick={() => mockScheduleInterview('John Doe', ['Python', 'React'])}
                className="bg-green-600 hover:bg-green-700 shadow-sm text-xs sm:text-sm"
                disabled={panelists.length === 0}
              >
                Schedule for John Doe (Python, React)
              </Button>
              <Button
                onClick={() => mockScheduleInterview('Jane Smith', ['C#', 'Azure'])}
                className="bg-green-600 hover:bg-green-700 shadow-sm text-xs sm:text-sm"
                disabled={panelists.length === 0}
              >
                Schedule for Jane Smith (C#, Azure)
              </Button>
            </div>
            {panelists.length === 0 && (
              <p className="text-sm text-gray-500 mt-3 bg-gray-50 p-3 rounded-lg">Add panelists first to enable scheduling</p>
            )}
          </CardContent>
        </Card>

        {/* Scheduled Interviews */}
        {scheduledInterviews.length > 0 && (
          <Card className="border-orange-200 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b p-3 sm:p-6">
              <CardTitle className="text-orange-800 text-lg sm:text-xl">Scheduled Interviews ({scheduledInterviews.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                {scheduledInterviews.map((interview) => (
                  <div key={interview.id} className="border border-gray-200 rounded-xl p-4 sm:p-5 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="space-y-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base sm:text-lg truncate">
                          {interview.candidateName} → {interview.panelistName}
                        </h3>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{interview.date}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{interview.time}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate">{interview.panelistEmail}</span>
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <span className="text-sm text-gray-600">Skills:</span>
                          <div className="flex flex-wrap gap-1">
                            {interview.candidateSkills.map((skill) => (
                              <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
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
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InterviewScheduler;
