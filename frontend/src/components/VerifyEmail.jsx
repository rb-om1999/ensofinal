import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, XCircle, Mail, ArrowLeft } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for the correct link.');
        return;
      }

      try {
        const response = await axios.get(`${API}/auth/verify?token=${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.detail || 'Verification failed. Please try again.');
      }
    };

    verifyToken();
  }, [token]);

  const handleBackToLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-stone-900 text-white relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-orange-900/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-500/5 to-transparent transform rotate-12 -translate-y-1/2"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
      
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full flex items-center justify-center ring-1 ring-white/10">
              {status === 'verifying' && <Mail className="w-8 h-8 text-amber-400 animate-pulse" />}
              {status === 'success' && <CheckCircle className="w-8 h-8 text-green-400" />}
              {status === 'error' && <XCircle className="w-8 h-8 text-red-400" />}
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {status === 'verifying' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {status === 'verifying' && (
                <div>
                  <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-slate-300">Please wait while we verify your email address...</p>
                </div>
              )}
              
              {status === 'success' && (
                <div className="space-y-4">
                  <p className="text-slate-200 leading-relaxed">{message}</p>
                  <Alert className="border-green-400/50 bg-green-500/10 text-green-200">
                    <AlertDescription>
                      Your account has been successfully verified! You can now log in and start analyzing trading charts.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {status === 'error' && (
                <div className="space-y-4">
                  <Alert className="border-red-400/50 bg-red-500/10 text-red-200">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                  <p className="text-slate-300 text-sm">
                    If you continue to have issues, please try registering again or contact support.
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <Button
                onClick={handleBackToLogin}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold px-6 py-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {status === 'success' ? 'Go to Login' : 'Back to Home'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;