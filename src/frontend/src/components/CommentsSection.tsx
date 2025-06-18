'use client';

import { useState } from 'react';
import { useWalletConnection } from '@/hooks/useWalletConnection';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Heart, 
  Reply, 
  MoreHorizontal,
  Send,
  Trash2,
  Flag,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatAddress, getTimeAgo } from '@/lib/utils';
import { apiService } from '@/lib/api';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  replies?: Comment[];
  likes: number;
  isLiked?: boolean;
  isOwner?: boolean;
}

interface CommentsSectionProps {
  comments: Comment[];
  tokenAddress: string;
  onCommentAdd: (comment: Comment) => void;
}

interface CommentItemProps {
  comment: Comment;
  level: number;
  tokenAddress: string;
  onReply: (parentId: string, content: string) => void;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
}

function CommentItem({ comment, level, tokenAddress, onReply, onLike, onDelete }: CommentItemProps) {
  const { connected, publicKey } = useWalletConnection();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = connected && publicKey?.toString() === comment.author;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleReplySubmit = async () => {
    if (!replyContent.trim() || !connected) return;

    setIsSubmittingReply(true);
    try {
      await onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setShowReplyBox(false);
      toast.success('Reply posted!');
    } catch (error) {
      toast.error('Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLike = () => {
    if (!connected) {
      toast.error('Connect wallet to like comments');
      return;
    }
    onLike(comment.id);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      onDelete(comment.id);
    }
  };

  return (
    <div className={cn("space-y-3", level > 0 && "ml-8 pl-4 border-l border-gray-700")}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/30 rounded-lg p-4"
      >
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold">
              {formatAddress(comment.author, 2).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-300">
                  {formatAddress(comment.author)}
                </span>
                {isOwner && (
                  <span className="text-xs bg-purple-600 px-2 py-0.5 rounded text-white">
                    You
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500">
                {getTimeAgo(comment.timestamp)}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Button
              onClick={() => setShowMenu(!showMenu)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-32">
                {isOwner && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-gray-700 rounded-t-lg"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    toast('Report functionality coming soon', { icon: 'ℹ️' });
                    setShowMenu(false);
                  }}
                  className={cn(
                    "flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-400 hover:bg-gray-700",
                    isOwner ? "rounded-b-lg" : "rounded-lg"
                  )}
                >
                  <Flag className="w-3 h-3" />
                  <span>Report</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comment Content */}
        <p className="text-gray-200 text-sm leading-relaxed mb-3">
          {comment.content}
        </p>

        {/* Comment Actions */}
        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={handleLike}
            className={cn(
              "flex items-center space-x-1 hover:text-red-400 transition-colors",
              comment.isLiked ? "text-red-400" : "text-gray-500"
            )}
          >
            <Heart className={cn("w-3 h-3", comment.isLiked && "fill-current")} />
            <span>{comment.likes}</span>
          </button>
          
          <button
            onClick={() => setShowReplyBox(!showReplyBox)}
            className="flex items-center space-x-1 text-gray-500 hover:text-purple-400 transition-colors"
          >
            <Reply className="w-3 h-3" />
            <span>Reply</span>
          </button>
          
          {hasReplies && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-400 transition-colors"
            >
              {showReplies ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
              <span>{comment.replies?.length} {comment.replies?.length === 1 ? 'reply' : 'replies'}</span>
            </button>
          )}
        </div>

        {/* Reply Box */}
        <AnimatePresence>
          {showReplyBox && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 pt-3 border-t border-gray-700"
            >
              <div className="flex space-x-2">
                <Input
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={`Reply to ${formatAddress(comment.author)}...`}
                  className="flex-1 bg-gray-800 border-gray-600 text-sm"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReplySubmit();
                    }
                  }}
                />
                <Button
                  onClick={handleReplySubmit}
                  disabled={!replyContent.trim() || isSubmittingReply || !connected}
                  size="sm"
                  className="px-3"
                >
                  {isSubmittingReply ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Send className="w-3 h-3" />
                    </motion.div>
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Replies */}
      <AnimatePresence>
        {showReplies && hasReplies && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3"
          >
            {comment.replies?.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                level={level + 1}
                tokenAddress={tokenAddress}
                onReply={onReply}
                onLike={onLike}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CommentsSection({ comments, tokenAddress, onCommentAdd }: CommentsSectionProps) {
  const { connected, publicKey, connectWallet } = useWalletConnection();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');

  const sortedComments = [...comments].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.timestamp - b.timestamp;
      case 'most_liked':
        return b.likes - a.likes;
      case 'newest':
      default:
        return b.timestamp - a.timestamp;
    }
  });

  const handleSubmitComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    if (!connected) {
      connectWallet();
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.postComment({
        tokenAddress,
        content: newComment.trim(),
        author: publicKey?.toString() || ''
      });

      if (response.data) {
        onCommentAdd(response.data);
        setNewComment('');
        toast.success('Comment posted!');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (parentId: string, content: string) => {
    if (!connected) return;

    try {
      const response = await apiService.postComment({
        tokenAddress,
        content,
        author: publicKey?.toString() || '',
        parentId
      });

      if (response.data) {
        // Refresh comments to get updated replies
        window.location.reload(); // Temporary solution - in real app, update state properly
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLike = async (commentId: string) => {
    if (!connected) return;

    try {
      await apiService.likeComment(commentId, publicKey?.toString() || '');
      // Refresh comments to get updated likes
      window.location.reload(); // Temporary solution - in real app, update state properly
    } catch (error) {
      toast.error('Failed to like comment');
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await apiService.deleteComment(commentId, publicKey?.toString() || '');
      // Refresh comments
      window.location.reload(); // Temporary solution - in real app, update state properly
      toast.success('Comment deleted');
    } catch (error) {
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-200">
            Discussion ({comments.length})
          </h4>
          
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'most_liked')}
            className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-gray-300"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>

        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-sm font-bold">
              {connected ? formatAddress(publicKey?.toString() || '', 2).slice(0, 2).toUpperCase() : '?'}
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={connected ? "Share your thoughts..." : "Connect wallet to comment"}
              disabled={!connected}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
            />
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {newComment.length}/500 characters
              </span>
              
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting || !connected}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 mr-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </motion.div>
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No comments yet</p>
            <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              level={0}
              tokenAddress={tokenAddress}
              onReply={handleReply}
              onLike={handleLike}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}