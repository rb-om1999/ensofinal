import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, TrendingUp, BarChart3, Brain, Target, Shield, DollarSign, User, LogOut, LogIn, Crown, Settings, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import axios from 'axios';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';
import ProfileSettings from './ProfileSettings';
import AnalysisHistory from './AnalysisHistory';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ChartAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('');
  const [tradingStyle, setTradingStyle] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [riskProfile, setRiskProfile] = useState('');
  const [balance, setBalance] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      fetchUserProfile();
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/user/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUserProfile(response.data);
      setRiskProfile(response.data.risk_profile || '');
      setBalance(response.data.balance || '');
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setAnalysis(null);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    fetchUserProfile();
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile && selectedFile.size <= 4 * 1024 * 1024) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('File size must be under 4MB');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Helper functions for user plan checking
  const isAdmin = user?.email === 'omsonii9846@gmail.com';
  const isPro = userProfile?.plan === 'pro' || isAdmin;

  const analyzeChart = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!file || !symbol || !timeframe) {
      setError('Please fill in all required fields and select a file');
      return;
    }

    // Check credits for free users
    if (!isAdmin && userProfile?.plan === 'free') {
      if (!userProfile?.credits_remaining || userProfile.credits_remaining <= 0) {
        setShowUpgradeModal(true);
        return;
      }
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const imageBase64 = await convertToBase64(file);
      
      const response = await axios.post(`${API}/analyze`, {
        imageBase64,
        symbol: symbol.toUpperCase(),
        timeframe,
        tradingStyle: tradingStyle || undefined,
        riskProfile: riskProfile || undefined,
        balance: balance || undefined
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setAnalysis(response.data);
      
      // Update user profile with new credits
      if (response.data.credits_remaining !== undefined) {
        setUserProfile(prev => ({
          ...prev,
          credits_remaining: response.data.credits_remaining
        }));
      }
    } catch (err) {
      console.error('Analysis error:', err);
      if (err.response?.status === 401) {
        handleLogout();
        setShowAuthModal(true);
        setError('Session expired. Please login again.');
      } else if (err.response?.status === 402) {
        // Insufficient credits - show upgrade modal
        setShowUpgradeModal(true);
        setError('');
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Analysis failed. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMovementColor = (movement) => {
    switch (movement?.toLowerCase()) {
      case 'bullish': return 'bg-green-500/20 text-green-300 border-green-500/50';
      case 'bearish': return 'bg-red-500/20 text-red-300 border-red-500/50';
      default: return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    }
  };

  const getActionColor = (action) => {
    switch (action?.toLowerCase()) {
      case 'buy': return 'bg-green-600 text-white hover:bg-green-700';
      case 'sell': return 'bg-red-600 text-white hover:bg-red-700';
      default: return 'bg-amber-600 text-white hover:bg-amber-700';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-red-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-stone-900 text-white relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-orange-900/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-500/5 to-transparent transform rotate-12 -translate-y-1/2"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}>")</div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl shadow-xl">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-amber-400/20">
                  <BarChart3 className="w-7 h-7 text-white drop-shadow-sm" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-sm">
                    EnsoTrade
                  </h1>
                  <p className="text-slate-300 text-sm font-medium">AI-Powered Chart Analysis</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                      <User className="w-4 h-4 text-amber-400" />
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{user.name}</span>
                        <div className="flex items-center gap-2 text-xs">
                          {isAdmin ? (
                            <span className="text-purple-400 font-medium">Admin</span>
                          ) : isPro ? (
                            <span className="text-amber-400 font-medium flex items-center gap-1">
                              <Crown className="w-3 h-3" />
                              Pro
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              {isAdmin || userProfile?.plan === 'pro' ? '∞' : (userProfile?.credits_remaining || 0)}/5 credits
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setShowProfileSettings(true)}
                      variant="ghost"
                      className="text-white hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="text-white hover:bg-white/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
                Professional Chart Analysis
              </h2>
              <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-8 leading-relaxed">
                Upload your trading chart and get comprehensive AI-powered analysis with technical signals, 
                market sentiment, and strategic recommendations.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Upload & Analysis Form */}
              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-white/5 to-transparent">
                  <CardTitle className="text-2xl text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    Chart Upload & Analysis
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Upload your chart image and provide trading details for AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Chart Image *</Label>
                    <div
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 backdrop-blur-sm ${
                        dragActive
                          ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/20'
                          : file
                          ? 'border-green-400 bg-green-400/10 shadow-lg shadow-green-500/20'
                          : 'border-white/20 hover:border-white/30 bg-white/5 hover:bg-white/10'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files[0])}
                        className="hidden"
                        id="file-upload"
                        data-testid="chart-file-upload"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="space-y-4">
                          <div className="w-18 h-18 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center ring-1 ring-white/10">
                            <Upload className="w-10 h-10 text-amber-400 drop-shadow-sm" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-lg">
                              {file ? file.name : 'Drop your chart here or click to upload'}
                            </p>
                            <p className="text-slate-300 text-sm mt-1 font-medium">
                              PNG, JPG up to 4MB
                            </p>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Symbol Input */}
                  <div className="space-y-2">
                    <Label htmlFor="symbol" className="text-white font-medium">Trading Symbol *</Label>
                    <Input
                      id="symbol"
                      data-testid="symbol-input"
                      placeholder="e.g., BTCUSDT, EURUSD, AAPL"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                      className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-amber-400 focus:bg-white/15 transition-all duration-200"
                    />
                  </div>

                  {/* Timeframe Select */}
                  <div className="space-y-2">
                    <Label htmlFor="timeframe" className="text-white font-medium">Timeframe *</Label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger data-testid="timeframe-select" className="bg-white/10 backdrop-blur-sm border-white/20 text-white focus:border-amber-400 focus:bg-white/15 transition-all duration-200">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 shadow-2xl">
                        <SelectItem value="1m" className="text-white hover:bg-white/10 focus:bg-white/10">1 Minute</SelectItem>
                        <SelectItem value="5m" className="text-white hover:bg-white/10 focus:bg-white/10">5 Minutes</SelectItem>
                        <SelectItem value="15m" className="text-white hover:bg-white/10 focus:bg-white/10">15 Minutes</SelectItem>
                        <SelectItem value="30m" className="text-white hover:bg-white/10 focus:bg-white/10">30 Minutes</SelectItem>
                        <SelectItem value="1H" className="text-white hover:bg-white/10 focus:bg-white/10">1 Hour</SelectItem>
                        <SelectItem value="2H" className="text-white hover:bg-white/10 focus:bg-white/10">2 Hours</SelectItem>
                        <SelectItem value="4H" className="text-white hover:bg-white/10 focus:bg-white/10">4 Hours</SelectItem>
                        <SelectItem value="6H" className="text-white hover:bg-white/10 focus:bg-white/10">6 Hours</SelectItem>
                        <SelectItem value="12H" className="text-white hover:bg-white/10 focus:bg-white/10">12 Hours</SelectItem>
                        <SelectItem value="1D" className="text-white hover:bg-white/10 focus:bg-white/10">1 Day</SelectItem>
                        <SelectItem value="3D" className="text-white hover:bg-white/10 focus:bg-white/10">3 Days</SelectItem>
                        <SelectItem value="1W" className="text-white hover:bg-white/10 focus:bg-white/10">1 Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Trading Style Select */}
                  <div className="space-y-2">
                    <Label htmlFor="tradingStyle" className="text-white font-medium">Trading Strategy (Optional)</Label>
                    <Select value={tradingStyle} onValueChange={setTradingStyle}>
                      <SelectTrigger data-testid="trading-style-select" className="bg-white/10 backdrop-blur-sm border-white/20 text-white focus:border-amber-400 focus:bg-white/15 transition-all duration-200">
                        <SelectValue placeholder="Select trading strategy" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 shadow-2xl max-h-64 overflow-y-auto">
                        {/* Advanced Strategies */}
                        <div className="px-2 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider">Advanced</div>
                        <SelectItem value="smart-money-concepts" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Smart Money Concepts (SMC)</SelectItem>
                        <SelectItem value="liquidity-sweep" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Liquidity Sweep</SelectItem>
                        <SelectItem value="pullback-retracement" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Pullback Retracement</SelectItem>
                        
                        {/* Scalping Strategies */}
                        <div className="px-2 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider mt-2">Scalping</div>
                        <SelectItem value="scalping-ema" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Scalping EMA</SelectItem>
                        <SelectItem value="volatility-breakout" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Volatility Breakout</SelectItem>
                        <SelectItem value="breakout-retest" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Breakout Retest</SelectItem>
                        <SelectItem value="squeeze-momentum" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Squeeze Momentum</SelectItem>
                        <SelectItem value="mean-reversion" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Mean Reversion</SelectItem>
                        
                        {/* Swing Strategies */}
                        <div className="px-2 py-1 text-xs font-semibold text-amber-400 uppercase tracking-wider mt-2">Swing</div>
                        <SelectItem value="momentum-swing" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Momentum Swing</SelectItem>
                        <SelectItem value="trend-following" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Trend Following</SelectItem>
                        <SelectItem value="trend-reversal" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Trend Reversal</SelectItem>
                        <SelectItem value="divergence-play" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Divergence Play</SelectItem>
                        <SelectItem value="continuation-pattern" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Continuation Pattern</SelectItem>
                        <SelectItem value="range-bound" className="text-white hover:bg-white/10 focus:bg-white/10 pl-4">Range Bound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Pro/Admin Only Settings */}
                  {(isPro || isAdmin) && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Risk Profile */}
                        <div className="space-y-2">
                          <Label className="text-white font-medium flex items-center gap-2">
                            Risk Profile
                            <Crown className="w-3 h-3 text-amber-400" />
                          </Label>
                          <Select value={riskProfile} onValueChange={setRiskProfile}>
                            <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white focus:border-amber-400 focus:bg-white/15 transition-all duration-200">
                              <SelectValue placeholder="Select risk profile" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 shadow-2xl">
                              <SelectItem value="conservative" className="text-white hover:bg-white/10 focus:bg-white/10">Conservative</SelectItem>
                              <SelectItem value="moderate" className="text-white hover:bg-white/10 focus:bg-white/10">Moderate</SelectItem>
                              <SelectItem value="aggressive" className="text-white hover:bg-white/10 focus:bg-white/10">Aggressive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Trading Balance */}
                        <div className="space-y-2">
                          <Label className="text-white font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Trading Balance
                            <Crown className="w-3 h-3 text-amber-400" />
                          </Label>
                          <Input
                            placeholder="e.g., $10,000"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-amber-400 focus:bg-white/15 transition-all duration-200"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Error Alert */}
                  {error && (
                    <Alert className="border-red-400/50 bg-red-500/10 backdrop-blur-sm text-red-200 shadow-lg" data-testid="error-alert">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Analyze Button */}
                  <Button
                    onClick={analyzeChart}
                    disabled={isAnalyzing || !file || !symbol || !timeframe}
                    className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:via-orange-600 hover:to-amber-700 text-white font-semibold py-4 text-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/40 transition-all duration-300 disabled:opacity-50 disabled:shadow-none ring-1 ring-amber-400/20 hover:ring-amber-400/40"
                    data-testid="analyze-chart-button"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Analyzing Chart...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <span>{user ? 'Analyze Chart' : 'Sign In to Analyze'}</span>
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <div className="space-y-6">
                {analysis ? (
                  <>
                    {/* Analysis Overview */}
                    <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300" data-testid="analysis-results">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-amber-400" />
                          Analysis Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-sm">Market Movement</Label>
                            <Badge className={`${getMovementColor(analysis.movement)} font-medium`} data-testid="movement-badge">
                              {analysis.movement || 'Unknown'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-slate-400 text-sm">Recommended Action</Label>
                            {(isPro || isAdmin) ? (
                              <Button size="sm" className={getActionColor(analysis.action)} data-testid="action-badge">
                                {analysis.action || 'Hold'}
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                </div>
                                <span className="text-slate-400 text-sm">Upgrade to Pro</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-slate-400 text-sm">Confidence Level</Label>
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${getConfidenceColor(analysis.confidence)} transition-all duration-500`}
                                style={{
                                  width: analysis.confidence === 'High' ? '85%' : analysis.confidence === 'Medium' ? '60%' : '35%'
                                }}
                              ></div>
                            </div>
                            <span className="text-white font-medium" data-testid="confidence-level">
                              {analysis.confidence || 'Unknown'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Technical Signals - Only for Pro/Admin */}
                    {analysis.signals && analysis.signals.length > 0 && (isPro || isAdmin) && (
                      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="text-xl text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-amber-400" />
                            Technical Signals
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid gap-2" data-testid="technical-signals">
                            {analysis.signals.map((signal, index) => (
                              <div key={index} className="flex items-center space-x-3 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200">
                                <div className="w-2 h-2 bg-amber-400 rounded-full shadow-sm shadow-amber-400/50"></div>
                                <span className="text-slate-100 font-medium">{signal}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Analysis Summary */}
                    <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-amber-400" />
                          Summary & Strategy
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-slate-400 text-sm font-medium">Quick Summary</Label>
                            <p className="text-slate-200 mt-1 leading-relaxed" data-testid="analysis-summary">
                              {analysis.summary || 'No summary available'}
                            </p>
                          </div>
                          
                          {analysis.customStrategy && (
                            <>
                              <Separator className="bg-slate-600" />
                              <div>
                                <Label className="text-slate-400 text-sm font-medium">Custom Strategy</Label>
                                <p className="text-slate-200 mt-1 leading-relaxed" data-testid="custom-strategy">
                                  {analysis.customStrategy}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Analysis */}
                    {analysis.fullAnalysis && (isPro || isAdmin) && (
                      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300">
                        <CardHeader>
                          <CardTitle className="text-xl text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-400" />
                            Detailed Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-slate-200 leading-relaxed" data-testid="full-analysis">
                            {analysis.fullAnalysis}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Upgrade Prompt for Free Users */}
                    {!isPro && !isAdmin && analysis && (
                      <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30 ring-2 ring-amber-400/20 shadow-2xl">
                        <CardHeader>
                          <CardTitle className="text-xl text-white flex items-center gap-2">
                            <Crown className="w-5 h-5 text-amber-400" />
                            Unlock Advanced Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-slate-300">
                              <div className="w-4 h-4 bg-amber-400/20 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-amber-400 rounded"></div>
                              </div>
                              <span>Technical signals and indicators analysis</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <div className="w-4 h-4 bg-amber-400/20 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-amber-400 rounded"></div>
                              </div>
                              <span>Buy/Sell/Hold recommendations</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <div className="w-4 h-4 bg-amber-400/20 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-amber-400 rounded"></div>
                              </div>
                              <span>Take profit and stop loss suggestions</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <div className="w-4 h-4 bg-amber-400/20 rounded flex items-center justify-center">
                                <div className="w-2 h-2 bg-amber-400 rounded"></div>
                              </div>
                              <span>Custom trading strategies</span>
                            </div>
                          </div>
                          <Button
                            onClick={() => setShowUpgradeModal(true)}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3"
                          >
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to Pro - $29/month
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
                    <CardContent className="text-center py-12">
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center ring-1 ring-white/10">
                          <Brain className="w-10 h-10 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2">Ready to Analyze</h3>
                          <p className="text-slate-300">
                            {user ? 'Upload your trading chart and fill in the details to get started with AI-powered analysis.' : 'Sign in to upload your trading chart and get AI-powered analysis.'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        creditsRemaining={userProfile?.credits_remaining || 0}
      />

      {showProfileSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ProfileSettings 
              user={userProfile} 
              onClose={() => setShowProfileSettings(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartAnalyzer;
