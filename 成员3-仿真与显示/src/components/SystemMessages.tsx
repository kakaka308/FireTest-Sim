'use client';

import { useRef, useEffect } from 'react';
import type { MasterMessage } from '@/lib/types';
import { MessageSquare } from 'lucide-react';

interface SystemMessagesProps {
  messages: MasterMessage[];
}

const typeColorMap: Record<string, string> = {
  info: 'message-info',
  warning: 'message-warning',
  error: 'message-error',
  success: 'message-success',
};

export default function SystemMessages({ messages }: SystemMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="panel">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-medium text-gray-300">系统消息</span>
        <span className="text-xs text-gray-600 ml-auto">{messages.length} 条</span>
      </div>

      <div
        ref={scrollRef}
        className="h-32 overflow-y-auto space-y-0.5 font-mono text-xs bg-[#0a0a15] rounded-lg p-3 border border-[#1a1a3a]"
      >
        {messages.length === 0 ? (
          <div className="text-gray-600">暂无消息...</div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={typeColorMap[msg.type]}>
              <span className="text-gray-600">{msg.time}</span>
              {'  '}
              {msg.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
