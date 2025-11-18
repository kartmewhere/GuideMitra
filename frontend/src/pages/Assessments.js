import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Brain,
  Target,
  Heart,
  BookOpen,
  CheckCircle,
  Clock,
  ArrowRight,
  Play,
  Award,
  TrendingUp,
  Users,
  Zap,
  Briefcase
} from 'lucide-react';

const Assessments = () => {

  const [assessments, setAssessments] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingText, setLoadingText] = useState('Processing your responses...');

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Loading progress effect
  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentStep(0);
      setLoadingText('Processing your responses...');
      return;
    }

    const steps = [
      'Processing your responses...',
      'Analyzing your unique patterns...',
      'Matching you with career paths...',
      'Creating personalized recommendations...',
      'Almost ready with your results!'
    ];

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        const next = Math.min(prev + 1, 3);
        setLoadingText(steps[next] || steps[steps.length - 1]);
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const fetchAssessments = async () => {
    try {
      const response = await axios.get('/api/assessments');
      setAssessments(response.data.userAssessments || []);
      setAvailableAssessments(response.data.availableAssessments || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
      // Set default assessments if API fails
      setAvailableAssessments([
        {
          type: 'APTITUDE',
          title: 'Career Aptitude Assessment',
          description: 'Discover your natural abilities and suitable career paths',
          isCompleted: false
        },
        {
          type: 'INTEREST',
          title: 'Career Interest Inventory',
          description: 'Identify your interests and matching career fields',
          isCompleted: false
        },
        {
          type: 'PERSONALITY',
          title: 'Personality Type Assessment',
          description: 'Understand your personality traits and work style preferences',
          isCompleted: false
        },
        {
          type: 'SKILL',
          title: 'Skills Assessment',
          description: 'Evaluate your current skills and identify areas for development',
          isCompleted: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (type) => {
    try {
      const response = await axios.post('/api/assessments/create', {
        type,
        title: availableAssessments.find(a => a.type === type)?.title
      });
      setSelectedAssessment(response.data);
      setCurrentQuestion(0);
      setAnswers({});
    } catch (error) {
      console.error('Failed to start assessment:', error);
      // Show error message to user
      alert('Failed to start assessment. Please try again.');
    }
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      // eslint-disable-next-line security/detect-object-injection
      [String(questionId)]: answer,
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < selectedAssessment.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitAssessment();
    }
  };

  const submitAssessment = async () => {
    try {
      setIsAnalyzing(true);
      
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        // eslint-disable-next-line security/detect-object-injection
        questionId: String(questionId),
        answer: answer,
      }));

      const response = await axios.post(
        `/api/assessments/${selectedAssessment.id}/submit`,
        { answers: answersArray }
      );

      setResults(response.data.results);
      setShowResults(true);
      setSelectedAssessment(null);
      fetchAssessments(); // Refresh the list
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit assessment. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAssessmentIcon = (type) => {
    switch (type) {
      case 'APTITUDE': return Brain;
      case 'PERSONALITY': return Users;
      case 'INTEREST': return Heart;
      case 'SKILL': return Target;
      default: return BookOpen;
    }
  };

  const getAssessmentColor = (type) => {
    switch (type) {
      case 'APTITUDE': return 'primary';
      case 'PERSONALITY': return 'success';
      case 'INTEREST': return 'error';
      case 'SKILL': return 'warning';
      default: return 'neutral';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  // Analysis loading screen
  if (isAnalyzing) {
    const steps = [
      { text: 'Processing your responses', completed: true },
      { text: 'Analyzing patterns and strengths', completed: currentStep >= 1 },
      { text: 'Generating career recommendations', completed: currentStep >= 2 },
      { text: 'Finalizing personalized insights', completed: currentStep >= 3 }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center px-6">
          {/* Animated Brain Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
              <Brain className="h-16 w-16 text-white z-10" />
              
              {/* Animated Background Circles */}
              <div className="absolute inset-0 animate-ping">
                <div className="w-full h-full bg-white opacity-20 rounded-full"></div>
              </div>
              <div className="absolute inset-2 animate-pulse">
                <div className="w-full h-full bg-white opacity-10 rounded-full"></div>
              </div>
            </div>
            
            {/* Animated Progress Ring */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-neutral-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`${(currentStep + 1) * 70} 283`}
                  className="text-primary-500 transition-all duration-1000 ease-out"
                />
              </svg>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">
            Analyzing Your Responses
          </h2>
          <p className="text-lg text-neutral-600 mb-8 transition-all duration-500">
            {loadingText}
          </p>

          {/* Progress Steps */}
          <div className="space-y-4 text-left mb-8">
            {steps.map((step, index) => (
              <div key={index} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all duration-500 ${
                step.completed 
                  ? 'bg-green-50 border-green-200' 
                  : currentStep === index 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-white border-neutral-200'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                  step.completed 
                    ? 'bg-green-500' 
                    : currentStep === index 
                      ? 'bg-blue-500 animate-pulse' 
                      : 'bg-neutral-300'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : currentStep === index ? (
                    <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                  ) : (
                    <Clock className="h-4 w-4 text-neutral-500" />
                  )}
                </div>
                <span className={`font-medium transition-colors duration-500 ${
                  step.completed 
                    ? 'text-green-700' 
                    : currentStep === index 
                      ? 'text-blue-700' 
                      : 'text-neutral-500'
                }`}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>

          {/* Fun Facts */}
          <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <div className="flex items-center justify-center space-x-2 text-purple-700 mb-2">
              <Zap className="h-5 w-5" />
              <span className="font-semibold">Did you know?</span>
            </div>
            <p className="text-sm text-purple-600">
              Our AI analyzes over 50 different factors from your responses to create personalized career recommendations tailored just for you!
            </p>
          </div>

          {/* Estimated Time */}
          <div className="mt-6 flex items-center justify-center space-x-2 text-neutral-500">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Usually takes 10-30 seconds</span>
          </div>
        </div>
      </div>
    );
  }

  // Assessment taking interface
  if (selectedAssessment) {
    const question = selectedAssessment.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedAssessment.questions.length) * 100;

    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-neutral-900">{selectedAssessment.title}</h1>
              <span className="text-sm text-neutral-600">
                Question {currentQuestion + 1} of {selectedAssessment.questions.length}
              </span>
            </div>
            
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question Card */}
          <div className="card p-8 mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              {question.question}
            </h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(question.id, option)}
                  className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${
                    answers[question.id] === option
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      answers[question.id] === option
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-neutral-300'
                    }`}>
                      {answers[question.id] === option && (
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={nextQuestion}
              disabled={!answers[question.id]}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentQuestion === selectedAssessment.questions.length - 1 ? 'Submit' : 'Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results display
  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Award className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Assessment Complete!</h1>
            <p className="text-lg text-neutral-600">Here are your personalized results</p>
          </div>

          {/* Enhanced Score Card */}
          <div className="card p-8 mb-8">
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-primary-600 mb-2">
                {results.percentage.toFixed(0)}%
              </div>
              <p className="text-lg text-neutral-600">Overall Score</p>
            </div>
            
            {/* AI Analysis Summary */}
            {results.aiAnalysis && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center">
                  <Brain className="h-5 w-5 text-blue-600 mr-2" />
                  AI Analysis
                </h3>
                <p className="text-neutral-700 leading-relaxed">{results.aiAnalysis}</p>
              </div>
            )}
          </div>

          {/* Category Scores */}
          {results.categoryScores && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Category Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(results.categoryScores).map(([category, data]) => (
                  <div key={category} className="p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-neutral-900">{category}</span>
                      <span className="text-primary-600 font-bold">
                        {data.percentage?.toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${data.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Question Analysis */}
          {results.questionAnalysis && results.questionAnalysis.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Question Analysis
              </h2>
              <div className="space-y-4">
                {results.questionAnalysis.map((qa, index) => (
                  <div key={index} className={`p-4 rounded-xl border-l-4 ${
                    qa.isOptimal 
                      ? 'bg-green-50 border-green-400' 
                      : 'bg-yellow-50 border-yellow-400'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-neutral-900 flex-1 pr-4">
                        {qa.question}
                      </h4>
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        qa.isOptimal 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {qa.isOptimal ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            <span>Optimal</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3" />
                            <span>Consider</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-neutral-600">
                        <span className="font-medium">Your Answer:</span> {qa.userAnswer}
                      </p>
                      
                      {qa.betterChoice && !qa.isOptimal && (
                        <p className="text-sm text-yellow-700">
                          <span className="font-medium">Consider:</span> {qa.betterChoice}
                        </p>
                      )}
                      
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium">Analysis:</span> {qa.feedback}
                      </p>
                      
                      {qa.reasoning && (
                        <p className="text-xs text-neutral-500 italic">
                          {qa.reasoning}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths and Improvement Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            {results.strengths && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 text-green-600 mr-2" />
                  Your Strengths
                </h3>
                <div className="space-y-3">
                  {results.strengths.map((strength, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-neutral-700">{strength}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Areas */}
            {results.improvementAreas && (
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                  Growth Areas
                </h3>
                <div className="space-y-3">
                  {results.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-neutral-700">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Career Suggestions */}
          {results.careerSuggestions && results.careerSuggestions.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                <Briefcase className="h-5 w-5 text-purple-600 mr-2" />
                Career Suggestions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.careerSuggestions.map((career, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-neutral-900">{career.field}</h4>
                      <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                        <span>{career.match}%</span>
                        <span>match</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-700 mb-2">{career.reasoning}</p>
                    <div className="space-y-1 text-xs text-neutral-600">
                      <p><span className="font-medium">Requirements:</span> {career.requirements}</p>
                      <p><span className="font-medium">Growth:</span> {career.growth}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="card p-6 mb-8">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Personalized Recommendations</h2>
            <div className="space-y-4">
              {results.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-primary-50 to-white rounded-xl border border-primary-100">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-primary-600" />
                    </div>
                    <p className="text-neutral-700 flex-1">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          {results.nextSteps && (
            <div className="card p-6 mb-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                <ArrowRight className="h-5 w-5 text-green-600 mr-2" />
                Next Steps
              </h2>
              <div className="space-y-3">
                {results.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <p className="text-neutral-700 flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShowResults(false)}
              className="btn-secondary"
            >
              Take Another Assessment
            </button>
            <Link to="/roadmaps" className="btn-primary">
              Create Career Roadmap
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main assessments page
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">
            Discover Your Potential
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Take our scientifically designed assessments to understand your aptitude, personality, and interests. 
            Get personalized career recommendations based on your unique profile.
          </p>
        </div>

        {/* Available Assessments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {availableAssessments.map((assessment) => {
            const Icon = getAssessmentIcon(assessment.type);
            const color = getAssessmentColor(assessment.type);
            const isCompleted = assessment.isCompleted;

            return (
              <div key={assessment.type} className="card-interactive p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${
                    color === 'primary' ? 'bg-blue-100' :
                    color === 'success' ? 'bg-green-100' :
                    color === 'error' ? 'bg-red-100' :
                    color === 'warning' ? 'bg-yellow-100' :
                    'bg-gray-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${
                      color === 'primary' ? 'text-blue-600' :
                      color === 'success' ? 'text-green-600' :
                      color === 'error' ? 'text-red-600' :
                      color === 'warning' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  {isCompleted && (
                    <div className="flex items-center space-x-1 text-success-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Completed</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  {assessment.title}
                </h3>
                <p className="text-sm text-neutral-600 mb-4">
                  {assessment.description}
                </p>

                <div className="flex items-center justify-between text-sm text-neutral-500 mb-6">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>10-15 min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>10 questions</span>
                  </div>
                </div>

                <button
                  onClick={() => startAssessment(assessment.type)}
                  disabled={isCompleted}
                  className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    isCompleted
                      ? 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                      : color === 'primary' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                        color === 'success' ? 'bg-green-500 hover:bg-green-600 text-white' :
                        color === 'error' ? 'bg-red-500 hover:bg-red-600 text-white' :
                        color === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600 text-white' :
                        'bg-gray-500 hover:bg-gray-600 text-white'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      <span>Start Assessment</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Completed Assessments */}
        {assessments.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">Your Assessment History</h2>
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const Icon = getAssessmentIcon(assessment.type);
                const color = getAssessmentColor(assessment.type);

                return (
                  <div key={assessment.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        color === 'primary' ? 'bg-blue-100' :
                        color === 'success' ? 'bg-green-100' :
                        color === 'error' ? 'bg-red-100' :
                        color === 'warning' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          color === 'primary' ? 'text-blue-600' :
                          color === 'success' ? 'text-green-600' :
                          color === 'error' ? 'text-red-600' :
                          color === 'warning' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-neutral-900">{assessment.title}</h3>
                        <p className="text-sm text-neutral-600">
                          Completed on {new Date(assessment.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {assessment.results && (
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            color === 'primary' ? 'text-blue-600' :
                            color === 'success' ? 'text-green-600' :
                            color === 'error' ? 'text-red-600' :
                            color === 'warning' ? 'text-yellow-600' :
                            'text-gray-600'
                          }`}>
                            {assessment.results.percentage.toFixed(0)}%
                          </div>
                          <div className="text-xs text-neutral-500">Score</div>
                        </div>
                      )}
                      <Link
                        to={`/assessments/${assessment.id}/results`}
                        className="btn-ghost text-sm"
                      >
                        View Results
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center space-x-4 p-6 bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl text-white">
            <Zap className="h-8 w-8" />
            <div className="text-left">
              <h3 className="text-lg font-semibold">Ready to discover your path?</h3>
              <p className="text-primary-100">Complete all assessments for the most accurate recommendations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessments;