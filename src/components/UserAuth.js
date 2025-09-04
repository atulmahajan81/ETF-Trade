import React, { useState } from 'react';
import { User, Phone, LogIn, UserPlus, AlertCircle } from 'lucide-react';

const UserAuth = ({ onLogin, onSignup }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    username: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      // For new users, only validate name and mobile
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }

      if (!formData.mobile.trim()) {
        newErrors.mobile = 'Mobile number is required';
      } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ''))) {
        newErrors.mobile = 'Please enter a valid 10-digit mobile number';
      }
    } else {
      // For existing users, validate username/email and password
      if (!formData.username.trim() && !formData.email.trim()) {
        newErrors.username = 'Username or email is required';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      if (isLogin) {
        // Handle existing user login
        await onLogin({
          username: formData.username || formData.email,
          email: formData.email,
          uid: formData.username || formData.email,
          isExistingUser: true
        });
        
      } else {
        // Handle new user signup - just capture name and mobile
        const userData = {
          name: formData.name,
          mobile: formData.mobile,
          username: formData.mobile, // Use mobile as username
          email: `${formData.mobile}@etfapp.local`, // Generate email from mobile
          uid: formData.mobile,
          isNewUser: true,
          // Set default values for immediate dashboard access
          hasETFTradingExperience: true,
          initialCapital: '600000', // Default ₹6 lakh
          tradingAmount: '12000' // Default ₹12k daily
        };
        
        await onSignup(userData);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      mobile: '',
      username: '',
      email: '',
      password: ''
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-upstox-primary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="card-upstox-elevated p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto h-12 w-12 bg-accent-blue rounded-full flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-upstox-primary">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="mt-2 text-sm text-upstox-secondary">
              {isLogin 
                ? 'Sign in to your ETF Trading account' 
                : 'Join us to start your ETF trading journey'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-negative bg-opacity-10 border border-negative border-opacity-30 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-negative" />
                  <div className="ml-3">
                    <p className="text-sm text-upstox-primary">{errors.general}</p>
                  </div>
                </div>
              </div>
            )}

            {/* New User Fields */}
            {!isLogin && (
              <>
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-upstox-primary mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-upstox-muted" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`input-upstox ${errors.name ? 'border-negative' : ''}`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-negative">{errors.name}</p>
                  )}
                </div>

                {/* Mobile */}
                <div>
                  <label htmlFor="mobile" className="block text-sm font-medium text-upstox-primary mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-upstox-muted" />
                    </div>
                    <input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, ''))}
                      className={`input-upstox ${errors.mobile ? 'border-negative' : ''}`}
                      placeholder="Enter your 10-digit mobile number"
                      maxLength="10"
                    />
                  </div>
                  {errors.mobile && (
                    <p className="mt-1 text-sm text-negative">{errors.mobile}</p>
                  )}
                </div>
              </>
            )}

            {/* Existing User Fields */}
            {isLogin && (
              <>
                {/* Username/Email */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-upstox-primary mb-2">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-upstox-muted" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={formData.username || formData.email}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.includes('@')) {
                          handleInputChange('email', value);
                          handleInputChange('username', '');
                        } else {
                          handleInputChange('username', value);
                          handleInputChange('email', '');
                        }
                      }}
                      className={`input-upstox ${errors.username ? 'border-negative' : ''}`}
                      placeholder="Enter your username or email"
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-1 text-sm text-negative">{errors.username}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-upstox-primary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-upstox-muted" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`input-upstox ${errors.password ? 'border-negative' : ''}`}
                      placeholder="Enter your password"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-negative">{errors.password}</p>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-blue hover:bg-accent-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-blue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  <div className="flex items-center">
                    {isLogin ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </div>
                )}
              </button>
            </div>

            {/* Toggle Mode */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-accent-blue hover:text-accent-blue-dark font-medium"
              >
                {isLogin 
                  ? "Don't have an account? Create one" 
                  : "Already have an account? Sign in"
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;