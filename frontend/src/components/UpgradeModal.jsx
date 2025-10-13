import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Crown, Check, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const UpgradeModal = ({ isOpen, onClose, creditsRemaining = 0 }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/user/upgrade-to-pro`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Refresh the page or update user state
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.detail || 'Upgrade failed. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-slate-300 text-lg">
            You've used all {5 - creditsRemaining} of your free analyses. Upgrade to Pro for unlimited access!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Plan */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="text-lg text-slate-300 flex items-center justify-between">
                  Free Plan
                  <X className="w-5 h-5 text-red-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-red-400" />
                    <span>5 analyses per month</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-red-400" />
                    <span>Basic chart analysis only</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-red-400" />
                    <span>No indicator analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-red-400" />
                    <span>Limited trading strategies</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-600">
                  <p className="text-2xl font-bold text-slate-300">Free</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-400/30 ring-2 ring-amber-400/20">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center justify-between">
                  Pro Plan
                  <Crown className="w-5 h-5 text-amber-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Unlimited analyses</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Advanced technical analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Full indicator analysis</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Custom trading strategies</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Risk management tools</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-300">
                    <Check className="w-4 h-4 text-green-400" />
                    <span>Take profit & stop loss suggestions</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-400/30">
                  <p className="text-3xl font-bold text-amber-300">$29<span className="text-lg text-slate-300">/month</span></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Alert className="border-red-400/50 bg-red-500/10 text-red-200">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            >
              {isUpgrading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>Upgrade to Pro - $29/month</span>
                </div>
              )}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-slate-400 text-sm">
              * This is a demo. In a real app, you would be redirected to a payment processor.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;