import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle, Search, Filter, Users, Send, ArrowRight, FileText, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface JobRequirements {
  jobTitle: string;
  requiredSkills: string[];
  minExperience: number;
  techStack: string[];
}

interface ResumeAnalysis {
  id: string;
  fileName: string;
  experience_years: number;
  matched_skills: string[];
  mentioned_tech_stack: string[];
  missing_skills: string[];
  reason: string;
  shortlisted: boolean;
  worked_on: string[];
}

const SmartResumeFilter = () => {
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
      alert('Please provide job title and at least one required skill');
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
        alert('Job requirements submitted successfully!');
      } else {
        console.error('Failed to submit job requirements:', response.statusText);
        alert('Failed to submit job requirements. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting job requirements:', error);
      alert('Error submitting job requirements. Please check your connection.');
    } finally {
      setSubmitLoading(false);
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
      alert('Please upload at least one resume');
      return;
    }
    
    const jobTitleToUse = uploadJobTitle.trim() || jobRequirements.jobTitle.trim();
    if (!jobTitleToUse) {
      alert('Please enter a job title');
      return;
    }
    
    setLoading(true);
    const newAnalyses: ResumeAnalysis[] = [];
    
    try {
      for (let i = 0; i < resumes.length; i++) {
        const file = resumes[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('job_title', jobTitleToUse);

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
            experience_years: result.experience_years || 0,
            matched_skills: result.matched_skills || [],
            mentioned_tech_stack: result.mentioned_tech_stack || [],
            missing_skills: result.missing_skills || [],
            reason: result.reason || 'No reason provided',
            shortlisted: result.shortlisted || false,
            worked_on: result.worked_on || []
          };
          
          newAnalyses.push(analysis);
        } else {
          console.error(`Failed to analyze ${file.name}:`, response.statusText);
          alert(`Failed to analyze ${file.name}. Please try again.`);
        }
      }
      
      setAnalyses(newAnalyses);
      console.log('All analyses completed:', newAnalyses);
    } catch (error) {
      console.error('Error analyzing resumes:', error);
      alert('Error analyzing resumes. Please check your connection and API server.');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
            🎯 Smart Resume Filter
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Streamline your hiring process - Define requirements, analyze resumes, and generate interview questions
          </p>
        </div>

        {/* Workflow Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
              <span className="text-sm font-medium text-gray-700">Job Requirements</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
              <span className="text-sm font-medium text-gray-700">Resume Analysis</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <span className="text-sm font-medium text-gray-700">Question Generation</span>
            </div>
          </div>
        </div>

        {/* Step 1: Job Requirements */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
            <h2 className="text-xl font-bold text-gray-800">Define Job Requirements</h2>
            <p className="text-sm text-gray-600">Set the criteria for your ideal candidate</p>
          </div>
          
          <Card className="border-blue-200 shadow-md">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Search className="w-5 h-5" />
                Job Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-6">
              {/* Job Title */}
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

              {/* Required Skills */}
              <div>
                <Label className="text-sm font-medium">Required Skills</Label>
                <Input
                  placeholder="Press Enter to add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="mt-2"
                />
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

              {/* Minimum Experience */}
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

              {/* Tech Stack */}
              <div>
                <Label className="text-sm font-medium">Tech Stack (Optional)</Label>
                <Input
                  placeholder="Press Enter to add technology..."
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTechStack()}
                  className="mt-2"
                />
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

              {/* Submit Button */}
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

        {/* Step 2: Resume Analysis */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
            <h2 className="text-xl font-bold text-gray-800">Analyze Resumes</h2>
            <p className="text-sm text-gray-600">Upload and evaluate candidate resumes</p>
          </div>

          <Card className="border-purple-200 shadow-md">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <FileText className="w-5 h-5" />
                Resume Upload & Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 mt-6">
              {/* Job Title for Analysis */}
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

              {/* File Upload */}
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
                    {loading ? 'Analyzing Resumes...' : 'Analyze Resumes'}
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

        {/* Step 3: Results & Question Generation */}
        {analyses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
              <h2 className="text-xl font-bold text-gray-800">Analysis Results & Question Generation</h2>
              <p className="text-sm text-gray-600">Review candidates and generate interview questions</p>
            </div>

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
                          <h3 className="font-medium truncate">{analysis.fileName}</h3>
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
                            {analysis.matched_skills.map((skill) => (
                              <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {analysis.missing_skills.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Missing Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {analysis.missing_skills.map((skill) => (
                                <span key={skill} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tech Stack:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.mentioned_tech_stack.slice(0, 3).map((tech) => (
                              <span key={tech} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                {tech}
                              </span>
                            ))}
                            {analysis.mentioned_tech_stack.length > 3 && (
                              <span className="text-xs text-gray-500">+{analysis.mentioned_tech_stack.length - 3} more</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-600 mb-1">Reasoning:</p>
                          <p className="text-sm text-gray-800">{analysis.reason}</p>
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
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Experience</th>
                          <th className="text-left p-2">Matched Skills</th>
                          <th className="text-left p-2">Missing Skills</th>
                          <th className="text-left p-2">Reasoning</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedAnalyses.map((analysis) => (
                          <tr key={analysis.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-medium">{analysis.fileName}</td>
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
                            <td className="p-2 text-sm max-w-xs">{analysis.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Question Generation Button */}
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
