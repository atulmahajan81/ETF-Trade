import React, { useState } from 'react';
import { User, Lock, Key, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import pythonPriceApiService from '../services/pythonPriceApi';

const SimpleLoginForm = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    apiKey: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [requestToken, setRequestToken] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus(null);

    try {
      console.log('🔐 Starting MStocks login process...');
      
      if (!showOtpInput) {
        // Step 1: Login with username/password
        console.log('1️⃣ Step 1: Login with username/password...');
        const loginResult = await pythonPriceApiService.login(
          credentials.username, 
          credentials.password
        );

                 console.log('🔍 Login response:', loginResult);
         console.log('🔍 Login response.data:', loginResult.data);
         console.log('🔍 Login response.data keys:', Object.keys(loginResult.data || {}));
         console.log('🔍 Login response.data values:', loginResult.data);
         
         if (loginResult.status !== 'success') {
           throw new Error(loginResult.message || 'Login failed');
         }

                 // Handle different possible response structures
         const token = loginResult.data?.request_token || 
                      loginResult.request_token || 
                      loginResult.data?.token ||
                      loginResult.token ||
                      loginResult.data?.access_token ||
                      loginResult.access_token ||
                      loginResult.data?.session_token ||
                      loginResult.session_token ||
                      loginResult.data?.auth_token ||
                      loginResult.auth_token ||
                      loginResult.data?.user_token ||
                      loginResult.user_token ||
                      loginResult.data?.login_token ||
                      loginResult.login_token ||
                      loginResult.data?.verification_token ||
                      loginResult.verification_token ||
                      loginResult.data?.otp_token ||
                      loginResult.otp_token ||
                      loginResult.data?.ugid ||  // New MStocks API format
                      loginResult.ugid;          // New MStocks API format
         
         if (!token) {
           console.error('Login response structure:', loginResult);
           console.error('All fields in loginResult.data:');
           if (loginResult.data) {
             Object.keys(loginResult.data).forEach(key => {
               console.error(`- loginResult.data.${key}:`, loginResult.data[key]);
             });
           }
           console.error('Checking all possible token locations:');
           console.error('- loginResult.data?.request_token:', loginResult.data?.request_token);
           console.error('- loginResult.request_token:', loginResult.request_token);
           console.error('- loginResult.data?.token:', loginResult.data?.token);
           console.error('- loginResult.token:', loginResult.token);
           console.error('- loginResult.data?.access_token:', loginResult.data?.access_token);
           console.error('- loginResult.access_token:', loginResult.access_token);
           console.error('- loginResult.data?.session_token:', loginResult.data?.session_token);
           console.error('- loginResult.session_token:', loginResult.session_token);
           console.error('- loginResult.data?.auth_token:', loginResult.data?.auth_token);
           console.error('- loginResult.auth_token:', loginResult.auth_token);
           console.error('- loginResult.data?.user_token:', loginResult.data?.user_token);
           console.error('- loginResult.data?.login_token:', loginResult.data?.login_token);
           console.error('- loginResult.data?.verification_token:', loginResult.data?.verification_token);
           console.error('- loginResult.data?.otp_token:', loginResult.data?.otp_token);
           console.error('- loginResult.data?.ugid:', loginResult.data?.ugid);
           console.error('- loginResult.ugid:', loginResult.ugid);
           throw new Error('No request token received from login. Please check your credentials.');
         }

        console.log('✅ Step 1 successful! Request token received.');
        setRequestToken(token);
        setShowOtpInput(true);
        setStatus({
          type: 'success',
          message: 'OTP sent to your mobile! Please enter the OTP to continue.'
        });
        return;
      } else {
                          // Step 2: Generate session with API key and OTP
                  console.log('2️⃣ Step 2: Generate session with API key and OTP...');
                  const sessionResult = await pythonPriceApiService.generateSession(
                    credentials.apiKey,
                    requestToken,  // This will be ignored, OTP will be used as request_token
                    otp
                  );

        if (sessionResult.status !== 'success') {
          throw new Error(sessionResult.message || 'Session generation failed');
        }

        console.log('✅ Step 2 successful! Session generated.');

        // Verify session is active
        const sessionStatus = await pythonPriceApiService.getSessionStatus();
        if (sessionStatus.logged_in && sessionStatus.session_valid) {
          setStatus({
            type: 'success',
            message: 'Successfully logged in to MStocks! Session is active.',
            sessionData: sessionStatus
          });

          if (onLoginSuccess) {
            onLoginSuccess({
              broker: 'MStocks',
              username: credentials.username,
              sessionStatus: sessionStatus
            });
          }
          
          // Reset OTP state
          setShowOtpInput(false);
          setOtp('');
          setRequestToken('');
        } else {
          throw new Error('Session verification failed');
        }
      }

    } catch (error) {
      console.error('❌ Login failed:', error);
      setStatus({
        type: 'error',
        message: `Login failed: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      setIsLoading(true);
      await pythonPriceApiService.clearSession();
      setStatus({
        type: 'success',
        message: 'Session cleared successfully!'
      });
      setCredentials({ username: '', password: '', apiKey: '' });
    } catch (error) {
      setStatus({
        type: 'error',
        message: `Failed to clear session: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center mb-6">
        <LogIn className="w-6 h-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">MStocks Login</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            <User className="w-4 h-4 inline mr-1" />
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={credentials.username}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your MStocks username"
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            <Lock className="w-4 h-4 inline mr-1" />
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={credentials.password}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your MStocks password"
          />
        </div>

                 {/* API Key */}
         <div>
           <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-1">
             <Key className="w-4 h-4 inline mr-1" />
             API Key
           </label>
           <input
             type="password"
             id="apiKey"
             name="apiKey"
             value={credentials.apiKey}
             onChange={handleInputChange}
             required
             className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
             placeholder="Enter your MStocks API key"
           />
         </div>

         {/* OTP Input - Show only after initial login */}
         {showOtpInput && (
           <div>
             <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
               <Key className="w-4 h-4 inline mr-1" />
               OTP (Sent to Mobile)
             </label>
                           <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                maxLength="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter 3-digit OTP"
              />
           </div>
         )}

        {/* Status Message */}
        {status && (
          <div className={`p-3 rounded-md ${
            status.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {status.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              )}
              <span className={`text-sm ${
                status.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {status.message}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
                     <button
             type="submit"
             disabled={isLoading || !credentials.username || !credentials.password || !credentials.apiKey || (showOtpInput && !otp)}
             className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isLoading ? (
               <>
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                 {showOtpInput ? 'Verifying OTP...' : 'Logging in...'}
               </>
             ) : (
               <>
                 <LogIn className="w-4 h-4 mr-2" />
                 {showOtpInput ? 'Verify OTP & Complete Login' : 'Login to MStocks'}
               </>
             )}
           </button>

                     {showOtpInput ? (
             <button
               type="button"
               onClick={() => {
                 setShowOtpInput(false);
                 setOtp('');
                 setRequestToken('');
                 setStatus(null);
               }}
               disabled={isLoading}
               className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Back
             </button>
           ) : (
             <button
               type="button"
               onClick={handleClearSession}
               disabled={isLoading}
               className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               Clear Session
             </button>
           )}
        </div>
      </form>

      {/* Session Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">How it works:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Enter your MStocks credentials above</li>
          <li>• Click "Login to MStocks" to authenticate</li>
          <li>• Python backend handles all MStocks API calls</li>
          <li>• Session is stored securely in the backend</li>
          <li>• Live prices will be fetched automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleLoginForm; 