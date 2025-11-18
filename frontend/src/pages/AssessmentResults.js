import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Brain,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowRight,
  Briefcase,
  Target,
  Users,
  ArrowLeft,
  Download,
  Share2,
} from 'lucide-react';

const AssessmentResults = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAssessmentResults();
  }, [assessmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAssessmentResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/assessments/${assessmentId}/results`
      );
      setAssessment(response.data);
    } catch (error) {
      console.error('Failed to fetch assessment results:', error);
      setError('Failed to load assessment results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-lg text-neutral-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/assessments')}
              className="btn-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </button>
            <button onClick={fetchAssessmentResults} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-neutral-600">Assessment not found.</p>
          <Link to="/assessments" className="btn-primary mt-4">
            Back to Assessments
          </Link>
        </div>
      </div>
    );
  }

  const results = assessment.results;
  const analysis = assessment.analysis;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/assessments')}
            className="flex items-center space-x-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Assessments</span>
          </button>

          <div className="flex items-center space-x-4">
            <button className="btn-ghost">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            <button className="btn-ghost">
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>

        {/* Results Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Award className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            {assessment.title} Results
          </h1>
          <p className="text-lg text-neutral-600">
            Completed on{' '}
            {new Date(assessment.updatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Overall Score Card */}
        {results && (
          <div className="card p-8 mb-8 text-center">
            <div className="mb-6">
              <div className="text-7xl font-bold text-primary-600 mb-2">
                {results.percentage?.toFixed(0) || 'N/A'}%
              </div>
              <p className="text-xl text-neutral-600">Overall Score</p>
            </div>

            {/* AI Analysis Summary */}
            {(analysis?.aiAnalysis || results?.insights) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-blue-600 mr-2" />
                  AI Analysis
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {analysis?.aiAnalysis || results?.insights}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Category Scores */}
        {results?.categoryScores &&
          Object.keys(results.categoryScores).length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
                Category Breakdown
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(results.categoryScores).map(
                  ([category, data]) => (
                    <div
                      key={category}
                      className="p-4 bg-neutral-50 rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-neutral-900 text-sm">
                          {category.replace('-', ' ')}
                        </span>
                        <span className="text-primary-600 font-bold">
                          {data.percentage?.toFixed(0) || 0}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${data.percentage || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Question Analysis */}
        {analysis?.questionAnalysis && analysis.questionAnalysis.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6 flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              Question Analysis
            </h2>
            <div className="space-y-4">
              {analysis.questionAnalysis.map((qa, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border-l-4 ${
                    qa.isOptimal
                      ? 'bg-green-50 border-green-400'
                      : 'bg-yellow-50 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-medium text-neutral-900 flex-1 pr-4">
                      {qa.question}
                    </h4>
                    <div
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                        qa.isOptimal
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
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
                      <span className="font-medium">Your Answer:</span>{' '}
                      {qa.userAnswer}
                    </p>

                    {qa.betterChoice && !qa.isOptimal && (
                      <p className="text-sm text-yellow-700">
                        <span className="font-medium">Consider:</span>{' '}
                        {qa.betterChoice}
                      </p>
                    )}

                    <p className="text-sm text-neutral-700">
                      <span className="font-medium">Analysis:</span>{' '}
                      {qa.feedback}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          {analysis?.strengths && analysis.strengths.length > 0 && (
            <div className="card p-6">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                <Award className="h-6 w-6 text-green-600 mr-2" />
                Your Strengths
              </h3>
              <div className="space-y-3">
                {analysis.strengths.map((strength, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-neutral-700">{strength}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Areas */}
          {analysis?.improvementAreas &&
            analysis.improvementAreas.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center">
                  <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
                  Growth Areas
                </h3>
                <div className="space-y-3">
                  {analysis.improvementAreas.map((area, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-neutral-700">{area}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Career Suggestions */}
        {analysis?.careerSuggestions &&
          analysis.careerSuggestions.length > 0 && (
            <div className="card p-6 mb-8">
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6 flex items-center">
                <Briefcase className="h-6 w-6 text-purple-600 mr-2" />
                Career Suggestions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.careerSuggestions.map((career, index) => (
                  <div
                    key={index}
                    className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {career.field}
                      </h4>
                      <div className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                        <Target className="h-4 w-4" />
                        <span>{career.match}% match</span>
                      </div>
                    </div>
                    <p className="text-neutral-700 mb-4">{career.reasoning}</p>
                    <div className="space-y-2 text-sm text-neutral-600">
                      <p>
                        <span className="font-medium">Requirements:</span>{' '}
                        {career.requirements}
                      </p>
                      <p>
                        <span className="font-medium">Growth Outlook:</span>{' '}
                        {career.growth}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Recommendations */}
        {(analysis?.recommendations || results?.recommendations) && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">
              Personalized Recommendations
            </h2>
            <div className="space-y-4">
              {(
                analysis?.recommendations ||
                results?.recommendations ||
                []
              ).map((recommendation, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-r from-primary-50 to-white rounded-xl border border-primary-100"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                    </div>
                    <p className="text-neutral-700 flex-1">{recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {analysis?.nextSteps && analysis.nextSteps.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6 flex items-center">
              <ArrowRight className="h-6 w-6 text-green-600 mr-2" />
              Next Steps
            </h2>
            <div className="space-y-4">
              {analysis.nextSteps.map((step, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-neutral-700 flex-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        {analysis?.detailedFeedback && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6 flex items-center">
              <Users className="h-6 w-6 text-indigo-600 mr-2" />
              Detailed Feedback
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(analysis.detailedFeedback).map(
                ([category, feedback]) => (
                  <div
                    key={category}
                    className="p-4 bg-indigo-50 rounded-xl border border-indigo-200"
                  >
                    <h4 className="font-semibold text-indigo-900 mb-2 capitalize">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-indigo-700 text-sm">{feedback}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/assessments" className="btn-secondary">
            Take Another Assessment
          </Link>
          <Link to="/roadmaps" className="btn-primary">
            Create Career Roadmap
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AssessmentResults;

