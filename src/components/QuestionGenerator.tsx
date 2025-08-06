import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader, Users, MessageSquare, User, Mail, Briefcase, Calendar, Target } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import ExpandableText from './ExpandableText';

interface JobRequirement {
  id: number;
  position_name: string;
  description: string;
  skills: string[];
  tech_stack: string[];
  experience_required: number;
  created_at: string;
}

interface ShortlistedCandidate {
  candidate_email: string;
  candidate_name: string;
  experience: number;
  reason: string;
  worked_on: string;
  shortlisted_position_name: string;
}

interface GeneratedQuestions {
  candidate_name: string;
  position_name: string;
  questions: {
    level_1: Array<{
      question: string;
      answer: string | { code?: string; output?: string };
    }>;
    level_2: Array<{
      question: string;
      answer: string | { code?: string; output?: string };
    }>;
    level_3: Array<{
      question: string;
      answer: string | { code?: string; output?: string };
    }>;
  };
  skills_used: string;
}

const QuestionGenerator = () => {
  const [jobRequirements, setJobRequirements] = useState<JobRequirement[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [shortlistedCandidates, setShortlistedCandidates] = useState<ShortlistedCandidate[]>([]);
  const [generatedQuestions, setGeneratedQuestions] = useState<Record<string, GeneratedQuestions>>({});
  const [loadingJobRequirements, setLoadingJobRequirements] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState<Record<string, boolean>>({});
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
        setJobRequirements(data);
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

  const fetchShortlistedCandidates = async () => {
    if (!selectedPosition) {
      toast({
        title: "Selection Required",
        description: "Please select a position first.",
        variant: "destructive"
      });
      return;
    }

    setLoadingCandidates(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.SHORTLISTED_RESUMES}?shortlisted_position_name=${encodeURIComponent(selectedPosition)}`);
      if (response.ok) {
        const data = await response.json();
        setShortlistedCandidates(data);
        console.log('Shortlisted candidates fetched:', data);
        toast({
          title: "Success!",
          description: `Found ${data.length} shortlisted candidates for ${selectedPosition}!`,
        });
      } else {
        console.error('Failed to fetch shortlisted candidates:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to fetch shortlisted candidates. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching shortlisted candidates:', error);
      toast({
        title: "Network Error",
        description: "Error fetching shortlisted candidates. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setLoadingCandidates(false);
    }
  };

  const generateQuestions = async (candidate: ShortlistedCandidate) => {
    const candidateKey = `${candidate.candidate_name}-${candidate.shortlisted_position_name}`;
    setGeneratingQuestions(prev => ({ ...prev, [candidateKey]: true }));

    try {
      const response = await fetch('http://localhost:5002/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_name: candidate.candidate_name,
          position_name: candidate.shortlisted_position_name
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQuestions(prev => ({ ...prev, [candidateKey]: data }));
        console.log('Questions generated for:', candidate.candidate_name, data);
        toast({
          title: "Success!",
          description: `Interview questions generated for ${candidate.candidate_name}!`,
        });
      } else {
        console.error('Failed to generate questions:', response.statusText);
        toast({
          title: "Error",
          description: "Failed to generate questions. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Network Error",
        description: "Error generating questions. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setGeneratingQuestions(prev => ({ ...prev, [candidateKey]: false }));
    }
  };

  const renderAnswer = (answer: string | { code?: string; output?: string }) => {
    if (typeof answer === 'string') {
      return <ExpandableText text={answer} className="text-sm text-muted-foreground" />;
    } else if (answer && typeof answer === 'object') {
      return (
        <div className="space-y-2">
          {answer.code && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Code:</p>
              <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                <code>{answer.code}</code>
              </pre>
            </div>
          )}
          {answer.output && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Expected Output:</p>
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">{answer.output}</p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'level_1':
        return 'border-green-200 bg-green-50';
      case 'level_2':
        return 'border-orange-200 bg-orange-50';
      case 'level_3':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getLevelTitle = (level: string) => {
    switch (level) {
      case 'level_1':
        return 'Beginner Level';
      case 'level_2':
        return 'Intermediate Level';
      case 'level_3':
        return 'Advanced Level';
      default:
        return level.replace('_', ' ').toUpperCase();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Interview Question Generator
          </h1>
          <p className="text-lg text-gray-600">
            Generate tailored interview questions for shortlisted candidates
          </p>
        </div>

        {/* Position Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Select Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Position
                </label>
                <Select 
                  value={selectedPosition} 
                  onValueChange={setSelectedPosition}
                  disabled={loadingJobRequirements}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRequirements.map((job) => (
                      <SelectItem key={job.id} value={job.position_name}>
                        {job.position_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={fetchShortlistedCandidates}
                disabled={!selectedPosition || loadingCandidates}
                className="flex items-center gap-2"
              >
                {loadingCandidates ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4" />
                    Shortlisted Candidates
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Shortlisted Candidates */}
        {shortlistedCandidates.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {shortlistedCandidates.map((candidate, index) => {
              const candidateKey = `${candidate.candidate_name}-${candidate.shortlisted_position_name}`;
              const isGenerating = generatingQuestions[candidateKey];
              const hasQuestions = generatedQuestions[candidateKey];

              return (
                <Card key={index} className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5" />
                      {candidate.candidate_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{candidate.candidate_email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{candidate.experience} years experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{candidate.shortlisted_position_name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Shortlisting Reason:</p>
                        <ExpandableText 
                          text={candidate.reason} 
                          className="text-sm text-muted-foreground"
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Previous Work:</p>
                        <ExpandableText 
                          text={candidate.worked_on} 
                          className="text-sm text-muted-foreground"
                          maxLength={100}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={() => generateQuestions(candidate)}
                      disabled={isGenerating}
                      className="w-full flex items-center gap-2"
                      variant={hasQuestions ? "secondary" : "default"}
                    >
                      {isGenerating ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          {hasQuestions ? "Regenerate Questions" : "Generate Questions"}
                        </>
                      )}
                    </Button>

                    {/* Display Generated Questions */}
                    {hasQuestions && (
                      <div className="mt-4 space-y-3">
                        <h4 className="font-semibold text-sm">Generated Questions:</h4>
                        {Object.entries(hasQuestions.questions).map(([level, questions]) => (
                          <div key={level} className={`p-3 rounded-lg border ${getLevelColor(level)}`}>
                            <h5 className="font-medium text-sm mb-2">{getLevelTitle(level)}</h5>
                            <div className="space-y-2">
                              {questions.slice(0, 2).map((q, qIndex) => (
                                <div key={qIndex} className="bg-white p-2 rounded text-xs">
                                  <p className="font-medium">{q.question}</p>
                                  {renderAnswer(q.answer)}
                                </div>
                              ))}
                              {questions.length > 2 && (
                                <p className="text-xs text-muted-foreground italic">
                                  +{questions.length - 2} more questions
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                        {hasQuestions.skills_used && (
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium">Skills Assessed:</p>
                            <p>{hasQuestions.skills_used}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {shortlistedCandidates.length === 0 && selectedPosition && !loadingCandidates && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              No Shortlisted Candidates Found
            </h3>
            <p className="text-gray-500">
              There are no shortlisted candidates for the selected position.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionGenerator;