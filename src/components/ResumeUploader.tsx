import React, { useState } from 'react';
import { Upload, Loader, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ApiResponse {
  skills_detected: string[];
  experience_years: number;
  questions: {
    level_1: string;
    level_2: string;
    level_3: string;
  };
}

const ResumeUploader = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a PDF file only.');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload-resume/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data: ApiResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const formatQuestions = (questionText: string) => {
    return questionText.split('\n').filter(line => line.trim()).map((question, index) => {
      const trimmedQuestion = question.trim();
      if (trimmedQuestion.match(/^\d+\./)) {
        return trimmedQuestion;
      }
      return trimmedQuestion;
    });
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

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'level_1':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'level_2':
        return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'level_3':
        return 'text-red-600 border-red-200 bg-red-50';
      default:
        return 'text-blue-600 border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            AI Resume Interview Question Generator
          </h1>
          <p className="text-lg text-gray-600">
            Upload your resume and get tailored interview questions based on your skills and experience
          </p>
        </div>

        {!result && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-gray-700">
                      Choose your resume file
                    </span>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mb-4">PDF files only</p>
                
                {file && (
                  <div className="flex items-center justify-center mb-4 text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Generate Questions
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700 font-medium">{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Resume Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Skills Detected</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.skills_detected.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Experience</h3>
                    <div className="text-3xl font-bold text-blue-600">
                      {result.experience_years} years
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Generated Interview Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="level_1" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="level_1" className="text-green-700">Beginner</TabsTrigger>
                    <TabsTrigger value="level_2" className="text-orange-700">Intermediate</TabsTrigger>
                    <TabsTrigger value="level_3" className="text-red-700">Advanced</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(result.questions).map(([level, questions]) => (
                    <TabsContent key={level} value={level} className="mt-6">
                      <div className={`p-6 rounded-lg border-2 ${getLevelColor(level)}`}>
                        <h3 className="text-xl font-bold mb-4">
                          {getLevelTitle(level)}
                        </h3>
                        <div className="space-y-3">
                          {formatQuestions(questions).map((question, index) => (
                            <div
                              key={index}
                              className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-current"
                            >
                              <p className="text-gray-800 font-medium">{question}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            <div className="text-center">
              <button
                onClick={resetUpload}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Upload Another Resume
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeUploader;
