import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Anchor, Send, Search, Settings, Paperclip, Smile, Flag, Circle, Edit2, Trash2, Check, X, Hash, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Message } from "@shared/schema";

const channels = [
  { id: "general", name: "general", active: true },
  { id: "announcements", name: "announcements", active: false },
  { id: "sports", name: "sports", active: false },
  { id: "homework-help", name: "homework-help", active: false },
  { id: "events", name: "events", active: false },
];

const authorColors = [
  "hsl(220, 70%, 50%)",
  "hsl(200, 70%, 50%)",
  "hsl(150, 70%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(30, 70%, 50%)",
  "hsl(340, 70%, 50%)",
];

function getAuthorColor(name: string): string {
  const index = name.length % authorColors.length;
  return authorColors[index];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Available hashtags for filtering
const availableHashtags = [
  "general",
  "announcements", 
  "sports",
  "homework-help",
  "events",
  "games",
  "practice",
  "team",
  "social"
];

export default function ChatView() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [messageContent, setMessageContent] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  const { data: messages = [], isLoading, error: messagesError } = useQuery<Message[]>({
    queryKey: ["/api/messages", activeChannel],
    refetchInterval: 3000, // Poll every 3 seconds for new messages
    retry: false,
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["/api/profiles"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      content: string;
      channel: string;
    }) => {
      const response = await apiRequest("POST", "/api/messages", messageData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageContent("");
    },
  });

  const markInappropriateMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/inappropriate`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message flagged",
        description: "The message has been marked as inappropriate and hidden.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to flag message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      const response = await apiRequest("PUT", `/api/messages/${messageId}`, { content });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setEditingMessageId(null);
      setEditingContent("");
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("DELETE", `/api/messages/${messageId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!messageContent.trim()) return;

    let content = messageContent;
    
    // Add #general tag if no hashtag is present and we're in general channel
    if (activeChannel === "general" && !content.includes("#")) {
      content = `${content} #general`;
    }

    const messageData = {
      content,
      channel: activeChannel,
    };

    sendMessageMutation.mutate(messageData);
  };

  const handleEditMessage = (messageId: number, currentContent: string) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent);
  };

  const handleSaveEdit = () => {
    if (!editingContent.trim() || !editingMessageId) return;
    editMessageMutation.mutate({ messageId: editingMessageId, content: editingContent });
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleDeleteMessage = (messageId: number) => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMessageMutation.mutate(messageId);
    }
  };

  const canEditOrDeleteMessage = (message: Message) => {
    return user && message.authorId === user.id;
  };

  const getMessageAuthorProfile = (message: Message) => {
    return profiles.find((profile: any) => profile.id === message.authorId);
  };

  // Extract hashtags from message content
  const extractHashtags = (content: string): string[] => {
    const hashtagRegex = /#(\w+)/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.slice(1).toLowerCase()) : [];
  };

  // Filter messages based on selected hashtag and sort from latest to earliest
  const filteredMessages = (selectedHashtag 
    ? messages.filter(message => {
        const hashtags = extractHashtags(message.content);
        return hashtags.includes(selectedHashtag);
      })
    : messages
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Get unique hashtags from all messages
  const messageHashtags = Array.from(new Set(
    messages.flatMap(message => extractHashtags(message.content))
  )).filter(tag => availableHashtags.includes(tag));

  // Render message content with highlighted hashtags
  const renderMessageContent = (content: string) => {
    const hashtagRegex = /#(\w+)/g;
    const parts = content.split(hashtagRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a hashtag (captured group)
        const hashtag = part.toLowerCase();
        if (availableHashtags.includes(hashtag)) {
          return (
            <span
              key={index}
              className="inline-block bg-columbia/20 text-columbia px-1.5 py-0.5 rounded text-sm font-medium cursor-pointer hover:bg-columbia/30 transition-colors"
              onClick={() => setSelectedHashtag(hashtag)}
            >
              #{hashtag}
            </span>
          );
        }
        return `#${part}`;
      }
      return part;
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check for permission errors
  const isMessagesBlocked = messagesError && (messagesError.message.includes('403') || messagesError.message.includes('Insufficient permissions'));

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg h-[700px] flex flex-col">
        <div className="animate-pulse p-6 space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show permission denied message for guests
  if (isMessagesBlocked) {
    return (
      <div className="bg-white rounded-xl shadow-lg h-[700px] flex flex-col">
        <div className="p-6 text-center flex-1 flex items-center justify-center">
          <div>
            <Lock className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">Tide Talk Access Restricted</h3>
            <p className="text-slate-500 mb-4">
              You need team member access to participate in team chat channels.
            </p>
            <p className="text-sm text-slate-400">
              Contact a team administrator to request access to join the conversation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden h-[700px] flex flex-col">
      {/* Chat Header */}
      <div className="gradient-navy-columbia p-4 text-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" className="text-white" key="waterpolo-ball-v2">
              {/* Water polo/volleyball ball */}
              <circle 
                cx="12" 
                cy="12" 
                r="9.5" 
                fill="currentColor"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.5"
              />
              {/* Main curved seam lines forming the classic volleyball pattern */}
              <path 
                d="M2.5 12 C2.5 6.5 6.5 2.5 12 2.5 C17.5 2.5 21.5 6.5 21.5 12 C17.5 8 16 12 12 12 C8 12 6.5 8 2.5 12 Z" 
                fill="none" 
                stroke="rgba(0,0,0,0.5)" 
                strokeWidth="1.2"
              />
              <path 
                d="M2.5 12 C6.5 16 8 12 12 12 C16 12 17.5 16 21.5 12 C21.5 17.5 17.5 21.5 12 21.5 C6.5 21.5 2.5 17.5 2.5 12 Z" 
                fill="none" 
                stroke="rgba(0,0,0,0.5)" 
                strokeWidth="1.2"
              />
              {/* Center horizontal line */}
              <line 
                x1="3" 
                y1="12" 
                x2="21" 
                y2="12" 
                stroke="rgba(0,0,0,0.4)" 
                strokeWidth="1"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold">Tide Talk</h2>
            <p className="text-blue-100 text-sm">Connected to #{activeChannel}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="hover:bg-white/20 text-white">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="hover:bg-white/20 text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Channel Selection */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex space-x-2 overflow-x-auto">
          {channels.map((channel) => (
            <Button
              key={channel.id}
              variant={activeChannel === channel.id ? "default" : "secondary"}
              size="sm"
              onClick={() => setActiveChannel(channel.id)}
              className={`whitespace-nowrap ${
                activeChannel === channel.id
                  ? "bg-columbia text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              # {channel.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Hashtag Filter */}
      <div className="border-b border-slate-200 p-4 bg-slate-50">
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Filter by hashtag:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedHashtag === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedHashtag(null)}
            className={selectedHashtag === null ? "bg-navy text-white" : ""}
          >
            All Messages
          </Button>
          {messageHashtags.map((hashtag) => (
            <Button
              key={hashtag}
              variant={selectedHashtag === hashtag ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedHashtag(hashtag)}
              className={`${
                selectedHashtag === hashtag 
                  ? "bg-columbia text-white" 
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              #{hashtag}
            </Button>
          ))}
        </div>
        {selectedHashtag && (
          <div className="mt-2 text-xs text-slate-500">
            Showing {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''} with #{selectedHashtag}
          </div>
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8">
            {selectedHashtag ? (
              <>
                <p className="text-slate-500">No messages with #{selectedHashtag} in #{activeChannel}.</p>
                <p className="text-slate-400 text-sm mt-2">Try a different hashtag or view all messages.</p>
              </>
            ) : (
              <>
                <p className="text-slate-500">No messages in #{activeChannel} yet.</p>
                <p className="text-slate-400 text-sm mt-2">Be the first to start the conversation!</p>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Today's messages */}
            <div className="text-center py-2">
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {format(new Date(), "MMMM d, yyyy")}
              </span>
            </div>

            {filteredMessages.map((message) => {
              const authorProfile = getMessageAuthorProfile(message);
              return (
              <div key={message.id} className="flex items-start space-x-3 group">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {authorProfile?.profilePhoto ? (
                    <img
                      src={`/api/profiles/${authorProfile.id}/photo`}
                      alt={message.authorName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: message.authorColor }}
                    >
                      <span className="text-white text-xs font-bold">
                        {message.authorInitials}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-slate-800">
                      {message.authorName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {format(new Date(message.createdAt), "MMM d, h:mm a")}
                    </span>
                    {message.editedAt && (
                      <span className="text-xs text-slate-400 italic">
                        (edited)
                      </span>
                    )}
                  </div>
                  
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="text-sm"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSaveEdit();
                          }
                          if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                      />
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={editMessageMutation.isPending}
                          className="h-7 text-xs bg-columbia hover:bg-blue-600"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-7 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-700">
                      {renderMessageContent(message.content)}
                    </p>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  {canEditOrDeleteMessage(message) && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMessage(message.id, message.content)}
                        className="text-slate-400 hover:text-blue-500 hover:bg-blue-50"
                        title="Edit message"
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Delete message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markInappropriateMutation.mutate(message.id)}
                    className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                    title="Mark as inappropriate"
                  >
                    <Flag className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )})}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-slate-200 p-4">
        {hasPermission('canCreateMessages') ? (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
              <Paperclip className="w-4 h-4" />
            </Button>
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Share with the team..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pr-10 bg-slate-100 border-0 focus:ring-2 focus:ring-columbia focus:bg-white"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-columbia"
              >
                <Smile className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sendMessageMutation.isPending}
              className="bg-columbia hover:bg-blue-600 text-white"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-3 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
            <Lock className="w-4 h-4 text-slate-400 mr-2" />
            <span className="text-sm text-slate-500">
              You have view-only access to Tide Talk
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
