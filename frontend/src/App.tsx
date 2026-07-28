/**
 * KIRA Prompt Console — Root application layout.
 * All logic is delegated to custom hooks; all UI is delegated to components.
 */

import { useState } from 'react';
import { Database } from 'lucide-react';
import { useApi } from './hooks/useApi';
import { useMcpStatus } from './hooks/useMcpStatus';
import Sidebar from './components/Sidebar';
import ConsoleView from './components/ConsoleView';
import ChatPanel from './components/ChatPanel';
import LogsDashboard from './components/LogsDashboard';

export default function App() {
  const [session_id] = useState<string>(() => `sess-${Math.random().toString(36).substr(2, 9)}`);
  const [activeTab, setActiveTab] = useState<'forge' | 'logs'>('forge');

  const api = useApi(session_id);
  const mcpServers = useMcpStatus();

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={api.profile}
        updateProfile={api.updateProfile}
        memories={api.memories}
        newFact={api.newFact}
        setNewFact={api.setNewFact}
        newCategory={api.newCategory}
        setNewCategory={api.setNewCategory}
        handleAddMemory={api.handleAddMemory}
        handleDeleteMemory={api.handleDeleteMemory}
        mcpServers={mcpServers}
      />

      <main className="main-content">
        <header className="top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>POSTGRESQL ACTIVE</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Session ID: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{session_id}</span>
          </div>
        </header>

        {activeTab === 'forge' ? (
          <div className="workspace-panel">
            <ConsoleView
              rawPrompt={api.rawPrompt}
              setRawPrompt={api.setRawPrompt}
              refinedPrompt={api.refinedPrompt}
              density={api.density}
              setDensity={api.setDensity}
              loading={api.loading}
              copied={api.copied}
              updateProfile={api.updateProfile}
              handleRefine={api.handleRefine}
              copyToClipboard={api.copyToClipboard}
            />
            <ChatPanel
              chatHistory={api.chatHistory}
              chatMessage={api.chatMessage}
              setChatMessage={api.setChatMessage}
              chatLoading={api.chatLoading}
              handleSendChat={api.handleSendChat}
            />
          </div>
        ) : (
          <LogsDashboard
            mcpServers={mcpServers}
            mcpLogs={api.mcpLogs}
            historyList={api.historyList}
            fetchLogsAndHistory={api.fetchLogsAndHistory}
          />
        )}
      </main>
    </div>
  );
}
