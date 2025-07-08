
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import ResumeUploader from "../components/ResumeUploader";
import SmartResumeFilter from "../components/SmartResumeFilter";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'filter' | 'questions'>('filter');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant={activeTab === 'filter' ? 'default' : 'outline'}
              onClick={() => setActiveTab('filter')}
              className="flex items-center gap-2"
            >
              🎯 Resume Filter
            </Button>
            <Button
              variant={activeTab === 'questions' ? 'default' : 'outline'}
              onClick={() => setActiveTab('questions')}
              className="flex items-center gap-2"
            >
              🤖 Question Generator
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-screen">
        {activeTab === 'filter' ? <SmartResumeFilter /> : <ResumeUploader />}
      </div>
    </div>
  );
};

export default Index;
