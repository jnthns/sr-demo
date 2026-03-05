'use client'

import { useState } from "react";
import { logEvent, trackExposure, fetchVariant } from "../../lib/amplitude";

export default function ExperimentControls() {
  const [variantInfo, setVariantInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userProperties, setUserProperties] = useState({
    account_tier: '',
    plan_type: '',
    user_segment: ''
  });

  const handleFetchVariant = async () => {
    setIsLoading(true);
    try {
      const result = await fetchVariant(userProperties);
      setVariantInfo(result);

      logEvent('Experiment Fetch Triggered', {
        user_properties: userProperties,
        variant: result.variant,
        success: result.success
      });
    } catch (error) {
      console.error('Error fetching variant:', error);
      setVariantInfo({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserPropertyChange = (key, value) => {
    setUserProperties(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getVariantDisplayColor = (variant) => {
    if (!variant || variant === '{}' || variant === 'undefined') {
      return 'bg-zen-200 text-zen-700';
    }
    if (variant === 'control') {
      return 'bg-matcha-100 text-matcha-300';
    }
    if (variant !== ('control')) {
      return 'bg-glow-500/15 text-glow-300';
    }
    return 'bg-zen-300 text-zen-800';
  };

  return (
    <div className="w-full max-w-3xl bg-zen-100 glass-card rounded-2xl border border-zen-200 p-6 mb-6">
      <h2 className="text-lg font-semibold text-zen-800 mb-3">A/B Test & Feature Flag Playground</h2>
      
      <div className="mb-8 p-4 bg-zen-100 rounded-lg border border-zen-200">
        <h3 className="text-base font-semibold text-zen-700 mb-4">Experiment Controls</h3>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium text-zen-600">Current Variant:</span>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getVariantDisplayColor(variantInfo?.variant)}`}>
              {variantInfo?.variant || 'Not fetched'}
            </div>
          </div>
          {variantInfo?.metadata && Object.keys(variantInfo.metadata).length > 0 && (
            <div className="text-xs text-zen-500">
              Metadata: {JSON.stringify(variantInfo.metadata)}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleFetchVariant}
            disabled={isLoading}
            className="bg-matcha-500 hover:bg-matcha-600 disabled:bg-zen-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Fetching...</span>
              </>
            ) : (
              <span>Fetch Variant</span>
            )}
          </button>
          
          <button
            onClick={trackExposure}
            className="bg-glow-500 hover:bg-glow-600 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Track Exposure
          </button>
        </div>

        {variantInfo?.success === false && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-300">
            Error: {variantInfo.error}
          </div>
        )}
      </div>

      <div className="p-4 bg-zen-100 rounded-lg border border-zen-200">
        <h3 className="text-base font-semibold text-zen-700 mb-4">User Properties for Targeting</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="account_tier" className="block text-sm font-medium text-zen-600 mb-1">
              Account Tier
            </label>
            <select
              id="account_tier"
              value={userProperties.account_tier}
              onChange={(e) => handleUserPropertyChange('account_tier', e.target.value)}
              className="w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            >
              <option value="">Select tier</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="plan_type" className="block text-sm font-medium text-zen-600 mb-1">
              Plan Type
            </label>
            <select
              id="plan_type"
              value={userProperties.plan_type}
              onChange={(e) => handleUserPropertyChange('plan_type', e.target.value)}
              className="w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            >
              <option value="">Select plan</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="user_segment" className="block text-sm font-medium text-zen-600 mb-1">
              User Segment
            </label>
            <select
              id="user_segment"
              value={userProperties.user_segment}
              onChange={(e) => handleUserPropertyChange('user_segment', e.target.value)}
              className="w-full rounded-lg border border-zen-300 bg-zen-100 p-2 text-sm text-zen-800 focus:outline-none focus:ring-1 focus:ring-matcha-500/50"
            >
              <option value="">Select segment</option>
              <option value="new_user">New User</option>
              <option value="returning_user">Returning User</option>
              <option value="power_user">Power User</option>
              <option value="churned_user">Churned User</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
