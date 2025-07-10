import React, { useState } from 'react';
import { Calendar, Clock, Plus, Users, Check, X, Mail, MapPin, ChevronDown, ChevronUp, UserCheck, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from "@/hooks/use-toast";

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
  available_days: string[];
  start_time: string;
  end_time: string;
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

interface DayTimeSlot {
  day: string;
  startTime: string;
  endTime: string;
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
  const { toast } = useToast();
  
  const [newPanelist, setNewPanelist] = useState({
    name: '',
    email: '',
    skills: [] as string[],
    skillInput: ''
  });

  const [availabilityForm, setAvailabilityForm] = useState({
    selectedDays: [] as string[],
    dayTimeSlots: [] as DayTimeSlot[]
  });

  const daysOfWeek = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];

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

  const toggleDaySelection = (day: string) => {
    const isSelected = availabilityForm.selectedDays.includes(day);
    
    if (isSelected) {
      // Remove day and its time slot
      setAvailabilityForm(prev => ({
        selectedDays: prev.selectedDays.filter(d => d !== day),
        dayTimeSlots: prev.dayTimeSlots.filter(slot => slot.day !== day)
      }));
    } else {
      // Add day with default time slot
      setAvailabilityForm(prev => ({
        selectedDays: [...prev.selectedDays, day],
        dayTimeSlots: [...prev.dayTimeSlots, { day, startTime: '09:00', endTime: '17:00' }]
      }));
    }
  };

  const updateDayTimeSlot = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailabilityForm(prev => ({
      ...prev,
      dayTimeSlots: prev.dayTimeSlots.map(slot =>
        slot.day === day ? { ...slot, [field]: value } : slot
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

    if (availabilityForm.selectedDays.length === 0 || availabilityForm.dayTimeSlots.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select availability days and time slots",
        variant: "destructive"
      });
      return;
    }

    setAddingPanelist(true);

    try {
      // Convert day names to the format expected by your API
      const availableDays = availabilityForm.selectedDays.map(day => day.slice(0, 3)); // Convert "Monday" to "Mon"

      // For now, use the first time slot as the general availability
      // This can be enhanced later to support different times per day
      const firstTimeSlot = availabilityForm.dayTimeSlots[0];

      const panelistData = {
        name: newPanelist.name.trim(),
        email: newPanelist.email.trim(),
        skills: newPanelist.skills,
        available_days: availableDays,
        start_time: firstTimeSlot.startTime,
        end_time: firstTimeSlot.endTime
      };

      console.log('Sending panelist data to API:', panelistData);

      const response = await fetch('http://localhost:5004/add-panelist', {
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
          selectedDays: [],
          dayTimeSlots: []
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
      const response = await fetch('http://localhost:5004/panelists');
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
      const response = await fetch('http://localhost:5004/shortlist-resume/list');
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
      const response = await fetch('http://localhost:5004/interview-sessions');
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

  const checkPanelistAvailability = async (panelistId: number) => {
    try {
      const response = await fetch(`http://localhost:5004/check-availability?panelist_id=${panelistId}`);
      if (response.ok) {
        const data = await response.json();
        return data.available;
      }
      return false;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  };

  const assignPanelistToResume = async (resumeId: string, panelistId: string) => {
    if (!panelistId) return;

    setAssigningPanelist(prev => ({ ...prev, [resumeId]: true }));

    try {
      // Check availability first
      const isAvailable = await checkPanelistAvailability(Number(panelistId));
      
      if (!isAvailable) {
        toast({
          title: "Unavailable",
          description: "This panelist is not available at the moment.",
          variant: "destructive"
        });
        return;
      }

      // Assign panelist
      const response = await fetch('http://localhost:5004/assign-panel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_id: resumeId,
          panelist_id: Number(panelistId)
        })
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
          description: `Panelist ${assignedPanelist?.name} has been assigned successfully.`,
        });

        // Refresh interview sessions
        fetchInterviewSessions();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Error",
          description: errorData.message || "Failed to assign panelist.",
          variant: "destructive"
        });
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
                          {panelist.skills.map((skill) => (
                            <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Available:</p>
                        <p className="text-xs text-gray-600">
                          {panelist.available_days.join(', ')} ({panelist.start_time} - {panelist.end_time})
                        </p>
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
                            {resume.matched_skills.map((skill) => (
                              <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Tech Stack:</p>
                          <div className="flex flex-wrap gap-1">
                            {resume.tech_stack.slice(0, 3).map((tech) => (
                              <span key={tech} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                            {resume.tech_stack.length > 3 && (
                              <span className="text-xs text-gray-500">+{resume.tech_stack.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">Assign Panelist:</label>
                          <select
                            value={resume.assigned_panelist || ''}
                            onChange={(e) => assignPanelistToResume(resume.id, e.target.value)}
                            disabled={assigningPanelist[resume.id]}
                            className="text-sm border rounded px-2 py-1 bg-white"
                          >
                            <option value="">Select Panelist</option>
                            {availablePanelists.map((panelist) => (
                              <option key={panelist.id} value={panelist.id.toString()}>
                                {panelist.name}
                              </option>
                            ))}
                          </select>
                          {assigningPanelist[resume.id] && (
                            <span className="text-sm text-blue-600">Assigning...</span>
                          )}
                        </div>
                        
                        {resume.assigned_panelist && (
                          <div className="text-sm text-green-600 font-medium">
                            Assigned to: {availablePanelists.find(p => p.id.toString() === resume.assigned_panelist)?.name}
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
                  <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mt-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDaySelection(day)}
                        className={`p-2 text-xs rounded border transition-colors ${
                          availabilityForm.selectedDays.includes(day)
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots for selected days */}
                {availabilityForm.selectedDays.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Time Slots for Selected Days</Label>
                    <div className="space-y-3 mt-2">
                      {availabilityForm.selectedDays.map((day) => {
                        const timeSlot = availabilityForm.dayTimeSlots.find(slot => slot.day === day);
                        return (
                          <div key={day} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{day}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs text-gray-600">Start Time</Label>
                                <Input
                                  type="time"
                                  value={timeSlot?.startTime || '09:00'}
                                  onChange={(e) => updateDayTimeSlot(day, 'startTime', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-gray-600">End Time</Label>
                                <Input
                                  type="time"
                                  value={timeSlot?.endTime || '17:00'}
                                  onChange={(e) => updateDayTimeSlot(day, 'endTime', e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
