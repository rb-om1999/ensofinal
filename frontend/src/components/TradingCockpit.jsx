import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Target, 
  Shield, 
  DollarSign, 
  BarChart3,
  Radio,
  Cpu,
  Eye,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader2,
  User,
  LogIn,
  Crown
} from 'lucide-react';
import axios from 'axios';
import AuthModal from './AuthModal';
import UpgradeModal from './UpgradeModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TradingCockpit = () => {
  // State management
  const [chartUrl, setChartUrl] = useState('');
  const [symbol, setSymbol] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [tradingStyle, setTradingStyle] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [chartPreview, setChartPreview] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [mode, setMode] = useState('link'); // 'link' or 'upload'
  const [currentPhase, setCurrentPhase] = useState('input'); // 'input', 'preview', 'analyzing', 'results'
  const [isCapturing, setIsCapturing] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // User info
  const [isPro, setIsPro] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);

  // Check authentication on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axios.get(`${API}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAuthenticated(true);
        setUser(response.data);
        
        const plan = response.data.user_metadata?.plan || 'free';
        const userCredits = response.data.user_metadata?.credits_remaining || 0;
        
        setIsPro(plan === 'pro');
        setIsAdmin(response.data.email === 'omsonii9846@gmail.com');
        setCredits(userCredits);
      } catch (error) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    }
  };

  const handleAuthSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setShowAuthModal(false);
    
    const plan = userData.user_metadata?.plan || 'free';
    const userCredits = userData.user_metadata?.credits_remaining || 0;
    
    setIsPro(plan === 'pro');
    setIsAdmin(userData.email === 'omsonii9846@gmail.com');
    setCredits(userCredits);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setIsPro(false);
    setIsAdmin(false);
    setCredits(0);
    setAnalysis(null);
    setCurrentPhase('input');
  };

  // Platform detection
  const detectPlatform = (url) => {
    if (url.includes('tradingview.com')) return 'TradingView';
    if (url.includes('binance.com')) return 'Binance';
    return 'Unknown Platform';
  };

  // Chart URL validation
  const isValidChartUrl = (url) => {
    return url.includes('tradingview.com') || url.includes('binance.com');
  };

  // Auto-extract symbol from URL
  useEffect(() => {
    if (chartUrl && isValidChartUrl(chartUrl)) {
      // Simple symbol extraction from TradingView URLs
      const tvMatch = chartUrl.match(/chart\/[^\/]*\/([A-Z0-9]+)/);
      if (tvMatch) {
        setSymbol(tvMatch[1]);
      }
    }
  }, [chartUrl]);

  // Fetch chart preview
  const handleFetchChart = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (!chartUrl || !isValidChartUrl(chartUrl)) {
      setError('Please enter a valid TradingView or Binance chart URL');
      return;
    }

    if (!symbol || !timeframe) {
      setError('Please provide symbol and timeframe');
      return;
    }

    setIsCapturing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setShowAuthModal(true);
        setIsCapturing(false);
        return;
      }

      const response = await axios.post(`${API}/capture-chart`, {
        chartUrl: chartUrl,
        symbol: symbol,
        timeframe: timeframe,
        tradingStyle: tradingStyle
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setScreenshotPreview(response.data);
      setCurrentPhase('preview');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } else {
        setError(err.response?.data?.detail || 'Failed to capture chart screenshot');
      }
    } finally {
      setIsCapturing(false);
    }
  };

  // Analyze chart (uses existing screenshot)
  const handleAnalyzeChart = async () => {
    if (!screenshotPreview) {
      setError('Please capture chart screenshot first');
      return;
    }

    setIsAnalyzing(true);
    setCurrentPhase('analyzing');
    setError('');

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(`${API}/analyze-chart-link`, {
        chartUrl: screenshotPreview.chart_url,
        symbol: screenshotPreview.symbol,
        timeframe: screenshotPreview.timeframe,
        tradingStyle: tradingStyle
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.error) {
        if (response.data.message && response.data.message.includes('run out of free analyses')) {
          setShowUpgradeModal(true);
        }
        setError(response.data.message || 'Analysis failed');
        setCurrentPhase('preview');
      } else {
        setAnalysis(response.data);
        setCurrentPhase('results');
        // Update credits
        setCredits(response.data.credits_remaining || 0);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setShowAuthModal(true);
      } else {
        setError(err.response?.data?.detail || err.response?.data?.message || 'Analysis failed. Please try again.');
      }
      setCurrentPhase('preview');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset to input mode
  const resetCockpit = () => {
    setCurrentPhase('input');
    setAnalysis(null);
    setError('');
    setChartPreview(null);
    setScreenshotPreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-purple-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-transparent to-cyan-900/10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-xl flex items-center justify-center glow-violet">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-display bg-gradient-to-r from-violet-300 via-white to-cyan-300 bg-clip-text text-transparent">
                  Trading Cockpit
                </h1>
                <p className="text-slate-400 font-medium">Advanced AI-Powered Market Analysis</p>
              </div>
            </div>

            {/* User Authentication */}
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="text-right">
                    <p className="text-white text-sm font-medium">{user?.email}</p>
                    <div className="flex items-center space-x-2">
                      {isPro && <Crown className="w-3 h-3 text-amber-400" />}
                      <Badge className={isPro ? "bg-amber-500/20 text-amber-300" : "bg-slate-500/20 text-slate-300"}>
                        {isPro ? 'Pro' : isAdmin ? 'Admin' : 'Free'}
                      </Badge>
                      {!isPro && !isAdmin && (
                        <span className="text-xs text-slate-400">{credits} credits</span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>

        {currentPhase === 'input' && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Top Panel - Chart Input */}
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 glow-violet panel-animate">
              <CardHeader>
                <CardTitle className="text-2xl text-white flex items-center gap-3">
                  <Radio className="w-6 h-6 text-violet-400" />
                  Chart Link Input
                  <div className="flex-1"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Paste your TradingView or Binance chart URL for AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="https://tradingview.com/chart/..."
                      value={chartUrl}
                      onChange={(e) => setChartUrl(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-slate-400 h-14 text-lg font-mono"
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Symbol</Label>
                      <Input
                        placeholder="BTCUSDT"
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        className="bg-white/10 border-white/20 text-white placeholder-slate-400 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Timeframe</Label>
                      <Select value={timeframe} onValueChange={setTimeframe}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-slate-700">
                          <SelectItem value="1m">1 Minute</SelectItem>
                          <SelectItem value="5m">5 Minutes</SelectItem>
                          <SelectItem value="15m">15 Minutes</SelectItem>
                          <SelectItem value="1h">1 Hour</SelectItem>
                          <SelectItem value="4h">4 Hours</SelectItem>
                          <SelectItem value="1d">1 Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300 text-sm">Trading Strategy (Optional)</Label>
                      <Select value={tradingStyle} onValueChange={setTradingStyle}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select trading strategy" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 shadow-2xl max-h-64 overflow-y-auto">
                          <SelectItem value="smart-money-concepts" className="text-white hover:bg-white/10 focus:bg-white/10">Smart Money Concepts</SelectItem>
                          <SelectItem value="liquidity-sweep" className="text-white hover:bg-white/10 focus:bg-white/10">Liquidity Sweep</SelectItem>
                          <SelectItem value="pullback-retracement" className="text-white hover:bg-white/10 focus:bg-white/10">Pullback Retracement</SelectItem>
                          <SelectItem value="scalping-ema" className="text-white hover:bg-white/10 focus:bg-white/10">Scalping EMA</SelectItem>
                          <SelectItem value="volatility-breakout" className="text-white hover:bg-white/10 focus:bg-white/10">Volatility Breakout</SelectItem>
                          <SelectItem value="breakout-retest" className="text-white hover:bg-white/10 focus:bg-white/10">Breakout Retest</SelectItem>
                          <SelectItem value="squeeze-momentum" className="text-white hover:bg-white/10 focus:bg-white/10">Squeeze Momentum</SelectItem>
                          <SelectItem value="mean-reversion" className="text-white hover:bg-white/10 focus:bg-white/10">Mean Reversion</SelectItem>
                          <SelectItem value="momentum-swing" className="text-white hover:bg-white/10 focus:bg-white/10">Momentum Swing</SelectItem>
                          <SelectItem value="trend-following" className="text-white hover:bg-white/10 focus:bg-white/10">Trend Following</SelectItem>
                          <SelectItem value="trend-reversal" className="text-white hover:bg-white/10 focus:bg-white/10">Trend Reversal</SelectItem>
                          <SelectItem value="divergence-play" className="text-white hover:bg-white/10 focus:bg-white/10">Divergence Play</SelectItem>
                          <SelectItem value="continuation-pattern" className="text-white hover:bg-white/10 focus:bg-white/10">Continuation Pattern</SelectItem>
                          <SelectItem value="range-bound" className="text-white hover:bg-white/10 focus:bg-white/10">Range Bound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleFetchChart}
                    disabled={!symbol || !timeframe || !chartUrl || isCapturing}
                    className="w-full bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white px-8 py-4 text-lg glow-violet disabled:opacity-50"
                  >
                    {isCapturing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Capturing Chart...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 mr-2" />
                        Capture Chart Screenshot
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {currentPhase === 'preview' && screenshotPreview && (
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Screenshot Preview Panel */}
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 glow-cyan panel-animate">
              <CardHeader>
                <CardTitle className="text-xl text-white flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  Chart Screenshot Preview
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    {screenshotPreview.metadata.platform}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Confirm this screenshot looks correct before proceeding with AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Screenshot Display */}
                <div className="relative bg-white/5 rounded-2xl p-4 border border-white/10">
                  <img 
                    src={`data:image/png;base64,${screenshotPreview.screenshot}`}
                    alt="Chart Screenshot"
                    className="w-full h-auto rounded-xl border border-white/20 shadow-2xl"
                  />
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-xs text-slate-300">
                      {screenshotPreview.metadata.width}×{screenshotPreview.metadata.height}
                    </span>
                  </div>
                </div>

                {/* Chart Info */}
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="text-center">
                    <Label className="text-slate-400 text-sm">Symbol</Label>
                    <p className="text-white font-mono font-bold text-lg">{screenshotPreview.symbol}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-slate-400 text-sm">Timeframe</Label>
                    <p className="text-white font-semibold text-lg">{screenshotPreview.timeframe}</p>
                  </div>
                  <div className="text-center">
                    <Label className="text-slate-400 text-sm">Strategy</Label>
                    <p className="text-white font-semibold text-lg">{tradingStyle || 'General Analysis'}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <Button
                    onClick={() => {
                      setCurrentPhase('input');
                      setScreenshotPreview(null);
                    }}
                    variant="outline"
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    ← Retake Screenshot
                  </Button>
                  <Button
                    onClick={handleAnalyzeChart}
                    disabled={isAnalyzing}
                    className="flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 hover:from-violet-500 hover:via-purple-500 hover:to-cyan-500 text-white py-3 text-lg font-semibold glow-violet"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-6 h-6 mr-2" />
                        Analyze Chart
                        <ArrowRight className="w-6 h-6 ml-2" />
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <div className="flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <span className="text-red-300">{error}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentPhase === 'analyzing' && (
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 glow-violet">
              <CardContent className="py-20 text-center">
                <div className="relative w-32 h-32 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-violet-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-t-violet-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-4 border-4 border-cyan-500/20 rounded-full"></div>
                  <div className="absolute inset-4 border-4 border-t-cyan-500 rounded-full animate-spin" style={{animationDirection: 'reverse'}}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cpu className="w-8 h-8 text-violet-400" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">AI Analysis in Progress</h3>
                <p className="text-slate-300 mb-8">
                  Scanning chart patterns • Analyzing market context • Generating insights
                </p>
                
                <div className="max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Technical Analysis</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full mb-4">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full w-4/5 animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentPhase === 'results' && analysis && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-display text-white">Analysis Results</h2>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(analysis, null, 2))}
                  variant="outline" 
                  className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                >
                  📋 Copy JSON
                </Button>
                <Button onClick={resetCockpit} variant="outline" className="border-white/20 text-white">
                  🔄 New Analysis
                </Button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Technical Summary */}
              <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 glow-violet panel-animate" style={{animationDelay: '0.2s'}}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-400" />
                    📊 Technical Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-400 text-sm">Verdict</Label>
                      <Badge className="bg-violet-500/20 text-violet-300 font-medium">
                        {analysis.integrationVerdict}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-slate-400 text-sm">Confidence</Label>
                      <Badge className="bg-cyan-500/20 text-cyan-300 font-medium">
                        {analysis.confidence}
                      </Badge>
                    </div>
                  </div>

                  {analysis.technicalSignals && (
                    <div>
                      <Label className="text-slate-400 text-sm font-medium">Key Signals</Label>
                      <div className="space-y-2 mt-2">
                        {analysis.technicalSignals.map((signal, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                            <div className="w-2 h-2 bg-violet-400 rounded-full"></div>
                            <span className="text-slate-200 text-sm">{signal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Context */}
              <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 glow-cyan panel-animate" style={{animationDelay: '0.4s'}}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    🧠 Market Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.marketContext && analysis.marketContext.length > 0 && (
                    <div className="space-y-2">
                      {analysis.marketContext.map((context, index) => (
                        <div key={index} className="p-3 bg-white/5 rounded-lg border border-cyan-500/20">
                          <span className="text-slate-200 text-sm">{context}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {analysis.conflictReasoning && (
                    <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                      <Label className="text-orange-300 text-sm font-medium">Conflict Analysis</Label>
                      <p className="text-orange-200 text-sm mt-1">{analysis.conflictReasoning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trade Decision */}
              <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 glow-gold panel-animate" style={{animationDelay: '0.6s'}}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-yellow-400" />
                    💰 AI Decision
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge className="text-2xl px-6 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 border-yellow-500/30">
                      {analysis.action}
                    </Badge>
                  </div>

                  {analysis.targetTrade && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <Label className="text-green-400 text-xs">Entry</Label>
                          <p className="text-green-300 font-mono text-sm">{analysis.targetTrade.entryPrice}</p>
                        </div>
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <Label className="text-red-400 text-xs">Stop Loss</Label>
                          <p className="text-red-300 font-mono text-sm">{analysis.targetTrade.stopLoss}</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <Label className="text-emerald-400 text-xs">Take Profit</Label>
                          <p className="text-emerald-300 font-mono text-sm">{analysis.targetTrade.takeProfit}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary & Strategy */}
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 panel-animate" style={{animationDelay: '0.8s'}}>
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-violet-400" />
                  ⚙️ Analysis Summary & Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-slate-400 text-sm font-medium">AI Summary</Label>
                  <p className="text-slate-200 mt-2 leading-relaxed">{analysis.summary}</p>
                </div>

                {analysis.customStrategy && (
                  <div>
                    <Label className="text-slate-400 text-sm font-medium">Custom Strategy</Label>
                    <p className="text-slate-200 mt-2 leading-relaxed">{analysis.customStrategy}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  );
};

export default TradingCockpit;