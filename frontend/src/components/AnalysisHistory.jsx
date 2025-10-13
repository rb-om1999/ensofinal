import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { History, TrendingUp, Calendar, Clock, Crown, Target, Shield, DollarSign, Eye } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AnalysisHistory = ({ user, isAdmin, isPro }) => {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    fetchAnalysisHistory();
  }, []);

  const fetchAnalysisHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/analyses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAnalyses(response.data || []);
    } catch (err) {
      setError('Failed to load analysis history');
      console.error('Failed to fetch analysis history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      case 'buy': return 'bg-green-600 text-white';
      case 'sell': return 'bg-red-600 text-white';
      default: return 'bg-amber-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
        <CardContent className="text-center py-12">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading analysis history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
        <CardContent className="py-12">
          <Alert className="border-red-400/50 bg-red-500/10 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (analyses.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center ring-1 ring-white/10 mb-4">
            <History className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis History</h3>
          <p className="text-slate-300">
            Start analyzing charts to build your analysis history.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="text-2xl text-white flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            Analysis History
            <Crown className="w-5 h-5 text-amber-400" />
          </CardTitle>
          <CardDescription className="text-slate-300">
            Your complete chart analysis history and insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {analyses.map((analysis, index) => (
              <Card key={analysis.id || index} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">
                          {analysis.symbol} - {analysis.timeframe}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          {formatDate(analysis.timestamp)}
                          {analysis.plan_used && (
                            <Badge className={analysis.plan_used === 'pro' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-500/20 text-slate-300'}>
                              {analysis.plan_used === 'pro' ? 'Pro' : 'Free'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis.analysis?.movement && (
                        <Badge className={`${getMovementColor(analysis.analysis.movement)} font-medium`}>
                          {analysis.analysis.movement}
                        </Badge>
                      )}
                      <Button
                        onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                        variant="ghost"
                        size="sm"
                        className="text-amber-400 hover:text-amber-300 hover:bg-white/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {selectedAnalysis?.id === analysis.id && (
                  <CardContent className="pt-0">
                    <div className="space-y-4 border-t border-white/10 pt-4">
                      {/* Analysis Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {analysis.analysis?.action && (
                          <div className="space-y-1">
                            <Label className="text-slate-400 text-sm">Action</Label>
                            <Badge className={getActionColor(analysis.analysis.action)}>
                              {analysis.analysis.action}
                            </Badge>
                          </div>
                        )}
                        {analysis.analysis?.confidence && (
                          <div className="space-y-1">
                            <Label className="text-slate-400 text-sm">Confidence</Label>
                            <Badge className="bg-slate-600 text-white">
                              {analysis.analysis.confidence}
                            </Badge>
                          </div>
                        )}
                        {analysis.analysis?.movement && (
                          <div className="space-y-1">
                            <Label className="text-slate-400 text-sm">Movement</Label>
                            <Badge className={getMovementColor(analysis.analysis.movement)}>
                              {analysis.analysis.movement}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Summary */}
                      {analysis.analysis?.summary && (
                        <div>
                          <Label className="text-slate-400 text-sm font-medium">Summary</Label>
                          <p className="text-slate-200 mt-1 leading-relaxed">
                            {analysis.analysis.summary}
                          </p>
                        </div>
                      )}

                      {/* Technical Signals */}
                      {analysis.analysis?.signals && analysis.analysis.signals.length > 0 && (
                        <div>
                          <Label className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Technical Signals
                          </Label>
                          <div className="grid gap-2 mt-2">
                            {analysis.analysis.signals.map((signal, signalIndex) => (
                              <div key={signalIndex} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                                <span className="text-slate-200 text-sm">{signal}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Analysis */}
                      {analysis.analysis?.fullAnalysis && (
                        <div>
                          <Label className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Detailed Analysis
                          </Label>
                          <p className="text-slate-200 mt-1 leading-relaxed text-sm">
                            {analysis.analysis.fullAnalysis}
                          </p>
                        </div>
                      )}

                      {/* Custom Strategy */}
                      {analysis.analysis?.customStrategy && (
                        <div>
                          <Label className="text-slate-400 text-sm font-medium flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            Custom Strategy
                          </Label>
                          <p className="text-slate-200 mt-1 leading-relaxed text-sm">
                            {analysis.analysis.customStrategy}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisHistory;