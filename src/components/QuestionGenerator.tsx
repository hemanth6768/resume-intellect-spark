import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from "@/hooks/use-toast";
import { Loader, MessageSquare, User, Briefcase, Target, Lightbulb, Upload, X, FileText } from 'lucide-react';
import { API_ENDPOINTS } from '@/config/api';
import ExpandableText from './ExpandableText';

interface JobRequirement {
  id: number;
  job_title: string;
  job_description: string;
  required_skills: string[];
  tech_stack: string[];
  min_experience_years: number;
  created_at: string;
}

interface QASet {
  questions: Array<{ question: string; answer: string }>;
  analysis_question: { question: string; answer: string };
}

interface GeneratedQuestions {
  candidate_name: string;
  job_title: string;
  basic: QASet;
  medium: QASet;
  hard: QASet;
}

const LEVEL_META: Record<string, { title: string; classes: string; badge: string }> = {
  basic: { title: 'Basic Level', classes: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-800' },
  medium: { title: 'Medium Level', classes: 'border-orange-200 bg-orange-50', badge: 'bg-orange-100 text-orange-800' },
  hard: { title: 'Hard Level', classes: 'border-red-200 bg-red-50', badge: 'bg-red-100 text-red-800' },
};

const QuestionGenerator = () => {
  const [jobRequirements, setJobRequirements] = useState<JobRequirement[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [generated, setGenerated] = useState<GeneratedQuestions | null>(null);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobRequirements();
  }, []);

  const fetchJobRequirements = async () => {
    setLoadingJobs(true);
    try {
      const response = await fetch(API_ENDPOINTS.JOB_REQUIREMENTS);
      if (response.ok) {
        const data = await response.json();
        setJobRequirements(data);
      } else {
        toast({ title: "Error", description: "Failed to fetch job requirements.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Error fetching job requirements.", variant: "destructive" });
    } finally {
      setLoadingJobs(false);
    }
  };

  const generateQuestions = async () => {
    if (!selectedJobId) {
      toast({ title: "Selection Required", description: "Please select a job first.", variant: "destructive" });
      return;
    }
    if (!resumeFile) {
      toast({ title: "Resume Required", description: "Please upload a resume PDF.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    setGenerated(null);
    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      const response = await fetch(API_ENDPOINTS.GENERATE_QUESTIONS(Number(selectedJobId)), {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const data = await response.json();
        setGenerated(data);
        toast({ title: "Success!", description: `Questions generated for ${data.candidate_name || 'candidate'}.` });
      } else {
        toast({ title: "Error", description: "Failed to generate questions.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Network Error", description: "Error generating questions.", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const renderLevel = (levelKey: 'basic' | 'medium' | 'hard', data: QASet) => {
    const meta = LEVEL_META[levelKey];
    return (
      <Card key={levelKey} className={`border ${meta.classes}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>{meta.title}</span>
            <span className={`text-xs px-2 py-1 rounded-full ${meta.badge}`}>
              {data.questions.length} questions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.questions.map((q, i) => (
            <div key={i} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-current">
              <p className="font-medium text-sm mb-2">Q{i + 1}. {q.question}</p>
              <ExpandableText text={q.answer} className="text-sm text-muted-foreground" maxLength={200} />
            </div>
          ))}
          {data.analysis_question && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">Analysis Question</p>
              </div>
              <p className="font-medium text-sm mb-2">{data.analysis_question.question}</p>
              <ExpandableText text={data.analysis_question.answer} className="text-sm text-muted-foreground" maxLength={200} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Interview Question Generator</h1>
          <p className="text-lg text-gray-600">Generate tailored interview questions per job</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Select Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId} disabled={loadingJobs}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingJobs ? 'Loading jobs...' : 'Select a job...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {jobRequirements.map((job) => (
                      <SelectItem key={job.id} value={String(job.id)}>
                        {job.job_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={generateQuestions} disabled={!selectedJobId || generating} className="flex items-center gap-2">
                {generating ? (
                  <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                ) : (
                  <><MessageSquare className="w-4 h-4" /> Generate Questions</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {generated && (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <span className="font-semibold">{generated.candidate_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <span>{generated.job_title}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {generated.basic && renderLevel('basic', generated.basic)}
              {generated.medium && renderLevel('medium', generated.medium)}
              {generated.hard && renderLevel('hard', generated.hard)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionGenerator;
