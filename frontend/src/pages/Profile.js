import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Calendar,
  MapPin,
  Camera,
  Edit3,
  Save,
  Target,
  Award,
  BookOpen,
} from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    age: '',
    location: '',
    class: '',
    interests: [],
    careerGoals: [],
    academicPerformance: '',
  });

  const [wellnessData, setWellnessData] = useState({
    mood: 7,
    stress: 4,
    sleep: 7,
    notes: '',
  });

  const interestOptions = [
    'Technology',
    'Science',
    'Mathematics',
    'Arts',
    'Literature',
    'Sports',
    'Music',
    'Engineering',
    'Medicine',
    'Business',
    'Psychology',
    'Environment',
  ];

  const careerOptions = [
    'Software Engineer',
    'Doctor',
    'Teacher',
    'Scientist',
    'Artist',
    'Entrepreneur',
    'Lawyer',
    'Architect',
    'Designer',
    'Researcher',
    'Consultant',
    'Writer',
  ];

  const handleSave = () => {
    // Save profile data
    setIsEditing(false);
  };

  const handleWellnessSubmit = () => {
    // Save wellness data
  };

  const toggleInterest = (interest) => {
    setProfileData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const toggleCareerGoal = (goal) => {
    setProfileData((prev) => ({
      ...prev,
      careerGoals: prev.careerGoals.includes(goal)
        ? prev.careerGoals.filter((g) => g !== goal)
        : [...prev.careerGoals, goal],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Profile & Personalization
          </h1>
          <p className="text-lg text-neutral-600">
            Customize your experience and track your wellness journey
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-neutral-900">
                  Basic Information
                </h2>
                <button
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isEditing
                      ? 'bg-success-100 text-success-700 hover:bg-success-200'
                      : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-4 w-4" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start space-x-6 mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition-colors">
                    <Camera className="h-3 w-3 text-neutral-600" />
                  </button>
                </div>

                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="input-modern"
                        placeholder="Full Name"
                      />
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) =>
                          setProfileData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="input-modern"
                        placeholder="Email Address"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-semibold text-neutral-900">
                        {profileData.name}
                      </h3>
                      <p className="text-neutral-600">{profileData.email}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-neutral-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>Class {profileData.class || '12th'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{profileData.location || 'Add location'}</span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={profileData.age}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        age: e.target.value,
                      }))
                    }
                    className="input-modern"
                    placeholder="Age"
                  />
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        location: e.target.value,
                      }))
                    }
                    className="input-modern"
                    placeholder="Location"
                  />
                  <input
                    type="text"
                    value={profileData.class}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        class: e.target.value,
                      }))
                    }
                    className="input-modern"
                    placeholder="Current Class"
                  />
                  <select
                    value={profileData.academicPerformance}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        academicPerformance: e.target.value,
                      }))
                    }
                    className="input-modern"
                  >
                    <option value="">Academic Performance</option>
                    <option value="excellent">Excellent (90%+)</option>
                    <option value="good">Good (75-90%)</option>
                    <option value="average">Average (60-75%)</option>
                    <option value="below-average">
                      Below Average (&lt;60%)
                    </option>
                  </select>
                </div>
              )}
            </div>

            {/* Interests */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Academic Interests
              </h2>
              <p className="text-neutral-600 mb-6">
                Select subjects and areas that interest you most
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      profileData.interests.includes(interest)
                        ? 'bg-primary-100 text-primary-700 border border-primary-200'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Career Goals */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Career Aspirations
              </h2>
              <p className="text-neutral-600 mb-6">
                What career paths are you considering?
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {careerOptions.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => toggleCareerGoal(goal)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      profileData.careerGoals.includes(goal)
                        ? 'bg-success-100 text-success-700 border border-success-200'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wellness Check-in */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Daily Wellness Check-in
              </h2>

              <div className="space-y-6">
                {/* Mood */}
                <div>
                  <label htmlFor="mood" className="block text-sm font-medium text-neutral-700 mb-2">
                    Mood (1-10)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-500">😢</span>
                    <input
                      type="range"
                      id="mood"
                      min="1"
                      max="10"
                      value={wellnessData.mood}
                      onChange={(e) =>
                        setWellnessData((prev) => ({
                          ...prev,
                          mood: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-neutral-500">😊</span>
                    <span className="text-sm font-medium text-neutral-900 w-6">
                      {wellnessData.mood}
                    </span>
                  </div>
                </div>

                {/* Stress */}
                <div>
                  <label htmlFor="stress" className="block text-sm font-medium text-neutral-700 mb-2">
                    Stress Level (1-10)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-500">😌</span>
                    <input
                      type="range"
                      id="stress"
                      min="1"
                      max="10"
                      value={wellnessData.stress}
                      onChange={(e) =>
                        setWellnessData((prev) => ({
                          ...prev,
                          stress: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-neutral-500">😰</span>
                    <span className="text-sm font-medium text-neutral-900 w-6">
                      {wellnessData.stress}
                    </span>
                  </div>
                </div>

                {/* Sleep */}
                <div>
                  <label htmlFor="sleep" className="block text-sm font-medium text-neutral-700 mb-2">
                    Sleep Quality (1-10)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-neutral-500">😴</span>
                    <input
                      type="range"
                      id="sleep"
                      min="1"
                      max="10"
                      value={wellnessData.sleep}
                      onChange={(e) =>
                        setWellnessData((prev) => ({
                          ...prev,
                          sleep: e.target.value,
                        }))
                      }
                      className="flex-1"
                    />
                    <span className="text-sm text-neutral-500">✨</span>
                    <span className="text-sm font-medium text-neutral-900 w-6">
                      {wellnessData.sleep}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    value={wellnessData.notes}
                    onChange={(e) =>
                      setWellnessData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="input-modern resize-none"
                    rows="3"
                    placeholder="How are you feeling today?"
                  />
                </div>

                <button
                  onClick={handleWellnessSubmit}
                  className="btn-primary w-full"
                >
                  Save Check-in
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">
                Your Progress
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-primary-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-primary-600" />
                    <span className="font-medium text-neutral-900">
                      Goals Set
                    </span>
                  </div>
                  <span className="text-primary-600 font-bold">3</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-success-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-success-600" />
                    <span className="font-medium text-neutral-900">
                      Assessments
                    </span>
                  </div>
                  <span className="text-success-600 font-bold">2</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-accent-600" />
                    <span className="font-medium text-neutral-900">
                      Sessions
                    </span>
                  </div>
                  <span className="text-accent-600 font-bold">12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;

