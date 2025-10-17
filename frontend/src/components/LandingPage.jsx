import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart3, TrendingUp, Shield, Crown, Star, ArrowRight, DollarSign, Target, Zap, Activity, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  
  // Typing animation state
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  
  const symbols = ['LTCUSDT', 'XAUUSD', 'AAPL', 'DXY', 'BTCUSD', 'EURUSD', 'TSLA', 'NVDA'];
  
  useEffect(() => {
    const currentWord = symbols[currentIndex];
    
    if (isTyping) {
      if (currentSymbol.length < currentWord.length) {
        setTimeout(() => {
          setCurrentSymbol(currentWord.slice(0, currentSymbol.length + 1));
        }, 150);
      } else {
        setTimeout(() => setIsTyping(false), 2000);
      }
    } else {
      if (currentSymbol.length > 0) {
        setTimeout(() => {
          setCurrentSymbol(currentSymbol.slice(0, -1));
        }, 100);
      } else {
        setCurrentIndex((prev) => (prev + 1) % symbols.length);
        setIsTyping(true);
      }
    }
  }, [currentSymbol, currentIndex, isTyping, symbols]);

  const features = [
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "AI-Powered Analysis",
      description: "Advanced algorithms analyze market patterns and predict profitable opportunities"
    },
    {
      icon: <Target className="w-6 h-6" />,
      title: "Precision Trading",
      description: "Get exact entry and exit points with calculated risk-to-reward ratios"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Risk Management",
      description: "Built-in stop-loss and take-profit calculations to protect your capital"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Real-Time Insights",
      description: "Instant analysis of any trading chart with professional-grade recommendations"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Day Trader",
      quote: "Increased my win rate from 60% to 87% in just 3 months. The analysis is incredibly accurate.",
      profit: "+$47,230"
    },
    {
      name: "Marcus Rodriguez",
      role: "Swing Trader",
      quote: "The risk management features saved me from major losses. Best investment I've made.",
      profit: "+$23,890"
    },
    {
      name: "Alex Thompson",
      role: "Crypto Trader",
      quote: "Finally found a tool that actually works. The profit recommendations are spot-on.",
      profit: "+$65,140"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden font-['Inter',sans-serif]">
      {/* Luxury Gradient Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-blue-900/10 to-purple-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-pink-500/5 rounded-full blur-3xl"></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-2 h-2 bg-amber-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 right-20 w-3 h-3 bg-purple-400/20 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Luxury Glassmorphism Header */}
        <header className="border-b border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-amber-500/5"></div>
          <div className="container mx-auto px-8 py-6 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-2xl ring-2 ring-amber-400/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
                  <BarChart3 className="w-8 h-8 text-white drop-shadow-lg relative z-10" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent drop-shadow-lg">
                    EnsoTrade
                  </h1>
                  <p className="text-slate-300 text-sm font-medium tracking-wide">Professional Trading Intelligence</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="ghost"
                  className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-300 font-medium px-6 py-3 rounded-xl"
                >
                  Pricing
                </Button>
                <Button
                  onClick={() => navigate('/app')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ring-2 ring-amber-400/20 hover:ring-amber-400/40"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section with TradingView Chart */}
        <section className="py-20 px-8 relative">
          <div className="container mx-auto max-w-6xl">
            {/* Centered Content */}
            <div className="text-center space-y-8 mb-16">
              <Badge className="bg-gradient-to-r from-purple-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30 text-sm font-medium px-6 py-3 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Trusted by 50,000+ Professional Traders
              </Badge>
              
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                    Dominate Every
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Trading Market
                  </span>
                </h1>
                
                <p className="text-xl text-slate-300 leading-relaxed max-w-4xl mx-auto">
                  Our AI analyzes any trading instrument with institutional-grade precision. 
                  From crypto to forex, stocks to commodities - we've got you covered.
                </p>
              </div>
            </div>

            {/* TradingView Chart */}
            <div className="mb-12">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden max-w-5xl mx-auto">
                {/* Chart Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-white">AAPL • Apple</span>
                  </div>
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30 font-mono">
                    Live Market
                  </Badge>
                </div>

                {/* TradingView Widget */}
                <div className="h-96 rounded-2xl overflow-hidden bg-slate-900/50">
                  <div 
                    className="tradingview-widget-container w-full h-full"
                    style={{ height: '100%', width: '100%' }}
                  >
                    <div 
                      className="tradingview-widget-container__widget w-full h-full"
                      style={{ height: 'calc(100% - 32px)', width: '100%' }}
                    >
                      <iframe
                        id="tradingview_chart"
                        src="https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=FX:XAUUSD&interval=15&hidesidetoolbar=1&hidetoptoolbar=1&symboledit=1&saveimage=1&toolbarbg=rgba(0,0,0,0.1)&studies=[]&hideideas=1&theme=dark&style=1&timezone=Etc%2FUTC&studies_overrides={}&overrides={}&enabled_features=[]&disabled_features=[]&locale=en&utm_source=trade-vision-12.preview.emergentagent.com&utm_medium=widget&utm_campaign=chart&utm_term=FX:XAUUSD"
                        style={{
                          width: '100%',
                          height: '100%',
                          margin: '0 !important',
                          padding: '0 !important',
                          border: 'none',
                          borderRadius: '12px'
                        }}
                        frameBorder="0"
                        allowTransparency="true"
                        scrolling="no"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>

                {/* Chart Stats */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Win Rate</p>
                      <p className="font-bold text-green-400">87.3%</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Profit Factor</p>
                      <p className="font-bold text-amber-400">2.4x</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-400">Drawdown</p>
                      <p className="font-bold text-blue-400">-3.2%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-amber-400">
                    <TrendingUp className="w-5 h-5" />
                    <span className="font-semibold">Bullish Signal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Typing Animation Section */}
            <div className="mb-12 max-w-2xl mx-auto">
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <Activity className="w-6 h-6 text-amber-400" />
                    <span className="text-slate-300 font-medium">Currently Analyzing:</span>
                  </div>
                  <div className="font-mono text-4xl font-bold text-amber-400 min-h-[3rem] flex items-center justify-center">
                    {currentSymbol}
                    <span className="animate-pulse ml-1">|</span>
                  </div>
                  <p className="text-slate-400 mt-2">Live market domination across all instruments</p>
                </div>
              </div>
            </div>

            {/* Centered Take Profit Button */}
            <div className="text-center">
              <Button
                onClick={() => navigate('/pricing')}
                size="lg"
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 text-white font-bold px-16 py-8 text-2xl rounded-2xl shadow-2xl hover:shadow-amber-500/25 transition-all duration-500 transform hover:scale-105 ring-2 ring-amber-400/20 hover:ring-amber-400/40"
              >
                <DollarSign className="w-8 h-8 mr-4" />
                Take Profit!
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h3 className="text-5xl font-bold text-white mb-6">Why Traders Choose EnsoTrade</h3>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Professional-grade tools designed for serious traders who demand precision and results
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-white/20 transition-all duration-300 text-center group">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full mx-auto flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <div className="text-amber-400">
                        {feature.icon}
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-white mb-3">{feature.title}</h4>
                    <p className="text-slate-300 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h3 className="text-5xl font-bold text-white mb-6">Success Stories</h3>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Join thousands of traders who've transformed their results with EnsoTrade
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
                  <CardContent className="p-8">
                    <div className="flex items-center mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mr-4">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{testimonial.name}</h4>
                        <p className="text-slate-400 text-sm">{testimonial.role}</p>
                      </div>
                      <Badge className="ml-auto bg-green-500/20 text-green-300 border-green-500/50 font-bold">
                        {testimonial.profit}
                      </Badge>
                    </div>
                    <p className="text-slate-200 leading-relaxed italic">"{testimonial.quote}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Luxury CTA Section */}
        <section className="py-32 px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-amber-900/20"></div>
          <div className="container mx-auto max-w-6xl text-center relative z-10">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5"></div>
              
              <div className="relative z-10 p-16">
                <Badge className="mb-8 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-lg font-medium px-8 py-4 rounded-full">
                  <Crown className="w-5 h-5 mr-2 inline" />
                  Join The Elite Trading Community
                </Badge>
                
                <h3 className="text-5xl lg:text-6xl font-bold mb-8">
                  <span className="bg-gradient-to-r from-white via-amber-100 to-white bg-clip-text text-transparent">
                    Ready to Multiply
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                    Your Trading Profits?
                  </span>
                </h3>
                
                <p className="text-2xl text-slate-200 mb-12 max-w-4xl mx-auto leading-relaxed">
                  Join thousands of professional traders who've transformed their results with our AI-powered analysis. 
                  Choose your path to consistent profitability.
                </p>
                
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
                  {/* Free Plan CTA */}
                  <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                    <h4 className="text-2xl font-bold text-white mb-4">Start Free</h4>
                    <p className="text-slate-300 mb-6">Perfect for testing our AI analysis</p>
                    <ul className="text-left space-y-2 mb-6">
                      <li className="text-slate-300">✓ 5 Monthly Analyses</li>
                      <li className="text-slate-300">✓ Basic Market Insights</li>
                      <li className="text-slate-300">✓ Email Support</li>
                    </ul>
                    <Button
                      onClick={() => navigate('/app')}
                      variant="outline"
                      className="w-full border-white/30 text-white hover:bg-white/10 font-semibold py-4 px-8 text-lg rounded-xl"
                    >
                      Start Free Trial
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>

                  {/* Pro Plan CTA */}
                  <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-8 border border-amber-400/30 hover:border-amber-400/50 transition-all duration-300 ring-2 ring-amber-400/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-2xl font-bold text-white">Go Pro</h4>
                      <Badge className="bg-amber-500 text-black font-bold">POPULAR</Badge>
                    </div>
                    <p className="text-slate-200 mb-6">For serious traders seeking maximum profits</p>
                    <ul className="text-left space-y-2 mb-6">
                      <li className="text-slate-200">✓ Unlimited Analyses</li>
                      <li className="text-slate-200">✓ Advanced AI Insights</li>
                      <li className="text-slate-200">✓ Priority Support</li>
                      <li className="text-slate-200">✓ Risk Management Tools</li>
                    </ul>
                    <Button
                      onClick={() => navigate('/pricing')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                    >
                      <DollarSign className="w-5 h-5 mr-2" />
                      Take Profit Now!
                    </Button>
                  </div>
                </div>

                <p className="text-slate-400 text-sm">
                  💡 Start free, upgrade anytime. No commitment, cancel whenever you want.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10 py-12 px-6">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                EnsoTrade
              </h4>
            </div>
            <p className="text-slate-400 mb-4">
              Professional Trading Intelligence • Powered by Advanced AI
            </p>
            <p className="text-slate-500 text-sm">
              © 2024 EnsoTrade. All rights reserved. Trade responsibly.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;