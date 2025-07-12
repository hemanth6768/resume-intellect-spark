
import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import ResumeUploader from "../components/ResumeUploader";
import SmartResumeFilter from "../components/SmartResumeFilter";
import InterviewScheduler from "../components/InterviewScheduler";
import { FileText, MessageSquare, Calendar, Menu, X, Search } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'requirements' | 'filter' | 'questions' | 'scheduler'>('requirements');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    {
      id: 'requirements' as const,
      label: 'Define Job Requirements',
      icon: Search,
      description: 'Set criteria for ideal candidates'
    },
    {
      id: 'filter' as const,
      label: 'Analyze Resumes',
      icon: FileText,
      description: 'Filter and analyze resumes'
    },
    {
      id: 'questions' as const,
      label: 'Question Generator',
      icon: MessageSquare,
      description: 'Generate interview questions'
    },
    {
      id: 'scheduler' as const,
      label: 'Interview Scheduler',
      icon: Calendar,
      description: 'Schedule interviews'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-20'} transition-all duration-300 bg-white border-r shadow-sm flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-2xl font-bold text-gray-800">SMART Hire</h1>
                <p className="text-sm text-gray-600">AI-Powered Recruitment</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="ml-auto"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Icon className={`w-7 h-7 ${isActive ? 'text-blue-600' : 'text-gray-500'} flex-shrink-0`} />
                  {sidebarOpen && (
                    <div className="min-w-0">
                      <div className={`font-medium ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                        {item.label}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          {sidebarOpen && (
            <div className="text-xs text-gray-500 text-center">
              Streamline your hiring process with AI
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find(item => item.id === activeTab)?.label}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {menuItems.find(item => item.id === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'requirements' && <SmartResumeFilter showOnlyRequirements={true} />}
          {activeTab === 'filter' && <SmartResumeFilter showOnlyRequirements={false} />}
          {activeTab === 'questions' && <ResumeUploader />}
          {activeTab === 'scheduler' && <InterviewScheduler />}
        </div>
      </div>
    </div>
  );
};

export default Index;
