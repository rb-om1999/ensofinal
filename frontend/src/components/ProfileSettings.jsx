import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Crown, User, DollarSign, TrendingUp } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProfileSettings = ({ user, onClose }) => {
  const [formData, setFormData] = useState({
    riskProfile: '',
    balance: '',
    tradingStyle: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isPro = user?.plan === 'pro' || user?.is_admin;

  useEffect(() => {
    if (user) {
      setFormData({
        riskProfile: user.risk_profile || '',
        balance: user.balance || '',
        tradingStyle: user.trading_style || ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/user/profile`, {
        risk_profile: formData.riskProfile,
        balance: formData.balance,
        trading_style: formData.tradingStyle
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            Profile Settings
          </CardTitle>
          <CardDescription className="text-slate-300">
            {isPro ? 'Configure your trading preferences for personalized analysis' : 'Upgrade to Pro to access advanced settings'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white font-medium">Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-white/10 border-white/20 text-slate-300"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  Plan
                  {isPro && <Crown className="w-4 h-4 text-amber-400" />}
                </Label>
                <Input
                  value={user?.is_admin ? 'Admin' : (user?.plan === 'pro' ? 'Pro' : 'Free')}
                  disabled
                  className="bg-white/10 border-white/20 text-slate-300"
                />
              </div>
            </div>

            {/* Credits Display for Free Users */}
            {!isPro && (
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">Monthly Credits</h4>
                    <p className="text-slate-400 text-sm">Resets on the 1st of each month</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">{user?.credits_remaining || 0}/5</p>
                    <p className="text-slate-400 text-sm">remaining</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pro Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <h4 className="text-lg font-semibold text-white">Trading Preferences</h4>
                {!isPro && <Crown className="w-4 h-4 text-amber-400" />}
              </div>

              {!isPro && (
                <Alert className="border-amber-400/50 bg-amber-500/10 text-amber-200">
                  <Crown className="w-4 h-4" />
                  <AlertDescription>
                    Upgrade to Pro to access risk profile settings, trading balance configuration, and personalized analysis strategies.
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white font-medium flex items-center gap-2">
                    Risk Profile
                    {!isPro && <Crown className="w-3 h-3 text-amber-400" />}
                  </Label>
                  <Select 
                    value={formData.riskProfile} 
                    onValueChange={(value) => setFormData({...formData, riskProfile: value})}
                    disabled={!isPro}
                  >
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

                <div className="space-y-2">
                  <Label className="text-white font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Trading Balance
                    {!isPro && <Crown className="w-3 h-3 text-amber-400" />}
                  </Label>
                  <Input
                    placeholder="e.g., $10,000"
                    value={formData.balance}
                    onChange={(e) => setFormData({...formData, balance: e.target.value})}
                    disabled={!isPro}
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-slate-400 focus:border-amber-400 focus:bg-white/15 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white font-medium flex items-center gap-2">
                  Preferred Trading Style
                  {!isPro && <Crown className="w-3 h-3 text-amber-400" />}
                </Label>
                <Select 
                  value={formData.tradingStyle} 
                  onValueChange={(value) => setFormData({...formData, tradingStyle: value})}
                  disabled={!isPro}
                >
                  <SelectTrigger className="bg-white/10 backdrop-blur-sm border-white/20 text-white focus:border-amber-400 focus:bg-white/15 transition-all duration-200">
                    <SelectValue placeholder="Select trading style" />
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
            </div>

            {error && (
              <Alert className="border-red-400/50 bg-red-500/10 text-red-200">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-400/50 bg-green-500/10 text-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isPro}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;