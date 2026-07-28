/**
 * ChatPanel — conversational follow-up refinement with message history.
 */

import { MessageSquare, Send } from 'lucide-react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  chatMessage: string;
  setChatMessage: (v: string) => void;
  chatLoading: boolean;
  handleSendChat: () => void;
}

export default function ChatPanel({
  chatHistory, chatMessage, setChatMessage, chatLoading, handleSendChat,
}: ChatPanelProps) {
  return (
    <div className="panel-column">
      <div className="section-title">
        <MessageSquare size={14} /> Follow-Up Refinement
      </div>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {chatHistory.length === 0 ? (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '200px' }}>
              Generate a refined prompt first to start follow-up conversation.
            </p>
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div
              key={chat.id}
              style={{
                alignSelf: chat.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: chat.role === 'user' ? 'var(--border)' : 'var(--bg-input)',
                border: '1px solid var(--border)',
                padding: '12px',
                fontSize: '0.8rem',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.7rem', color: chat.role === 'user' ? 'var(--accent)' : 'var(--text-muted)' }}>
                {chat.role === 'user' ? 'DEVELOPER' : 'KIRA ARCHITECT'}
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{chat.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div style={{ padding: '16px', borderTop: '2px solid var(--border)', backgroundColor: 'var(--bg-input)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. 'make it shorter', 'add db logging'"
            disabled={chatHistory.length === 0 || chatLoading}
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
            style={{
              flex: 1,
              background: 'var(--bg)',
              color: 'var(--text)',
              border: '2px solid var(--border)',
              padding: '10px',
              fontSize: '0.8rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSendChat}
            disabled={chatHistory.length === 0 || chatLoading}
            className={`btn btn-accent ${chatHistory.length === 0 || chatLoading ? 'btn-disabled' : ''}`}
            style={{ padding: '10px' }}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
