import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Search,
  MapPin,
  Star,
  GraduationCap,
  Building,
  Calendar,
  ChevronRight,
  ExternalLink,
  Heart,
  BookOpen,
} from 'lucide-react';

const Colleges = () => {
  const [colleges, setColleges] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    state: '',
    program: '',
  });
  const [states, setStates] = useState({});
  const [programs, setPrograms] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);

  useEffect(() => {
    fetchColleges();
    fetchMetadata();
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = colleges;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (college) =>
          college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          college.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          college.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter((college) => college.type === filters.type);
    }

    // State filter
    if (filters.state) {
      filtered = filtered.filter((college) => college.state === filters.state);
    }

    // Program filter
    if (filters.program) {
      filtered = filtered.filter((college) =>
        college.programs.includes(filters.program)
      );
    }

    setFilteredColleges(filtered);
  }, [colleges, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchColleges = async () => {
    try {
      const response = await axios.get('/api/colleges');
      setColleges(response.data.colleges);
    } catch (error) {
      console.error('Failed to fetch colleges:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [statesResponse, programsResponse] = await Promise.all([
        axios.get('/api/colleges/meta/locations'),
        axios.get('/api/colleges/meta/programs'),
      ]);
      setStates(statesResponse.data.states);
      setPrograms(programsResponse.data.programs);
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({ type: '', state: '', program: '' });
    setSearchTerm('');
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'GOVERNMENT':
        return 'success';
      case 'PRIVATE':
        return 'primary';
      case 'AUTONOMOUS':
        return 'warning';
      case 'DEEMED':
        return 'accent';
      default:
        return 'neutral';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'GOVERNMENT':
        return 'Government';
      case 'PRIVATE':
        return 'Private';
      case 'AUTONOMOUS':
        return 'Autonomous';
      case 'DEEMED':
        return 'Deemed University';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  // College detail modal
  if (selectedCollege) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-neutral-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  {selectedCollege.name}
                </h2>
                <div className="flex items-center space-x-4 text-neutral-600">
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {selectedCollege.city}, {selectedCollege.state}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Est. {selectedCollege.established}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCollege(null)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  College Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Type</span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full bg-${getTypeColor(selectedCollege.type)}-100 text-${getTypeColor(selectedCollege.type)}-700`}
                    >
                      {getTypeLabel(selectedCollege.type)}
                    </span>
                  </div>
                  {selectedCollege.rating && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Rating</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-warning-500 fill-current" />
                        <span className="font-medium">
                          {selectedCollege.rating}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedCollege.phone && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Phone</span>
                      <a
                        href={`tel:${selectedCollege.phone}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {selectedCollege.phone}
                      </a>
                    </div>
                  )}
                  {selectedCollege.website && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Website</span>
                      <a
                        href={selectedCollege.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-primary-600 hover:text-primary-700"
                      >
                        <span>Visit</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Programs */}
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Programs Offered
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {selectedCollege.programs.map((program, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-2 bg-neutral-50 rounded-lg"
                    >
                      <GraduationCap className="h-4 w-4 text-primary-600" />
                      <span className="text-neutral-700">{program}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facilities */}
              <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Facilities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedCollege.facilities.map((facility, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 p-3 bg-neutral-50 rounded-lg"
                    >
                      <Building className="h-4 w-4 text-accent-600" />
                      <span className="text-neutral-700 text-sm">
                        {facility}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex space-x-4">
              <button className="btn-primary flex-1">
                <Heart className="h-4 w-4 mr-2" />
                Add to Favorites
              </button>
              <button className="btn-secondary flex-1">
                <BookOpen className="h-4 w-4 mr-2" />
                View Admission Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            College Directory
          </h1>
          <p className="text-lg text-neutral-600">
            Discover government and private colleges across India with detailed
            information about programs and facilities.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="card p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search colleges, cities, or states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10"
              />
            </div>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input-modern"
            >
              <option value="">All Types</option>
              <option value="GOVERNMENT">Government</option>
              <option value="PRIVATE">Private</option>
              <option value="AUTONOMOUS">Autonomous</option>
              <option value="DEEMED">Deemed University</option>
            </select>

            {/* State Filter */}
            <select
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
              className="input-modern"
            >
              <option value="">All States</option>
              {Object.keys(states).map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-4">
              <select
                value={filters.program}
                onChange={(e) => handleFilterChange('program', e.target.value)}
                className="input-modern"
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">
                {filteredColleges.length} colleges found
              </span>
              {(searchTerm ||
                filters.type ||
                filters.state ||
                filters.program) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Colleges Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredColleges.map((college) => (
            <div key={college.id} className="card-interactive p-6 group">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`px-2 py-1 text-xs font-medium rounded-full bg-${getTypeColor(college.type)}-100 text-${getTypeColor(college.type)}-700`}
                >
                  {getTypeLabel(college.type)}
                </div>
                {college.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-warning-500 fill-current" />
                    <span className="text-sm font-medium">
                      {college.rating}
                    </span>
                  </div>
                )}
              </div>

              {/* College Info */}
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                {college.name}
              </h3>

              <div className="flex items-center space-x-1 text-neutral-600 mb-4">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {college.city}, {college.state}
                </span>
              </div>

              {/* Programs Preview */}
              <div className="mb-4">
                <p className="text-xs font-medium text-neutral-700 mb-2">
                  Programs Offered:
                </p>
                <div className="flex flex-wrap gap-1">
                  {college.programs.slice(0, 3).map((program, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md"
                    >
                      {program}
                    </span>
                  ))}
                  {college.programs.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-neutral-100 text-neutral-600 rounded-md">
                      +{college.programs.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              {/* Facilities Preview */}
              <div className="mb-6">
                <p className="text-xs font-medium text-neutral-700 mb-2">
                  Key Facilities:
                </p>
                <div className="flex items-center space-x-3 text-xs text-neutral-600">
                  {college.facilities.slice(0, 3).map((facility, index) => (
                    <div key={index} className="flex items-center space-x-1">
                      <Building className="h-3 w-3" />
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <div className="text-xs text-neutral-500">
                  Est. {college.established}
                </div>
                <button
                  onClick={() => setSelectedCollege(college)}
                  className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  <span>View Details</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredColleges.length === 0 && (
          <div className="text-center py-12">
            <Building className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              No colleges found
            </h3>
            <p className="text-neutral-600 mb-4">
              Try adjusting your search criteria or filters to find more
              colleges.
            </p>
            <button onClick={clearFilters} className="btn-primary">
              Clear All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Colleges;

