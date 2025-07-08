
import React, { useState } from 'react';
import { Upload, X, Check, AlertCircle, Search, Filter, Users, Send } from 'lucide-react';
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
  matchPercentage: number;
  matchedSkills: string[];
  experienceYears: number;
  suitable: boolean;
  reasoning: string;
}

const SmartResumeFilter = () => {
  const [jobRequirements, setJobRequirements] = useState<JobRequirements>({
    jobTitle: '',
    requiredSkills: [],
    minExperience: 0,
    techStack: []
  });
  
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
    if (resumes.length === 0) return;
    
    setLoading(true);
    
    // Mock analysis - replace with actual API call
    const mockAnalyses: ResumeAnalysis[] = resumes.map((file, index) => {
      const matchedSkills = jobRequirements.requiredSkills.slice(0, Math.floor(Math.random() * jobRequirements.requiredSkills.length) + 1);
      const matchPercentage = Math.floor((matchedSkills.length / jobRequirements.requiredSkills.length) * 100);
      const experienceYears = Math.floor(Math.random() * 10) + 1;
      const suitable = matchPercentage >= 60 && experienceYears >= jobRequirements.minExperience;
      
      return {
        id: `resume-${index}`,
        fileName: file.name,
        matchPercentage,
        matchedSkills,
        experienceYears,
        suitable,
        reasoning: suitable 
          ? `Strong match with ${matchedSkills.length} required skills and ${experienceYears} years experience`
          : `Limited match - only ${matchedSkills.length} skills matched, needs ${jobRequirements.minExperience - experienceYears > 0 ? `${jobRequirements.minExperience - experienceYears} more years` : 'more relevant skills'}`
      };
    });
    
    setAnalyses(mockAnalyses);
    setLoading(false);
  };

  const sortedAnalyses = [...analyses].sort((a, b) => b.matchPercentage - a.matchPercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
            🎯 Smart Resume Filter
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Match the Right Talent Instantly - Define requirements and compare multiple resumes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Job Requirements Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Job Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Job Title */}
              <div>
                <Label className="text-sm font-medium">Job Title</Label>
                <Input
                  placeholder="e.g., Backend Developer"
                  value={jobRequirements.jobTitle}
                  onChange={(e) => setJobRequirements(prev => ({
                    ...prev,
                    jobTitle: e.target.value
                  }))}
                  className="mt-2"
                />
              </div>

              {/* Required Skills */}
              <div>
                <Label className="text-sm font-medium">Required Skills</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                    className="flex-1"
                  />
                  <Button onClick={addSkill} size="sm">Add</Button>
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
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add technology..."
                    value={techInput}
                    onChange={(e) => setTechInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTechStack()}
                    className="flex-1"
                  />
                  <Button onClick={addTechStack} size="sm">Add</Button>
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

              {/* Submit Button */}
              <Button
                onClick={submitJobRequirements}
                disabled={submitLoading || !jobRequirements.jobTitle.trim() || jobRequirements.requiredSkills.length === 0}
                className="w-full flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                {submitLoading ? 'Submitting...' : 'Submit Job Requirements'}
              </Button>
            </CardContent>
          </Card>

          {/* Resume Upload Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Resume Upload Panel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                <p className="text-sm text-gray-500 mt-2">PDF files only</p>
              </div>

              {resumes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-sm">{resumes.length} resume(s) uploaded:</p>
                  {resumes.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm truncate">{file.name}</span>
                      <X
                        className="w-4 h-4 cursor-pointer text-gray-500 hover:text-red-500"
                        onClick={() => removeResume(index)}
                      />
                    </div>
                  ))}
                  <Button
                    onClick={analyzeResumes}
                    disabled={loading || jobRequirements.requiredSkills.length === 0}
                    className="w-full mt-4"
                  >
                    {loading ? 'Analyzing...' : 'Analyze Resumes'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {analyses.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
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
            <CardContent>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sortedAnalyses.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{analysis.fileName}</h3>
                        <span className={`p-1 rounded ${analysis.suitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {analysis.suitable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Match:</span>
                          <span className={`font-bold ${analysis.matchPercentage >= 70 ? 'text-green-600' : analysis.matchPercentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {analysis.matchPercentage}%
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Experience:</span>
                          <span className="font-medium">{analysis.experienceYears} years</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Matched Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.matchedSkills.map((skill) => (
                            <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reasoning:</p>
                        <p className="text-sm text-gray-800">{analysis.reasoning}</p>
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
                        <th className="text-left p-2">Match %</th>
                        <th className="text-left p-2">Experience</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Skills</th>
                        <th className="text-left p-2">Reasoning</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedAnalyses.map((analysis) => (
                        <tr key={analysis.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">{analysis.fileName}</td>
                          <td className="p-2">
                            <span className={`font-bold ${analysis.matchPercentage >= 70 ? 'text-green-600' : analysis.matchPercentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {analysis.matchPercentage}%
                            </span>
                          </td>
                          <td className="p-2">{analysis.experienceYears} years</td>
                          <td className="p-2">
                            <span className={`p-1 rounded ${analysis.suitable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {analysis.suitable ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </span>
                          </td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {analysis.matchedSkills.map((skill) => (
                                <span key={skill} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2 text-sm">{analysis.reasoning}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SmartResumeFilter;
