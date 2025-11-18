import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { Link } from 'react-router-dom';
import {
  Target,
  Plus,
  Clock,
  Award,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Zap,
  Search
} from 'lucide-react';

const Roadmaps = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock roadmap data
  const mockRoadmaps = useMemo(() => [
    {
      id: 1,
      title: 'Computer Science Engineering',
      description: 'Complete pathway to becoming a software engineer',
      progress: 65,
      targetRole: 'Software Engineer',
      duration: '4 years',
      difficulty: 'Intermediate',
      category: 'Engineering',
      steps: 12,
      completedSteps: 8,
      isActive: true,
      colleges: ['IIT Delhi', 'BITS Pilani', 'VIT Vellore'],
      skills: ['Programming', 'Data Structures', 'Algorithms', 'Web Development'],
      color: 'primary'
    },
    {
      id: 2,
      title: 'Medical Doctor (MBBS)',
      description: 'Journey to becoming a medical practitioner',
      progress: 30,
      targetRole: 'Doctor',
      duration: '5.5 years',
      difficulty: 'Advanced',
      category: 'Medical',
      steps: 15,
      completedSteps: 4,
      isActive: true,
      colleges: ['AIIMS Delhi', 'CMC Vellore', 'JIPMER'],
      skills: ['Biology', 'Chemistry', 'Medical Knowledge', 'Patient Care'],
      color: 'error'
    },
    {
      id: 3,
      title: 'Business Administration',
      description: 'Path to business leadership and management',
      progress: 85,
      targetRole: 'Business Manager',
      duration: '3 years',
      difficulty: 'Beginner',
      category: 'Business',
      steps: 10,
      completedSteps: 9,
      isActive: false,
      colleges: ['IIM Ahmedabad', 'ISB Hyderabad', 'XLRI Jamshedpur'],
      skills: ['Leadership', 'Finance', 'Marketing', 'Strategy'],
      color: 'success'
    }
  ], []);

  useEffect(() => {
    setRoadmaps(mockRoadmaps);
  }, [mockRoadmaps]);

  const filteredRoadmaps = roadmaps.filter(roadmap => {
    const matchesFilter = filter === 'all' || 
      (filter === 'active' && roadmap.isActive) ||
      (filter === 'completed' && roadmap.progress === 100) ||
      (filter === 'category' && roadmap.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSearch = roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roadmap.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'error';
      default: return 'neutral';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Career Roadmaps</h1>
            <p className="text-lg text-neutral-600">
              Personalized pathways to achieve your career goals
            </p>
          </div>
          
          <button className="btn-primary mt-4 lg:mt-0 inline-flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Create New Roadmap
          </button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search roadmaps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-10"
            />
          </div>
          
          <div className="flex space-x-2">
            {['all', 'active', 'completed'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  filter === filterType
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                }`}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Roadmaps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {filteredRoadmaps.map((roadmap) => (
            <div key={roadmap.id} className="card-interactive p-6 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-${roadmap.color}-100`}>
                  {roadmap.category === 'Engineering' && <GraduationCap className={`h-6 w-6 text-${roadmap.color}-600`} />}
                  {roadmap.category === 'Medical' && <Award className={`h-6 w-6 text-${roadmap.color}-600`} />}
                  {roadmap.category === 'Business' && <Briefcase className={`h-6 w-6 text-${roadmap.color}-600`} />}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full bg-${getDifficultyColor(roadmap.difficulty)}-100 text-${getDifficultyColor(roadmap.difficulty)}-700`}>
                    {roadmap.difficulty}
                  </span>
                  {roadmap.isActive && (
                    <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {roadmap.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                  {roadmap.description}
                </p>
                
                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-neutral-700">Progress</span>
                    <span className="text-sm font-bold text-neutral-900">{roadmap.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill bg-gradient-to-r from-${roadmap.color}-500 to-${roadmap.color}-600`}
                      style={{ width: `${roadmap.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <Clock className="h-4 w-4" />
                    <span>{roadmap.duration}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <Target className="h-4 w-4" />
                    <span>{roadmap.completedSteps}/{roadmap.steps} steps</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-neutral-700 mb-2">Key Skills</p>
                  <div className="flex flex-wrap gap-1">
                    {roadmap.skills.slice(0, 3).map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                    {roadmap.skills.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md">
                        +{roadmap.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">{roadmap.targetRole}</span>
                </div>
                <button className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium text-sm">
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Course-to-Career Mapping Section */}
        <div className="card p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-3">Course-to-Career Mapping</h2>
            <p className="text-lg text-neutral-600">
              Discover how different degree programs lead to specific career opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                degree: 'B.Tech Computer Science',
                careers: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Tech Entrepreneur'],
                icon: GraduationCap,
                color: 'primary'
              },
              {
                degree: 'MBBS',
                careers: ['General Physician', 'Specialist Doctor', 'Surgeon', 'Medical Researcher'],
                icon: Award,
                color: 'error'
              },
              {
                degree: 'BBA/MBA',
                careers: ['Business Analyst', 'Marketing Manager', 'Consultant', 'CEO'],
                icon: Briefcase,
                color: 'success'
              }
            ].map((mapping, index) => (
              <div key={index} className="p-6 bg-gradient-to-br from-white to-neutral-50 rounded-2xl border border-neutral-200">
                <div className={`w-12 h-12 bg-${mapping.color}-100 rounded-xl flex items-center justify-center mb-4`}>
                  <mapping.icon className={`h-6 w-6 text-${mapping.color}-600`} />
                </div>
                
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">{mapping.degree}</h3>
                
                <div className="space-y-2">
                  {mapping.careers.map((career, careerIndex) => (
                    <div key={careerIndex} className="flex items-center space-x-2 text-sm text-neutral-600">
                      <ChevronRight className="h-3 w-3" />
                      <span>{career}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-4 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl text-white">
            <Zap className="h-8 w-8" />
            <div className="text-left">
              <h3 className="text-lg font-semibold">Need Help Choosing?</h3>
              <p className="text-primary-100">Take our AI-powered aptitude assessment</p>
            </div>
            <button className="bg-white text-primary-600 px-6 py-3 rounded-xl font-semibold hover:bg-neutral-100 transition-colors">
              Start Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roadmaps;