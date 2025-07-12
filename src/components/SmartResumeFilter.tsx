import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle, Search, Filter, Users, Send, ArrowRight, FileText, MessageSquare, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useToast } from "@/hooks/use-toast";
import ExpandableText from './ExpandableText';

interface JobRequirements {
  jobTitle: string;
  requiredSkills: string[];
  minExperience: number;
  techStack: string[];
}

interface ResumeAnalysis {
  id: string;
  fileName: string;
  candidate_email: string;
  candidate_name: string;
  candidate_tech_stack: string[];
  experience_years: number;
  matched_skills: string[];
  matched_tech_stack: string[];
  mentioned_tech_stack: string[];
  missing_skills: string[];
  reason: string;
  resume_skills: string[];
  shortlisted: boolean;
  worked_on: string;
}

interface SmartResumeFilterProps {
  showOnlyRequirements?: boolean;
}

const SmartResumeFilter: React.FC<SmartResumeFilterProps> = ({ showOnlyRequirements = false }) => {
  const [jobRequirements, setJobRequirements] = useState<JobRequirements>({
    jobTitle: '',
    requiredSkills: [],
    minExperience: 0,
    techStack: []
  });
  
  const [uploadJobTitle, setUploadJobTitle] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [resumes, setResumes] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [savingCandidates, setSavingCandidates] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const addSkill = () => {
    if (skillInput.trim() && !jobRequirements.requiredSkills.includes(skillInput.trim())) {
      setJobRequirements(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const addTechStack = () => {
    if (techInput.trim() && !jobRequirements.techStack.includes(techInput.trim())) {
      setJobRequirements(prev => ({
        ...prev,
        techStack: [...prev.techStack, techInput.trim()]
      }));
      setTechInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setJobRequirements(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter(s => s !== skill)
    }));
  };

  const removeTechStack = (tech: string) => {
    setJobRequirements(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  const submitJobRequirements = async () => {
    if (!jobRequirements.jobTitle.trim() || jobRequirements.requiredSkills.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please provide job title and at least one required skill",
        variant: "destructive"
      });
      return;
    }

    setSubmitLoading(true);
    
    const payload = {
      job_title: jobRequirements.jobTitle,
      skills: jobRequirements.requiredSkills,
      min_experience: jobRequirements.minExperience,
      tech_stack: jobRequirements.techStack
    };

    try {
      const response = await fetch('http://localhost:5000/add-requirement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Job requirements submitted successfully:', result);
        toast({
          title: "Success!",
          description: "Job requirements submitted successfully!",
        });
      } else {
        console.error('Failed to submit job requirements:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to submit job requirements. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error submitting job requirements:', error);
      toast({
        title: "Network Error",
        description: "Error submitting job requirements. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const saveCandidateDetails = async (analysis: ResumeAnalysis) => {
    setSavingCandidates(prev => ({ ...prev, [analysis.id]: true }));
    
    const payload = {
      resume_filename: analysis.fileName,
      candidate_name: analysis.candidate_name,
      candidate_email: analysis.candidate_email,
      experience: analysis.experience_years,
      matched_skills: analysis.matched_skills,
      missing_skills: analysis.missing_skills,
      tech_stack: analysis.candidate_tech_stack,
      reason: analysis.reason,
      shortlisted: analysis.shortlisted,
      worked_on: analysis.worked_on,
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch('http://localhost:5000/shortlist-resume/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Candidate details saved successfully:', result);
        toast({
          title: "Success!",
          description: "Candidate details saved successfully!",
        });
      } else {
        console.error('Failed to save candidate details:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to save candidate details. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving candidate details:', error);
      toast({
        title: "Network Error",
        description: "Error saving candidate details. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setSavingCandidates(prev => ({ ...prev, [analysis.id]: false }));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    setResumes(prev => [...prev, ...pdfFiles]);
  };

  const removeResume = (index: number) => {
    setResumes(prev => prev.filter((_, i) => i !== index));
  };

  const analyzeResumes = async () => {
    if (resumes.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please upload at least one resume",
        variant: "destructive"
      });
      return;
    }
    
    const jobTitleToUse = uploadJobTitle.trim() || jobRequirements.jobTitle.trim();
    if (!jobTitleToUse) {
      toast({
        title: "Validation Error",
        description: "Please enter a job title",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    const newAnalyses: ResumeAnalysis[] = [];
    
    try {
      for (let i = 0; i < resumes.length; i++) {
        const file = resumes[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('position_name', jobTitleToUse);

        console.log(`Analyzing resume: ${file.name} for job: ${jobTitleToUse}`);
        
        const response = await fetch('http://localhost:5000/shortlist-resume', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Analysis result:', result);
          
          const analysis: ResumeAnalysis = {
            id: `resume-${i}`,
            fileName: file.name,
            candidate_email: result.candidate_email || '',
            candidate_name: result.candidate_name || file.name.replace('.pdf', ''),
            candidate_tech_stack: result.candidate_tech_stack || [],
            experience_years: result.experience_years || 0,
            matched_skills: result.matched_skills || [],
            matched_tech_stack: result.matched_tech_stack || [],
            mentioned_tech_stack: result.mentioned_tech_stack || [],
            missing_skills: result.missing_skills || [],
            reason: result.reason || 'No reason provided',
            resume_skills: result.resume_skills || [],
            shortlisted: result.shortlisted || false,
            worked_on: result.worked_on || ''
          };
          
          newAnalyses.push(analysis);
        } else {
          console.error(`Failed to analyze ${file.name}:`, response.statusText);
          toast({
            title: "Analysis Error",
            description: `Failed to analyze ${file.name}. Please try again.`,
            variant: "destructive"
          });
        }
      }
      
      setAnalyses(newAnalyses);
      console.log('All analyses completed:', newAnalyses);
      toast({
        title: "Success!",
        description: `Successfully analyzed ${newAnalyses.length} resumes!`,
      });
    } catch (error) {
      console.error('Error analyzing resumes:', error);
      toast({
        title: "Network Error",
        description: "Error analyzing resumes. Please check your connection and API server.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedAnalyses = [...analyses].sort((a, b) => {
    if (a.shortlisted && !b.shortlisted) return -1;
    if (!a.shortlisted && b.shortlisted) return 1;
    return b.experience_years - a.experience_years;
  });

  const canAnalyze = resumes.length > 0 && (uploadJobTitle.trim().length > 0 || jobRequirements.jobTitle.trim().length > 0);

  if (showOnlyRequirements) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-4 px-2 sm:py-8 sm:px-4">
        <div className="max-w-4xl mx-auto">
          <Card className="border-blue-200 shadow-md">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Search className="w-5 h-5" />
                Job Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-6">
              <div>
                <Label className="text-sm font-medium">Job Title *</Label>
                <Input
                  placeholder="e.g., Backend Developer"
                  value={jobRequirements.jobTitle}
                  onChange={(e) => setJobRequirements(prev => ({
                    ...prev,
                    jobTitle: e.target.value
                  }))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">This will be used as the default for resume analysis</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Required Skills</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter a skill and press Enter..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {jobRequirements.requiredSkills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {skill}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-blue-600"
                        onClick={() => removeSkill(skill)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Minimum Years of Experience</Label>
                <Input
                  type="number"
                  min="0"
                  value={jobRequirements.minExperience}
                  onChange={(e) => setJobRequirements(prev => ({
                    ...prev,
                    minExperience: parseInt(e.target.value) || 0
                  }))}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">Tech Stack (Optional)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Enter technology and press Enter..."
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechStack();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTechStack} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {jobRequirements.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                    >
                      {tech}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-purple-600"
                        onClick={() => removeTechStack(tech)}
                      />
                    </span>
                  ))}
                </div>
              </div>

              <Button
                onClick={submitJobRequirements}
                disabled={submitLoading || !jobRequirements.jobTitle.trim() || jobRequirements.requiredSkills.length === 0}
                className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
                {submitLoading ? 'Submitting...' : 'Submit Job Requirements'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Card className="border-purple-200 shadow-md">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <FileText className="w-5 h-5" />
                Resume Upload & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-6">
              <div>
                <Label className="text-sm font-medium">Job Title for Analysis</Label>
                <Input
                  placeholder="Enter job title or leave empty to use requirement above"
                  value={uploadJobTitle}
                  onChange={(e) => setUploadJobTitle(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {jobRequirements.jobTitle.trim() 
                    ? `Will use "${jobRequirements.jobTitle}" if left empty` 
                    : 'Required for resume analysis'}
                </p>
              </div>

              <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <Upload className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <label htmlFor="resume-files" className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-700">
                    Upload Multiple Resumes
                  </span>
                  <input
                    id="resume-files"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">PDF files only, multiple selection supported</p>
              </div>

              {resumes.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {resumes.length} resume(s) uploaded:
                  </p>
                  <div className="grid gap-2">
                    {resumes.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <span className="text-sm truncate font-medium">{file.name}</span>
                        <X
                          className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500"
                          onClick={() => removeResume(index)}
                        />
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    onClick={analyzeResumes}
                    disabled={loading || !canAnalyze}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing Resumes...
                      </>
                    ) : (
                      'Analyze Resumes'
                    )}
                  </Button>
                  
                  {!canAnalyze && resumes.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-600 text-center">
                        Please enter a job title above or in the Job Requirements section
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {analyses.length > 0 && (
          <div className="mb-8">
            <Card className="border-green-200 shadow-md">
              <CardHeader className="bg-green-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Users className="w-5 h-5" />
                    Candidate Analysis Results
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="mt-6">
                {viewMode === 'cards' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium truncate">{analysis.candidate_name}</h3>
                            <p className="text-xs text-gray-500 truncate">{analysis.candidate_email}</p>
                          </div>
                          <span className={`p-1 rounded ${analysis.shortlisted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {analysis.shortlisted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`font-bold ${analysis.shortlisted ? 'text-green-600' : 'text-red-600'}`}>
                              {analysis.shortlisted ? 'Shortlisted' : 'Not Selected'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Experience:</span>
                            <span className="font-medium">{analysis.experience_years} years</span>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Matched Skills:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.matched_skills.slice(0, 3).map((skill) => (
                              <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                            {analysis.matched_skills.length > 3 && (
                              <span className="text-xs text-gray-500">+{analysis.matched_skills.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        {analysis.missing_skills.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Missing Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {analysis.missing_skills.slice(0, 3).map((skill) => (
                                <span key={skill} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                              {analysis.missing_skills.length > 3 && (
                                <span className="text-xs text-gray-500">+{analysis.missing_skills.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tech Stack:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.candidate_tech_stack.slice(0, 3).map((tech) => (
                              <span key={tech} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                            {analysis.candidate_tech_stack.length > 3 && (
                              <span className="text-xs text-gray-500">+{analysis.candidate_tech_stack.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Reasoning:</p>
                          <ExpandableText 
                            text={analysis.reason} 
                            maxLength={120}
                            className="text-sm text-gray-800"
                          />
                        </div>

                        {analysis.worked_on && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Work Experience:</p>
                            <ExpandableText 
                              text={analysis.worked_on} 
                              maxLength={100}
                              className="text-sm text-gray-800"
                            />
                          </div>
                        )}

                        <div className="pt-2 border-t">
                          <Button
                            onClick={() => saveCandidateDetails(analysis)}
                            disabled={savingCandidates[analysis.id]}
                            className="w-full bg-orange-600 hover:bg-orange-700 flex items-center gap-2"
                            size="sm"
                          >
                            <Save className="w-4 h-4" />
                            {savingCandidates[analysis.id] ? 'Saving...' : 'Save to Database'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Candidate</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Experience</th>
                          <th className="text-left p-2">Matched Skills</th>
                          <th className="text-left p-2">Missing Skills</th>
                          <th className="text-left p-2">Reasoning</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAnalyses.map((analysis) => (
                          <tr key={analysis.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{analysis.candidate_name}</td>
                            <td className="p-2 text-sm text-gray-600">{analysis.candidate_email}</td>
                            <td className="p-2">
                              <span className={`flex items-center gap-1 ${analysis.shortlisted ? 'text-green-600' : 'text-red-600'}`}>
                                {analysis.shortlisted ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                {analysis.shortlisted ? 'Shortlisted' : 'Not Selected'}
                              </span>
                            </td>
                            <td className="p-2">{analysis.experience_years} years</td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {analysis.matched_skills.map((skill) => (
                                  <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1">
                                {analysis.missing_skills.map((skill) => (
                                  <span key={skill} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-2 max-w-xs">
                              <ExpandableText 
                                text={analysis.reason} 
                                maxLength={100}
                                className="text-sm"
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                onClick={() => saveCandidateDetails(analysis)}
                                disabled={savingCandidates[analysis.id]}
                                className="bg-orange-600 hover:bg-orange-700 flex items-center gap-1"
                                size="sm"
                              >
                                <Save className="w-3 h-3" />
                                {savingCandidates[analysis.id] ? 'Saving...' : 'Save'}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-green-200">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Ready for Interview Questions?
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Generate tailored interview questions for shortlisted candidates
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Generate Interview Questions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartResumeFilter;
