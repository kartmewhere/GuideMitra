import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Send,
  MessageCircle,
  Heart,
  User,
  Bot,
  Sparkles,
  Mic,
  Paperclip,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
  Target,
  GraduationCap,
  Briefcase,
} from 'lucide-react';

const Chat = () => {
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [chatType, setChatType] = useState('GENERAL');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const sessionId = searchParams.get('session');
  const typeParam = searchParams.get('type');

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
    if (typeParam) {
      setChatType(typeParam.toUpperCase());
    }
  }, [sessionId, typeParam]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async (id) => {
    try {
      const response = await axios.get(`/api/chat/sessions/${id}`);
      setCurrentSession(response.data);
      setMessages(response.data.messages);
      setChatType(response.data.type);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      role: 'USER',
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);
    setIsTyping(true);

    try {
      const response = await axios.post('/api/chat/message', {
        message: inputMessage,
        sessionId: currentSession?.id,
        type: chatType,
      });

      setCurrentSession((prev) => ({ ...prev, id: response.data.sessionId }));

      // Simulate typing delay for better UX
      setTimeout(() => {
        setMessages((prev) => [...prev, response.data.message]);
        setIsTyping(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ASSISTANT',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsTyping(false);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const chatTypes = [
    {
      value: 'GENERAL',
      label: 'General Chat',
      icon: MessageCircle,
      color: 'primary',
      description: 'Ask anything about your education journey',
    },
    {
      value: 'CAREER',
      label: 'Career Guidance',
      icon: Briefcase,
      color: 'success',
      description: 'Get personalized career recommendations',
    },
    {
      value: 'ACADEMIC',
      label: 'Course Mapping',
      icon: GraduationCap,
      color: 'accent',
      description: 'Explore degree programs and subjects',
    },
    {
      value: 'MENTAL_WELLNESS',
      label: 'Wellness Support',
      icon: Heart,
      color: 'error',
      description: 'Mental health and stress management',
    },
  ];

  const getTypeConfig = (type) => {
    return chatTypes.find((t) => t.value === type) || chatTypes[0];
  };

  const currentTypeConfig = getTypeConfig(chatType);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatAIMessage = (content) => {
    // Handle code blocks first
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index),
        });
      }
      // Add code block
      parts.push({ type: 'code', content: match[1].trim() });
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }

    // If no code blocks found, treat entire content as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    const elements = [];
    let elementKey = 0;

    parts.forEach((part, partIndex) => {
      if (part.type === 'code') {
        elements.push(
          <div
            key={`code-${partIndex}`}
            className="my-4 bg-neutral-900 text-green-400 p-4 rounded-lg overflow-x-auto"
          >
            <pre className="text-sm font-mono whitespace-pre-wrap">
              <code>{part.content}</code>
            </pre>
          </div>
        );
      } else {
        const lines = part.content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmedLine = line.trim();

          // Skip empty lines
          if (trimmedLine === '') {
            elements.push(
              <div key={`empty-${elementKey++}`} className="h-2" />
            );
            continue;
          }

          // Handle numbered lists (1., 2., etc.)
          if (/^\d+\.\s/.test(trimmedLine)) {
            const number = trimmedLine.match(/^\d+/)[0];
            const text = trimmedLine.replace(/^\d+\.\s*/, '');
            elements.push(
              <div
                key={`numbered-${elementKey++}`}
                className="flex items-start space-x-3 my-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
              >
                <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {number}
                </div>
                <div className="flex-1 text-sm">
                  {formatTextWithEmphasis(text)}
                </div>
              </div>
            );
            continue;
          }

          // Handle bullet points (•, -, *)
          if (/^[•\-\*]\s/.test(trimmedLine)) {
            const text = trimmedLine.replace(/^[•\-\*]\s*/, '');
            elements.push(
              <div
                key={`bullet-${elementKey++}`}
                className="flex items-start space-x-3 my-2 p-2 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 text-sm">
                  {formatTextWithEmphasis(text)}
                </div>
              </div>
            );
            continue;
          }

          // Handle headers (lines ending with : or **text**)
          if (
            (trimmedLine.endsWith(':') && trimmedLine.length < 100) ||
            (trimmedLine.startsWith('**') &&
              trimmedLine.endsWith('**') &&
              !trimmedLine.includes(' '))
          ) {
            const headerText = trimmedLine
              .replace(/^\*\*|\*\*$/g, '')
              .replace(/:$/, '');
            elements.push(
              // eslint-disable-next-line security/detect-object-injection
              <div key={`header-${elementKey++}`} className="mt-6 mb-3">
                <h4 className="font-bold text-neutral-800 text-base bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent border-b-2 border-blue-200 pb-1">
                  {headerText}
                </h4>
              </div>
            );
            continue;
          }

          // Regular paragraphs
          elements.push(
            <p
              key={`para-${elementKey++}`}
              className="mb-3 last:mb-0 leading-relaxed text-sm text-neutral-700"
            >
              {formatTextWithEmphasis(trimmedLine)}
            </p>
          );
        }
      }
    });

    return elements;
  };

  const formatTextWithEmphasis = (text) => {
    // Remove excessive asterisks and clean up formatting
    // eslint-disable-next-line no-useless-escape
    let cleaned = text.replace(/\*{3,}/g, '**'); // Replace *** with **
    cleaned = cleaned.replace(
      /\*\*([^*]+)\*\*/g,
      '<strong class="font-semibold text-neutral-900 bg-blue-50 px-1 rounded">$1</strong>'
    );
    // eslint-disable-next-line no-useless-escape
    cleaned = cleaned.replace(
      /\*([^*]+)\*/g,
      '<em class="italic text-blue-700 font-medium">$1</em>'
    );

    // Handle inline code (`code`)
    cleaned = cleaned.replace(
      /`(.*?)`/g,
      '<code class="bg-neutral-100 text-neutral-800 px-2 py-1 rounded text-sm font-mono border">$1</code>'
    );

    // Handle links [text](url)
    cleaned = cleaned.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Handle parenthetical information
    cleaned = cleaned.replace(
      /\(([^)]+)\)/g,
      '<span class="text-neutral-600 text-sm">($1)</span>'
    );

    return <span dangerouslySetInnerHTML={{ __html: cleaned }} />;
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-neutral-50 via-white to-primary-50/30">
      {/* Enhanced Header */}
      <div className="glass border-b border-white/20 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div
                className={`p-3 rounded-2xl bg-gradient-to-br from-${currentTypeConfig.color}-500 to-${currentTypeConfig.color}-600 shadow-soft`}
              >
                <currentTypeConfig.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">
                  {currentTypeConfig.label}
                </h1>
                <p className="text-sm text-neutral-600">
                  {currentTypeConfig.description}
                </p>
              </div>
            </div>

            {/* Chat Type Selector */}
            <div className="flex flex-wrap gap-2">
              {chatTypes.map((type) => {
                const Icon = type.icon;
                const isActive = chatType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() => setChatType(type.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `bg-${type.color}-100 text-${type.color}-700 border border-${type.color}-200 shadow-soft`
                        : 'bg-white/60 text-neutral-600 hover:bg-white hover:text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto scrollbar-modern">
        <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-4 float">
                  <Sparkles className="h-10 w-10 text-primary-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent-500 rounded-full animate-pulse"></div>
              </div>

              <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                Welcome to GuideMitra AI
              </h3>
              <p className="text-lg text-neutral-600 mb-8 max-w-md mx-auto">
                Your intelligent companion for career guidance, course
                recommendations, and wellness support.
              </p>

              {/* Enhanced Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {[
                  {
                    text: 'What career suits my interests in technology?',
                    icon: Briefcase,
                    color: 'success',
                  },
                  {
                    text: 'Which engineering branch should I choose?',
                    icon: GraduationCap,
                    color: 'accent',
                  },
                  {
                    text: 'How to manage exam stress effectively?',
                    icon: Heart,
                    color: 'error',
                  },
                  {
                    text: 'What are the best colleges near me?',
                    icon: Target,
                    color: 'warning',
                  },
                ].map((suggestion, index) => {
                  const Icon = suggestion.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => setInputMessage(suggestion.text)}
                      className="card-interactive p-6 text-left group"
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={`p-3 rounded-xl transition-colors duration-200 ${
                            suggestion.color === 'success'
                              ? 'bg-green-100 group-hover:bg-green-200'
                              : suggestion.color === 'accent'
                                ? 'bg-purple-100 group-hover:bg-purple-200'
                                : suggestion.color === 'error'
                                  ? 'bg-red-100 group-hover:bg-red-200'
                                  : suggestion.color === 'warning'
                                    ? 'bg-yellow-100 group-hover:bg-yellow-200'
                                    : 'bg-blue-100 group-hover:bg-blue-200'
                          }`}
                        >
                          <Icon
                            className={`h-5 w-5 ${
                              suggestion.color === 'success'
                                ? 'text-green-600'
                                : suggestion.color === 'accent'
                                  ? 'text-purple-600'
                                  : suggestion.color === 'error'
                                    ? 'text-red-600'
                                    : suggestion.color === 'warning'
                                      ? 'text-yellow-600'
                                      : 'text-blue-600'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-neutral-700 group-hover:text-neutral-900 transition-colors duration-200">
                            {suggestion.text}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  <div
                    className={`flex items-start space-x-4 max-w-2xl ${
                      message.role === 'USER'
                        ? 'flex-row-reverse space-x-reverse'
                        : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-soft ${
                        message.role === 'USER'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : currentTypeConfig.color === 'success'
                            ? 'bg-gradient-to-br from-green-500 to-green-600'
                            : currentTypeConfig.color === 'error'
                              ? 'bg-gradient-to-br from-red-500 to-red-600'
                              : currentTypeConfig.color === 'warning'
                                ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}
                    >
                      {message.role === 'USER' ? (
                        <User className="h-5 w-5 text-white" />
                      ) : (
                        <Bot className="h-5 w-5 text-white" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`relative group ${
                        message.role === 'USER' ? 'ml-12' : 'mr-12'
                      }`}
                    >
                      <div
                        className={`px-6 py-4 rounded-2xl shadow-soft ${
                          message.role === 'USER'
                            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                            : 'bg-white border border-neutral-200 text-neutral-900'
                        }`}
                      >
                        {message.role === 'ASSISTANT' ? (
                          <div className="prose prose-sm max-w-none">
                            <div className="text-sm leading-relaxed">
                              {formatAIMessage(message.content)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        )}
                      </div>

                      {/* Message Actions */}
                      {message.role === 'ASSISTANT' && (
                        <div className="flex items-center space-x-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
                            title="Copy message"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200">
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p
                        className={`text-xs mt-2 ${
                          message.role === 'USER'
                            ? 'text-right text-primary-200'
                            : 'text-neutral-500'
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex items-start space-x-4 max-w-2xl">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-soft bg-gradient-to-br from-${currentTypeConfig.color}-500 to-${currentTypeConfig.color}-600`}
                >
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="px-6 py-4 rounded-2xl bg-white border border-neutral-200 shadow-soft">
                  <div className="flex items-center space-x-2">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="text-sm text-neutral-500 ml-2">
                      GuideMitra is typing...
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="glass border-t border-white/20 p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-4">
            {/* Attachment Button */}
            <button className="p-3 text-neutral-500 hover:text-neutral-700 hover:bg-white/60 rounded-xl transition-all duration-200">
              <Paperclip className="h-5 w-5" />
            </button>

            {/* Input Field */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentTypeConfig.label.toLowerCase()}...`}
                className="w-full px-6 py-4 bg-white border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none shadow-soft transition-all duration-200 placeholder:text-neutral-400"
                rows="1"
                disabled={loading}
                style={{ minHeight: '56px', maxHeight: '120px' }}
              />

              {/* Character count or suggestions */}
              {inputMessage.length > 0 && (
                <div className="absolute bottom-2 right-4 text-xs text-neutral-400">
                  {inputMessage.length}/500
                </div>
              )}
            </div>

            {/* Voice Input Button */}
            <button className="p-3 text-neutral-500 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-all duration-200">
              <Mic className="h-5 w-5" />
            </button>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              className={`p-3 rounded-xl shadow-soft transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                inputMessage.trim() && !loading
                  ? `bg-gradient-to-r from-${currentTypeConfig.color}-500 to-${currentTypeConfig.color}-600 text-white hover:shadow-glow`
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex space-x-2">
              <button className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white/60 hover:bg-white rounded-lg border border-neutral-200 transition-all duration-200">
                <Zap className="h-3 w-3" />
                <span>Quick Start</span>
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-white/60 hover:bg-white rounded-lg border border-neutral-200 transition-all duration-200">
                <Target className="h-3 w-3" />
                <span>Examples</span>
              </button>
            </div>

            <div className="text-xs text-neutral-500">
              Powered by AI • Always learning
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

