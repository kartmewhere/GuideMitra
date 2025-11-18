import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  MessageCircle,
  User,
  LogOut,
  Brain,
  Bell,
  Settings,
  ChevronDown,
  Menu,
  X,
  Target,
  MapPin,
  Calendar,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'primary' },
    { name: 'AI Chat', href: '/chat', icon: MessageCircle, color: 'accent' },
    {
      name: 'Assessments',
      href: '/assessments',
      icon: Target,
      color: 'success',
    },
    { name: 'Colleges', href: '/colleges', icon: MapPin, color: 'warning' },
    { name: 'Timeline', href: '/timeline', icon: Calendar, color: 'error' },
    { name: 'Profile', href: '/profile', icon: User, color: 'neutral' },
  ];

  const isActive = (path) => location.pathname === path;

  /*  const getActiveColor = () => {
    const activeNav = navigation.find(nav => isActive(nav.href));
    return activeNav?.color || 'primary';
  };*/

  return (
    <nav className="glass border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="relative">
                <Brain className="h-9 w-9 text-primary-600 group-hover:text-primary-700 transition-colors duration-200" />
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-accent-500 rounded-full opacity-0 group-hover:opacity-20 blur transition-opacity duration-200"></div>
              </div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold gradient-text">
                  GuideMitra
                </span>
                <div className="text-xs text-neutral-500 font-medium">
                  AI Career Companion
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    active
                      ? `text-${item.color}-700 bg-${item.color}-50 shadow-soft`
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${active ? `text-${item.color}-600` : 'text-neutral-500 group-hover:text-neutral-700'} transition-colors duration-200`}
                  />
                  <span>{item.name}</span>
                  {active && (
                    <div
                      className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-${item.color}-500 rounded-full`}
                    ></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-white/60 rounded-xl transition-all duration-200">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full text-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/60 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-neutral-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-neutral-500">Student</div>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-neutral-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-large border border-white/20 py-2 animate-slide-down">
                  <div className="px-4 py-3 border-b border-neutral-100">
                    <div className="text-sm font-medium text-neutral-900">
                      {user?.name}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {user?.email}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile Settings</span>
                  </Link>

                  <button className="flex items-center space-x-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors duration-200 w-full text-left">
                    <Settings className="h-4 w-4" />
                    <span>Preferences</span>
                  </button>

                  <div className="border-t border-neutral-100 mt-2 pt-2">
                    <button
                      onClick={logout}
                      className="flex items-center space-x-3 px-4 py-3 text-sm text-error-600 hover:bg-error-50 transition-colors duration-200 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-white/60 rounded-xl transition-all duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20 animate-slide-down">
            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      active
                        ? `text-${item.color}-700 bg-${item.color}-50`
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/60'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${active ? `text-${item.color}-600` : 'text-neutral-500'}`}
                    />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

