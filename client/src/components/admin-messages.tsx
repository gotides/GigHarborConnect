import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, User, Clock, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Message } from "@shared/schema";

export default function AdminMessages() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);

  const { data: adminMessages = [], isLoading, error } = useQuery<Message[]>({
    queryKey: ["/api/messages/admin-messages"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-slate-200 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 mb-4">Failed to load admin messages</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (adminMessages.length === 0) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-500 mb-4">No messages for administrators found</p>
        <p className="text-sm text-gray-400">
          Users can send messages to administrators by using #administrator in Tide Talk
        </p>
      </div>
    );
  }

  // Group messages by channel
  const messagesByChannel = adminMessages.reduce((acc, message) => {
    const channel = message.channel || 'general';
    if (!acc[channel]) {
      acc[channel] = [];
    }
    acc[channel].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  const channels = Object.keys(messagesByChannel);

  return (
    <div className="space-y-6">
      {/* Channel Filter */}
      {channels.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedChannel === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedChannel(null)}
          >
            All Channels ({adminMessages.length})
          </Button>
          {channels.map((channel) => (
            <Button
              key={channel}
              variant={selectedChannel === channel ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedChannel(channel)}
            >
              #{channel} ({messagesByChannel[channel].length})
            </Button>
          ))}
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {(selectedChannel ? messagesByChannel[selectedChannel] : adminMessages)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((message) => (
            <Card key={message.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-sm font-medium">
                    {message.authorInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.authorName}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        #{message.channel || 'general'}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </div>
                      {message.editedAt && (
                        <span className="text-xs text-gray-400">(edited)</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 break-words">
                      {message.content}
                    </div>
                    {/* Show #administrator hashtag indicator */}
                    <div className="flex items-center gap-1 mt-2">
                      <Hash className="w-3 h-3 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">administrator</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}