import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, X, Crown, Star, BarChart3, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);

  const handleGetStarted = (plan) => {
    if (plan === 'free') {
      navigate('/');
    } else {
      // Navigate to signup with pro plan
      navigate('/?upgrade=pro');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-stone-900 text-white relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/20 via-transparent to-orange-900/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-500/5 to-transparent transform rotate-12 -translate-y-1/2"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Ccircle cx='30' cy='30' r='1'%3E%3C/circle%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
      
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
              
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-white hover:bg-white/10 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-16">
              <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-lg">
                Choose Your Plan
              </h2>
              <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-8 leading-relaxed">
                Start with our free plan or upgrade to Pro for unlimited analysis and advanced features.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-12">
                <span className={`font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                <button
                  onClick={() => setIsAnnual(!isAnnual)}
                  className="relative w-14 h-7 bg-slate-600 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ${isAnnual ? 'transform translate-x-7' : ''}`}></div>
                </button>
                <span className={`font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
                  Annual
                  <Badge className="ml-2 bg-green-500/20 text-green-300 border-green-500/50">Save 20%</Badge>
                </span>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Free Plan */}
              <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300">
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-400/20 to-slate-600/20 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-slate-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white">Free</CardTitle>
                  <CardDescription className="text-slate-300 text-lg">Perfect for getting started</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-white">$0</span>
                    <span className="text-slate-400 ml-2">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">5 chart analyses per month</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Basic market trend analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Support & resistance levels</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-slate-400">Technical indicators analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-slate-400">Buy/Sell/Hold recommendations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-slate-400">Advanced trading strategies</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-slate-400">Analysis history</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <span className="text-slate-400">Risk management tools</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleGetStarted('free')}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3"
                  >
                    Get Started Free
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-2xl border-amber-400/30 shadow-2xl ring-2 ring-amber-400/30 hover:ring-amber-400/50 transition-all duration-300 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
                
                <CardHeader className="text-center pb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400/30 to-orange-500/30 rounded-full mx-auto flex items-center justify-center mb-4">
                    <Crown className="w-8 h-8 text-amber-400" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                    Pro
                    <Crown className="w-6 h-6 text-amber-400" />
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-lg">For serious traders</CardDescription>
                  <div className="pt-4">
                    <span className="text-4xl font-bold text-white">
                      ${isAnnual ? '23' : '29'}
                    </span>
                    <span className="text-slate-400 ml-2">/month</span>
                    {isAnnual && (
                      <div className="text-sm text-green-300 mt-1">
                        $276/year (save $72)
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200 font-medium">Unlimited chart analyses</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Advanced technical analysis</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">All technical indicators</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Buy/Sell/Hold recommendations</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Custom trading strategies</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Complete analysis history</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Risk profile configuration</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-slate-200">Take profit & stop loss suggestions</span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleGetStarted('pro')}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="mt-20 text-center">
              <h3 className="text-3xl font-bold text-white mb-8">Frequently Asked Questions</h3>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <Card className="bg-white/10 backdrop-blur-2xl border-white/20">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Can I upgrade or downgrade anytime?</h4>
                    <p className="text-slate-300">Yes, you can upgrade to Pro or downgrade to Free at any time. Changes take effect immediately.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-2xl border-white/20">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">How do credits work on the Free plan?</h4>
                    <p className="text-slate-300">You get 5 free analyses per month. Credits reset on the 1st of each month.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-2xl border-white/20">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h4>
                    <p className="text-slate-300">We accept all major credit cards, PayPal, and other secure payment methods.</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white/10 backdrop-blur-2xl border-white/20">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Is there a free trial for Pro?</h4>
                    <p className="text-slate-300">Start with our Free plan to try EnsoTrade, then upgrade when you're ready for advanced features.</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PricingPage;