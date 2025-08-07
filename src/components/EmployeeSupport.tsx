import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageCircle, AlertCircle, CheckCircle, Clock, Send, User, Mail, Phone } from 'lucide-react';

const EmployeeSupport = () => {
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    priority: '',
    category: ''
  });

  // Mock data for tickets
  const [tickets] = useState([
    {
      id: 1,
      title: 'Unable to access payroll system',
      description: 'I cannot log into the payroll portal to view my pay stubs.',
      priority: 'high',
      category: 'technical',
      status: 'open',
      submittedBy: 'John Doe',
      submittedAt: '2024-01-15',
      assignedTo: 'IT Support'
    },
    {
      id: 2,
      title: 'Request for leave approval',
      description: 'I need approval for my vacation leave from March 1-10.',
      priority: 'medium',
      category: 'leave',
      status: 'in-progress',
      submittedBy: 'Jane Smith',
      submittedAt: '2024-01-14',
      assignedTo: 'HR Team'
    },
    {
      id: 3,
      title: 'Office equipment malfunction',
      description: 'My laptop is running very slowly and affecting my productivity.',
      priority: 'medium',
      category: 'technical',
      status: 'resolved',
      submittedBy: 'Mike Johnson',
      submittedAt: '2024-01-13',
      assignedTo: 'IT Support'
    }
  ]);

  const [communications] = useState([
    {
      id: 1,
      type: 'announcement',
      title: 'Company Holiday Schedule',
      content: 'Please note the updated holiday schedule for 2024...',
      author: 'HR Department',
      date: '2024-01-15',
      priority: 'normal'
    },
    {
      id: 2,
      type: 'policy',
      title: 'Updated Remote Work Policy',
      content: 'We have updated our remote work guidelines...',
      author: 'Management',
      date: '2024-01-14',
      priority: 'high'
    }
  ]);

  const handleSubmitTicket = () => {
    // In a real app, this would submit to Supabase
    console.log('Submitting ticket:', newTicket);
    setNewTicket({ title: '', description: '', priority: '', category: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'in-progress': return 'default';
      case 'resolved': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-6">
          {/* Submit New Ticket */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Submit Support Ticket
              </CardTitle>
              <CardDescription>
                Need help? Submit a support ticket and our team will assist you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Title</label>
                  <Input
                    placeholder="Brief description of your issue"
                    value={newTicket.title}
                    onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={newTicket.category} onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Support</SelectItem>
                      <SelectItem value="hr">HR Related</SelectItem>
                      <SelectItem value="leave">Leave Management</SelectItem>
                      <SelectItem value="payroll">Payroll</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={newTicket.priority} onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Provide detailed information about your issue..."
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button onClick={handleSubmitTicket} className="w-full md:w-auto">
                <Send className="w-4 h-4 mr-2" />
                Submit Ticket
              </Button>
            </CardContent>
          </Card>

          {/* Existing Tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Your Support Tickets</CardTitle>
              <CardDescription>Track the status of your submitted tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{ticket.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge variant={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 gap-4">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {ticket.submittedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ticket.submittedAt}
                      </span>
                      <span>Assigned to: {ticket.assignedTo}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Communications</CardTitle>
              <CardDescription>Important announcements and updates from your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {comm.priority === 'high' && <AlertCircle className="w-4 h-4 text-red-500" />}
                          {comm.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{comm.content}</p>
                      </div>
                      <Badge variant={comm.type === 'announcement' ? 'default' : 'secondary'}>
                        {comm.type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500 gap-4">
                      <span>By: {comm.author}</span>
                      <span>{comm.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  HR Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">General HR</p>
                  <p className="text-sm text-gray-600">hr@company.com</p>
                  <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                </div>
                <div>
                  <p className="font-medium">Payroll</p>
                  <p className="text-sm text-gray-600">payroll@company.com</p>
                  <p className="text-sm text-gray-600">+1 (555) 123-4568</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  IT Support
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">Technical Support</p>
                  <p className="text-sm text-gray-600">it-support@company.com</p>
                  <p className="text-sm text-gray-600">+1 (555) 123-4569</p>
                </div>
                <div>
                  <p className="font-medium">Help Desk</p>
                  <p className="text-sm text-gray-600">Available 24/7</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  Employee Handbook
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Benefits Portal
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Time Off Requests
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Training Materials
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmployeeSupport;
