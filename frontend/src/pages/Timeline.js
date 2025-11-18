import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Calendar,
  Clock,
  Bell,
  Plus,
  BookOpen,
  Award,
  Users,
  AlertCircle,
  CheckCircle,
  Search,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react';

const Timeline = () => {
  const [events, setEvents] = useState([]);
  const [categorizedEvents, setCategorizedEvents] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    type: 'EXAM',
    eventDate: '',
    reminderDate: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('/api/timeline');
      setEvents(response.data.events);
      setCategorizedEvents(response.data.categorized);
    } catch (error) {
      console.error('Failed to fetch timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/timeline', newEvent);
      setNewEvent({
        title: '',
        description: '',
        type: 'EXAM',
        eventDate: '',
        reminderDate: '',
      });
      setShowAddEvent(false);
      fetchEvents();
    } catch (error) {
      console.error('Failed to add event:', error);
    }
  };

  const handleCompleteEvent = async (eventId) => {
    try {
      await axios.patch(`/api/timeline/${eventId}/complete`);
      fetchEvents();
    } catch (error) {
      console.error('Failed to complete event:', error);
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case 'EXAM':
        return BookOpen;
      case 'ADMISSION':
        return Award;
      case 'SCHOLARSHIP':
        return Award;
      case 'DEADLINE':
        return AlertCircle;
      case 'COUNSELING':
        return Users;
      case 'RESULT':
        return CheckCircle;
      default:
        return Calendar;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'EXAM':
        return 'error';
      case 'ADMISSION':
        return 'primary';
      case 'SCHOLARSHIP':
        return 'success';
      case 'DEADLINE':
        return 'warning';
      case 'COUNSELING':
        return 'accent';
      case 'RESULT':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const getEventTypeLabel = (type) => {
    switch (type) {
      case 'EXAM':
        return 'Exam';
      case 'ADMISSION':
        return 'Admission';
      case 'SCHOLARSHIP':
        return 'Scholarship';
      case 'DEADLINE':
        return 'Deadline';
      case 'COUNSELING':
        return 'Counseling';
      case 'RESULT':
        return 'Result';
      default:
        return type;
    }
  };

  const isEventUpcoming = (eventDate) => {
    return new Date(eventDate) >= new Date();
  };

  const getDaysUntilEvent = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'upcoming')
      return (
        matchesSearch && isEventUpcoming(event.eventDate) && !event.isCompleted
      );
    if (filter === 'completed') return matchesSearch && event.isCompleted;
    return matchesSearch && event.type === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              Academic Timeline
            </h1>
            <p className="text-lg text-neutral-600">
              Stay on top of important dates, exams, and deadlines
            </p>
          </div>

          <button
            onClick={() => setShowAddEvent(true)}
            className="btn-primary mt-4 lg:mt-0 inline-flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">
              {categorizedEvents.upcoming?.length || 0}
            </div>
            <div className="text-sm text-neutral-600">Upcoming Events</div>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-warning-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">
              {categorizedEvents.reminders?.length || 0}
            </div>
            <div className="text-sm text-neutral-600">Active Reminders</div>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-6 w-6 text-success-600" />
            </div>
            <div className="text-2xl font-bold text-neutral-900 mb-1">
              {categorizedEvents.past?.length || 0}
            </div>
            <div className="text-sm text-neutral-600">Completed</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10"
              />
            </div>

            <div className="flex space-x-2">
              {[
                'all',
                'upcoming',
                'completed',
                'EXAM',
                'ADMISSION',
                'SCHOLARSHIP',
                'DEADLINE',
              ].map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    filter === filterType
                      ? 'bg-primary-100 text-primary-700 border border-primary-200'
                      : 'bg-white text-neutral-600 hover:bg-neutral-50 border border-neutral-200'
                  }`}
                >
                  {filterType === 'all'
                    ? 'All'
                    : filterType === 'upcoming'
                      ? 'Upcoming'
                      : filterType === 'completed'
                        ? 'Completed'
                        : getEventTypeLabel(filterType)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Events Timeline */}
        <div className="space-y-6">
          {filteredEvents.map((event) => {
            const Icon = getEventIcon(event.type);
            const color = getEventColor(event.type);
            const daysUntil = getDaysUntilEvent(event.eventDate);
            const isUpcoming = isEventUpcoming(event.eventDate);
            const isUrgent = daysUntil <= 7 && daysUntil >= 0;

            return (
              <div
                key={event.id}
                className={`card p-6 ${isUrgent && !event.isCompleted ? 'border-warning-200 bg-warning-50' : ''} ${
                  event.isCompleted ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div
                    className={`p-3 rounded-xl bg-${color}-100 flex-shrink-0`}
                  >
                    <Icon className={`h-6 w-6 text-${color}-600`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${event.isCompleted ? 'line-through text-neutral-500' : 'text-neutral-900'}`}
                        >
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-neutral-600 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full bg-${color}-100 text-${color}-700`}
                        >
                          {getEventTypeLabel(event.type)}
                        </span>
                        {event.isCompleted && (
                          <CheckCircle className="h-5 w-5 text-success-500" />
                        )}
                      </div>
                    </div>

                    {/* Date and Time Info */}
                    <div className="flex items-center space-x-6 text-sm text-neutral-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(event.eventDate).toLocaleDateString()}
                        </span>
                      </div>

                      {isUpcoming && !event.isCompleted && (
                        <div
                          className={`flex items-center space-x-1 ${isUrgent ? 'text-warning-600 font-medium' : ''}`}
                        >
                          <Clock className="h-4 w-4" />
                          <span>
                            {daysUntil === 0
                              ? 'Today'
                              : daysUntil === 1
                                ? 'Tomorrow'
                                : daysUntil > 0
                                  ? `${daysUntil} days left`
                                  : `${Math.abs(daysUntil)} days ago`}
                          </span>
                        </div>
                      )}

                      {event.reminderDate && !event.isCompleted && (
                        <div className="flex items-center space-x-1">
                          <Bell className="h-4 w-4" />
                          <span>
                            Reminder:{' '}
                            {new Date(event.reminderDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    {event.metadata && (
                      <div className="bg-neutral-50 rounded-lg p-3 mb-4">
                        {event.metadata.website && (
                          <a
                            href={event.metadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 text-sm"
                          >
                            <span>Official Website</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {event.metadata.eligibility && (
                          <p className="text-sm text-neutral-600 mt-1">
                            <span className="font-medium">Eligibility:</span>{' '}
                            {event.metadata.eligibility}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      {!event.isCompleted && event.userId && (
                        <button
                          onClick={() => handleCompleteEvent(event.id)}
                          className="flex items-center space-x-1 text-success-600 hover:text-success-700 text-sm font-medium"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Mark Complete</span>
                        </button>
                      )}

                      {event.userId && (
                        <>
                          <button className="flex items-center space-x-1 text-neutral-600 hover:text-neutral-700 text-sm">
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </button>
                          <button className="flex items-center space-x-1 text-error-600 hover:text-error-700 text-sm">
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No events found
            </h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm || filter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first event to get started'}
            </p>
            <button
              onClick={() => setShowAddEvent(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </button>
          </div>
        )}

        {/* Add Event Modal */}
        {showAddEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Add New Event
              </h2>

              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <label htmlFor="eventTitle" className="block text-sm font-medium text-neutral-700 mb-2">
                    Event Title
                  </label>
                  <input
                    type="text"
                    id="eventTitle"
                    required
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="input-modern"
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <label htmlFor="eventDescription" className="block text-sm font-medium text-neutral-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="eventDescription"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="input-modern resize-none"
                    rows="3"
                    placeholder="Enter event description"
                  />
                </div>

                <div>
                  <label htmlFor="eventType" className="block text-sm font-medium text-neutral-700 mb-2">
                    Event Type
                  </label>
                  <select
                    id="eventType"
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent((prev) => ({ ...prev, type: e.target.value }))
                    }
                    className="input-modern"
                  >
                    <option value="EXAM">Exam</option>
                    <option value="ADMISSION">Admission</option>
                    <option value="SCHOLARSHIP">Scholarship</option>
                    <option value="DEADLINE">Deadline</option>
                    <option value="COUNSELING">Counseling</option>
                    <option value="RESULT">Result</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="eventDate" className="block text-sm font-medium text-neutral-700 mb-2">
                    Event Date
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    required
                    value={newEvent.eventDate}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        eventDate: e.target.value,
                      }))
                    }
                    className="input-modern"
                  />
                </div>

                <div>
                  <label htmlFor="reminderDate" className="block text-sm font-medium text-neutral-700 mb-2">
                    Reminder Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="reminderDate"
                    value={newEvent.reminderDate}
                    onChange={(e) =>
                      setNewEvent((prev) => ({
                        ...prev,
                        reminderDate: e.target.value,
                      }))
                    }
                    className="input-modern"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary flex-1">
                    Add Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;

