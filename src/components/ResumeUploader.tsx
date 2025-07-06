
import React, { useState } from 'react';
import { Upload, Loader, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ApiResponse {
  skills_detected: string[];
  experience_years: number;
  questions: {
    level_1: string[];
    level_2: string[];
    level_3: string[];
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
      console.log('API Response:', data);
      console.log('Questions structure:', data.questions);
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

  const formatQuestions = (questionsArray: string[]) => {
    console.log('Raw questions array:', questionsArray);
    console.log('Array type:', typeof questionsArray);
    console.log('Is array:', Array.isArray(questionsArray));
    
    if (!Array.isArray(questionsArray)) {
      console.log('Questions is not an array, returning empty array');
      return [];
    }
    
    const filtered = questionsArray.filter(question => {
      const isValid = question && 
                     typeof question === 'string' && 
                     question.trim() && 
                     !question.toLowerCase().includes('minutes)');
      console.log(`Question: "${question}" - Valid: ${isValid}`);
      return isValid;
    });
    
    console.log('Filtered questions:', filtered);
    return filtered;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-4 px-2 sm:py-8 sm:px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-2">
            AI Resume Interview Question Generator
          </h1>
          <p className="text-base sm:text-lg text-gray-600 px-2">
            Upload your resume and get tailored interview questions based on your skills and experience
          </p>
        </div>

        {!result && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 mb-6">
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 hover:border-blue-400 transition-colors">
                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <div className="mb-4">
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <span className="text-base sm:text-lg font-medium text-gray-700">
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
                    <span className="font-medium text-sm sm:text-base break-all">{file.name}</span>
                  </div>
                )}

                <button
                  onClick={handleUpload}
                  disabled={!file || loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 sm:px-6 rounded-lg transition-colors flex items-center mx-auto text-sm sm:text-base"
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
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <span className="text-red-700 font-medium text-sm sm:text-base">{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Resume Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Skills Detected</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.skills_detected.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3">Experience</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {result.experience_years} years
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">Generated Interview Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <Tabs defaultValue="level_1" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                    <TabsTrigger value="level_1" className="text-green-700 text-xs sm:text-sm px-1 sm:px-3">
                      Beginner
                    </TabsTrigger>
                    <TabsTrigger value="level_2" className="text-orange-700 text-xs sm:text-sm px-1 sm:px-3">
                      Intermediate
                    </TabsTrigger>
                    <TabsTrigger value="level_3" className="text-red-700 text-xs sm:text-sm px-1 sm:px-3">
                      Advanced
                    </TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(result.questions).map(([level, questions]) => {
                    const formattedQuestions = formatQuestions(questions);
                    console.log(`Level ${level} formatted questions:`, formattedQuestions);
                    
                    return (
                      <TabsContent key={level} value={level} className="mt-4 sm:mt-6">
                        <div className={`p-3 sm:p-6 rounded-lg border-2 ${getLevelColor(level)}`}>
                          <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
                            {getLevelTitle(level)}
                          </h3>
                          <div className="space-y-2 sm:space-y-3">
                            {formattedQuestions.length > 0 ? (
                              formattedQuestions.map((question, index) => (
                                <div
                                  key={index}
                                  className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-current"
                                >
                                  <p className="text-gray-800 font-medium text-sm sm:text-base leading-relaxed">
                                    {question}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border-l-4 border-current">
                                <p className="text-gray-500 text-sm sm:text-base">
                                  No questions available for this level.
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Debug: Raw data type: {typeof questions}, Length: {questions?.length || 'N/A'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              </CardContent>
            </Card>

            <div className="text-center">
              <button
                onClick={resetUpload}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm sm:text-base"
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
