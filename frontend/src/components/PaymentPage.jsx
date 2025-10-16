import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Shield, Crown, CheckCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      alert('Payment simulation complete! In production, this would integrate with Stripe.');
      navigate('/app');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white relative overflow-hidden font-['Inter',sans-serif]">
      {/* Luxury Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-blue-900/10 to-purple-900/20"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-400/10 to-orange-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/10 to-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 py-12 px-8">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => navigate('/pricing')}
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pricing
            </Button>
            
            <div className="text-center">
              <Badge className="mb-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 text-lg font-medium px-6 py-3 rounded-full">
                <Crown className="w-5 h-5 mr-2 inline" />
                EnsoTrade Pro
              </Badge>
              <h1 className="text-4xl font-bold mb-4">Complete Your Purchase</h1>
              <p className="text-xl text-slate-300">Join thousands of profitable traders today</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Payment Form */}
            <Card className="bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <CreditCard className="w-6 h-6 mr-3 text-amber-400" />
                  Payment Details
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-transparent"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-transparent"
                      placeholder="4242 4242 4242 4242"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-transparent"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-amber-400/50 focus:border-transparent"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-300">Secure Payment</p>
                      <p className="text-xs text-slate-300">Your payment is protected by 256-bit SSL encryption</p>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold py-4 px-8 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Complete Payment - $29/month
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 shadow-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-slate-300">EnsoTrade Pro</span>
                    <span className="font-semibold">$29.00</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-slate-300">Tax</span>
                    <span className="font-semibold">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center py-3 text-xl font-bold">
                    <span>Total</span>
                    <span className="text-amber-400">$29.00/month</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">What's Included:</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-200">Unlimited Chart Analyses</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-200">Advanced AI Insights</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-200">Risk Management Tools</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-200">Priority Support</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-slate-200">Analysis History</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-sm text-green-300 text-center">
                    🎉 Special Launch Offer: First month only $29 (Save 50%)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              By completing this purchase, you agree to our Terms of Service and Privacy Policy. 
              Cancel anytime from your account settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;