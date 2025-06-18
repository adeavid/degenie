'use client';

import { useState, useEffect } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Settings,
  Bell,
  Shield,
  Palette,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  MessageSquare,
  Zap,
  Crown,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface SettingsData {
  notifications: {
    email: boolean;
    push: boolean;
    tokenUpdates: boolean;
    priceAlerts: boolean;
    graduationAlerts: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showPortfolio: boolean;
    showActivity: boolean;
    dataCollection: boolean;
  };
  preferences: {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    currency: string;
    soundEffects: boolean;
    animations: boolean;
  };
  subscription: {
    tier: 'free' | 'starter' | 'viral';
    autoRenew: boolean;
    billingEmail: string;
  };
}

const mockSettings: SettingsData = {
  notifications: {
    email: true,
    push: true,
    tokenUpdates: true,
    priceAlerts: false,
    graduationAlerts: true,
    marketingEmails: false
  },
  privacy: {
    profilePublic: true,
    showPortfolio: false,
    showActivity: true,
    dataCollection: true
  },
  preferences: {
    theme: 'dark',
    language: 'en',
    currency: 'USD',
    soundEffects: true,
    animations: true
  },
  subscription: {
    tier: 'starter',
    autoRenew: true,
    billingEmail: 'user@example.com'
  }
};

const settingsSections = [
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'privacy', name: 'Privacy & Security', icon: Shield },
  { id: 'preferences', name: 'Preferences', icon: Palette },
  { id: 'subscription', name: 'Subscription', icon: Crown },
];

const tiers = [
  {
    name: 'Free',
    price: '$0',
    features: ['5 AI credits/month', 'Basic logo generation', 'Community support'],
    color: 'gray'
  },
  {
    name: 'Starter',
    price: '$19',
    features: ['50 AI credits/month', 'Advanced generation', 'Priority support', 'Analytics dashboard'],
    color: 'blue'
  },
  {
    name: 'Viral',
    price: '$49',
    features: ['Unlimited AI credits', 'Premium models', '24/7 support', 'Advanced analytics', 'Custom branding'],
    color: 'purple'
  }
];

export default function SettingsPage() {
  const { connected, address: publicKey } = useWalletConnection();
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData>(mockSettings);
  const [activeSection, setActiveSection] = useState('notifications');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  const updateSetting = <T extends keyof SettingsData>(
    section: T,
    key: keyof SettingsData[T],
    value: any
  ) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeTier = (tier: string) => {
    toast.success(`Upgrading to ${tier} tier...`);
    // Implement actual upgrade logic
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400">Manage your account preferences and notifications</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-4">
                <nav className="space-y-2">
                  {settingsSections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                          activeSection === section.id
                            ? "bg-purple-600 text-white"
                            : "text-gray-300 hover:text-white hover:bg-gray-700"
                        )}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{section.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800/50 border-gray-700">
              <div className="p-6">
                {/* Notifications */}
                {activeSection === 'notifications' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Notification Settings</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-5 h-5 text-blue-400" />
                          <div>
                            <div className="text-white font-medium">Email Notifications</div>
                            <div className="text-gray-400 text-sm">Receive notifications via email</div>
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'email', !settings.notifications.email)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.notifications.email ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.notifications.email ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="w-5 h-5 text-green-400" />
                          <div>
                            <div className="text-white font-medium">Push Notifications</div>
                            <div className="text-gray-400 text-sm">Receive push notifications on your device</div>
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'push', !settings.notifications.push)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.notifications.push ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.notifications.push ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Zap className="w-5 h-5 text-yellow-400" />
                          <div>
                            <div className="text-white font-medium">Token Updates</div>
                            <div className="text-gray-400 text-sm">Notifications about your tokens</div>
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'tokenUpdates', !settings.notifications.tokenUpdates)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.notifications.tokenUpdates ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.notifications.tokenUpdates ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Bell className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="text-white font-medium">Graduation Alerts</div>
                            <div className="text-gray-400 text-sm">When your tokens graduate</div>
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'graduationAlerts', !settings.notifications.graduationAlerts)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.notifications.graduationAlerts ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.notifications.graduationAlerts ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Privacy */}
                {activeSection === 'privacy' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Privacy & Security</h2>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Public Profile</div>
                          <div className="text-gray-400 text-sm">Allow others to view your profile</div>
                        </div>
                        <button
                          onClick={() => updateSetting('privacy', 'profilePublic', !settings.privacy.profilePublic)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.privacy.profilePublic ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.privacy.profilePublic ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Show Portfolio</div>
                          <div className="text-gray-400 text-sm">Display your portfolio value publicly</div>
                        </div>
                        <button
                          onClick={() => updateSetting('privacy', 'showPortfolio', !settings.privacy.showPortfolio)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.privacy.showPortfolio ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.privacy.showPortfolio ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Preferences */}
                {activeSection === 'preferences' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Preferences</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-white font-medium mb-2">Theme</label>
                        <div className="flex space-x-3">
                          {[
                            { id: 'dark', name: 'Dark', icon: Moon },
                            { id: 'light', name: 'Light', icon: Sun },
                            { id: 'auto', name: 'Auto', icon: Smartphone }
                          ].map((theme) => {
                            const Icon = theme.icon;
                            return (
                              <button
                                key={theme.id}
                                onClick={() => updateSetting('preferences', 'theme', theme.id)}
                                className={cn(
                                  "flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-colors",
                                  settings.preferences.theme === theme.id
                                    ? "border-purple-500 bg-purple-500/20 text-white"
                                    : "border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500"
                                )}
                              >
                                <Icon className="w-4 h-4" />
                                <span>{theme.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {settings.preferences.soundEffects ? (
                            <Volume2 className="w-5 h-5 text-green-400" />
                          ) : (
                            <VolumeX className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <div className="text-white font-medium">Sound Effects</div>
                            <div className="text-gray-400 text-sm">Play sounds for interactions</div>
                          </div>
                        </div>
                        <button
                          onClick={() => updateSetting('preferences', 'soundEffects', !settings.preferences.soundEffects)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.preferences.soundEffects ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.preferences.soundEffects ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Subscription */}
                {activeSection === 'subscription' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-xl font-bold text-white mb-4">Subscription Management</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {tiers.map((tier) => (
                        <div
                          key={tier.name}
                          className={cn(
                            "p-4 rounded-lg border-2 transition-all",
                            settings.subscription.tier === tier.name.toLowerCase()
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-gray-600 bg-gray-700"
                          )}
                        >
                          <div className="text-center">
                            <h3 className="text-lg font-bold text-white mb-2">{tier.name}</h3>
                            <div className="text-2xl font-bold text-purple-400 mb-4">{tier.price}<span className="text-sm text-gray-400">/month</span></div>
                            <ul className="space-y-2 mb-4">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="text-gray-300 text-sm">{feature}</li>
                              ))}
                            </ul>
                            {settings.subscription.tier === tier.name.toLowerCase() ? (
                              <div className="bg-green-500/20 text-green-400 px-3 py-2 rounded text-sm font-medium">
                                Current Plan
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => upgradeTier(tier.name)}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                Upgrade
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Auto-renewal</div>
                          <div className="text-gray-400 text-sm">Automatically renew your subscription</div>
                        </div>
                        <button
                          onClick={() => updateSetting('subscription', 'autoRenew', !settings.subscription.autoRenew)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                            settings.subscription.autoRenew ? "bg-purple-600" : "bg-gray-600"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                              settings.subscription.autoRenew ? "translate-x-6" : "translate-x-1"
                            )}
                          />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Save Button */}
                <div className="flex justify-end pt-6 border-t border-gray-700">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}