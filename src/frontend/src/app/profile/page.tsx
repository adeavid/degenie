'use client';

import { useState, useEffect } from 'react';

// Force this page to be client-side only
export const dynamic = 'force-dynamic';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  User,
  Edit3,
  Camera,
  Save,
  ExternalLink,
  Trophy,
  Star,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Twitter,
  Globe,
  Copy,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatAddress, formatNumber, getTimeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';

interface UserProfile {
  username: string;
  bio: string;
  avatar: string;
  walletAddress: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  joinedAt: number;
  stats: {
    tokensCreated: number;
    tokensGraduated: number;
    totalVolume: number;
    followers: number;
    following: number;
  };
  badges: string[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: number;
  }>;
}

// Mock data
const mockProfile: UserProfile = {
  username: 'CryptoCreator',
  bio: 'Building the future of meme coins with AI. 🚀 Always looking for the next 100x gem.',
  avatar: '',
  walletAddress: 'So11111111111111111111111111111111111111112',
  website: 'https://mycryptosite.com',
  twitter: 'https://twitter.com/cryptocreator',
  telegram: 'https://t.me/cryptocreator',
  joinedAt: Date.now() - (86400000 * 30), // 30 days ago
  stats: {
    tokensCreated: 12,
    tokensGraduated: 3,
    totalVolume: 145000,
    followers: 1250,
    following: 340
  },
  badges: ['Early Adopter', 'Token Creator', 'Viral Master'],
  achievements: [
    {
      id: '1',
      name: 'First Token',
      description: 'Created your first token on DeGenie',
      icon: '🎯',
      unlockedAt: Date.now() - (86400000 * 25)
    },
    {
      id: '2',
      name: 'Graduation Master',
      description: 'Had a token graduate to 500 SOL',
      icon: '🎓',
      unlockedAt: Date.now() - (86400000 * 15)
    },
    {
      id: '3',
      name: 'Community Builder',
      description: 'Reached 1000 followers',
      icon: '👥',
      unlockedAt: Date.now() - (86400000 * 10)
    }
  ]
};

export default function Profile() {
  const { connected, address: publicKey } = useWalletConnection();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: profile.username,
    bio: profile.bio,
    website: profile.website || '',
    twitter: profile.twitter || '',
    telegram: profile.telegram || ''
  });

  useEffect(() => {
    if (!connected) {
      router.push('/');
    }
  }, [connected, router]);

  const handleSave = () => {
    setProfile(prev => ({
      ...prev,
      username: editForm.username,
      bio: editForm.bio,
      website: editForm.website,
      twitter: editForm.twitter,
      telegram: editForm.telegram
    }));
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      toast.success('Wallet address copied!');
    }
  };

  const shareProfile = () => {
    const url = `${window.location.origin}/profile/${publicKey?.toString()}`;
    navigator.clipboard.writeText(url);
    toast.success('Profile link copied!');
  };

  if (!connected) {
    return null;
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Profile Header */}
        <Card className="bg-gray-800/50 border-gray-700 mb-8">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {profile.username.charAt(0)}
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <Input
                      value={editForm.username}
                      onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Username"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Bio"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
                      <div className="flex space-x-1">
                        {profile.badges.map((badge) => (
                          <span key={badge} className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs font-medium">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-300 mb-3">{profile.bio}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Joined {getTimeAgo(profile.joinedAt)}
                      </div>
                      <button
                        onClick={copyAddress}
                        className="flex items-center hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        {formatAddress(publicKey?.toString() || '')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareProfile}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gray-800/50 border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.tokensCreated)}</div>
            <div className="text-gray-400 text-sm">Tokens Created</div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.tokensGraduated)}</div>
            <div className="text-gray-400 text-sm">Graduated</div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-white">${formatNumber(profile.stats.totalVolume)}</div>
            <div className="text-gray-400 text-sm">Total Volume</div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.followers)}</div>
            <div className="text-gray-400 text-sm">Followers</div>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-white">{formatNumber(profile.stats.following)}</div>
            <div className="text-gray-400 text-sm">Following</div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Social Links */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Social Links</h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
                    <Input
                      value={editForm.website}
                      onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Twitter</label>
                    <Input
                      value={editForm.twitter}
                      onChange={(e) => setEditForm(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="https://twitter.com/username"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telegram</label>
                    <Input
                      value={editForm.telegram}
                      onChange={(e) => setEditForm(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="https://t.me/username"
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <Globe className="w-4 h-4 mr-3" />
                      Website
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                  {profile.twitter && (
                    <a
                      href={profile.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Twitter className="w-4 h-4 mr-3" />
                      Twitter
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                  {profile.telegram && (
                    <a
                      href={profile.telegram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 mr-3" />
                      Telegram
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  )}
                  {!profile.website && !profile.twitter && !profile.telegram && (
                    <p className="text-gray-400 text-sm">No social links added yet</p>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Achievements */}
          <Card className="bg-gray-800/50 border-gray-700">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
              <div className="space-y-4">
                {profile.achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center space-x-4 p-3 bg-gray-900/50 rounded-lg"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{achievement.name}</div>
                      <div className="text-gray-400 text-sm">{achievement.description}</div>
                      <div className="text-gray-500 text-xs mt-1">
                        Unlocked {getTimeAgo(achievement.unlockedAt)}
                      </div>
                    </div>
                    <Trophy className="w-5 h-5 text-yellow-400" />
                  </motion.div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}