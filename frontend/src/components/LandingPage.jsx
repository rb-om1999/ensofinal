import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart3, TrendingUp, Shield, Crown, Star, ArrowRight, DollarSign, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  const tradingImages = [
    {
      url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzB8MHwxfHNlYXJjaHwxfHxzdG9jayUyMG1hcmtldHxlbnwwfHx8fDE3NjA1MzM2MTd8MA&ixlib=rb-4.1.0&q=85",
      alt: "Professional Trading Dashboard",
      profit: "+247.8%"
    },
    {
      url: "https://images.unsplash.com/photo-1639754390580-2e7437267698?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHx0cmFkaW5nJTIwY2hhcnR8ZW58MHx8fHwxNzYwNTMzNjA0fDA&ixlib=rb-4.1.0&q=85",
      alt: "Crypto Market Analysis",
      profit: "+189.3%"
    },
    {
      url: "https://images.pexels.com/photos/159888/pexels-photo-159888.jpeg",
      alt: "Market Trends Dashboard",
      profit: "+156.7%"
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-stone-900 text-white relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-orange-900/10"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-amber-500/3 to-transparent transform rotate-12 -translate-y-1/2"></div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)',
          backgroundSize: '60px 60px'
        }}></div>
      </div>

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
                  <p className="text-slate-300 text-sm font-medium">Professional Trading Intelligence</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="ghost"
                  className="text-white hover:bg-white/10 transition-colors font-medium"
                >
                  Pricing
                </Button>
                <Button
                  onClick={() => navigate('/app')}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <Badge className="mb-6 bg-amber-500/20 text-amber-300 border-amber-500/50 text-sm font-medium px-4 py-2">
                🏆 Trusted by 50,000+ Traders Worldwide
              </Badge>
              <h2 className="text-7xl font-bold mb-8 bg-gradient-to-r from-white via-amber-100 to-amber-300 bg-clip-text text-transparent drop-shadow-2xl leading-tight">
                Turn Charts Into
                <br />
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Consistent Profits</span>
              </h2>
              <p className="text-2xl text-slate-200 max-w-4xl mx-auto mb-12 leading-relaxed">
                Professional trading analysis powered by cutting-edge AI. Upload any chart and receive 
                institutional-grade insights with precise entry points, risk management, and profit targets.
              </p>
            </div>
          </div>
        </section>

        {/* Trading Charts Showcase */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-white mb-4">Real Results, Real Profits</h3>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                See how our analysis identifies winning opportunities in live market conditions
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {tradingImages.map((image, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10 hover:ring-amber-400/30 transition-all duration-500 group overflow-hidden">
                  <CardContent className="p-0 relative">
                    <div className="relative overflow-hidden rounded-lg">
                      <img 
                        src={image.url} 
                        alt={image.alt}
                        className="w-full h-64 object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500/90 text-white font-bold px-3 py-1 text-lg backdrop-blur-sm">
                          {image.profit}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <Button
                          onClick={() => navigate('/pricing')}
                          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-3 text-lg shadow-lg transition-all duration-300"
                        >
                          <DollarSign className="w-5 h-5 mr-2" />
                          Take Profit!
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-2xl border-amber-400/30 shadow-2xl ring-2 ring-amber-400/20">
              <CardContent className="p-12">
                <h3 className="text-4xl font-bold text-white mb-6">
                  Ready to Transform Your Trading?
                </h3>
                <p className="text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
                  Join the elite community of profitable traders. Start with our free plan or unlock 
                  unlimited potential with Pro.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 px-8 text-lg shadow-lg"
                  >
                    <Crown className="w-5 h-5 mr-2" />
                    View Pricing Plans
                  </Button>
                  <Button
                    onClick={() => navigate('/app')}
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 font-semibold py-4 px-8 text-lg"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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