/**
 * KIRA Prompt Intelligence Console — App Shell.
 * Integrates 4 tabs (Home, Sessions, Graph, Memory) with ChatGPT-style conversation and live Neon PostgreSQL wiring.
 */

import { useState } from 'react';
import { useApi } from './hooks/useApi';
import { CustomCursor } from './components/CustomCursor';
import { NeuralBackground } from './components/NeuralBackground';
import { Header } from './components/Header';
import { HomeTab } from './components/HomeTab';
import { MemoryTab } from './components/MemoryTab';
import { SessionsTab } from './components/SessionsTab';
import { GraphTab } from './components/GraphTab';
import { McpModal } from './components/McpModal';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';

export default function App() {
  const [session_id, setSessionId] = useState<string>(
    () => `sess-${Math.random().toString(36).substring(2, 9)}`
  );
  const [viewMode, setViewMode] = useState<'app' | 'landing'>('landing');
  const [activeTab, setActiveTab] = useState<'Home' | 'Sessions' | 'Graph' | 'Memory'>('Home');
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const api = useApi(session_id);

  // Reset to new conversation
  const handleNewChat = () => {
    const nextSessionId = `sess-${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(nextSessionId);
    api.setChatHistory([]);
    api.setInputMessage('');
    setActiveTab('Home');
  };

  // Re-run prompt from Sessions tab into Home tab
  const handleRerun = (promptText: string) => {
    setActiveTab('Home');
    api.handleSendMessage(promptText);
  };

  return (
    <div className="kira-app-layout">
      <CustomCursor />
      <NeuralBackground />

      {viewMode === 'landing' ? (
        <LandingPage
          onLaunchApp={() => setViewMode('app')}
          onOpenAuth={() => {
            setViewMode('app');
            setIsAuthModalOpen(true);
          }}
          onOpenMcp={() => setIsMcpModalOpen(true)}
        />
      ) : (
        <div className="kira-app-content">
          <Header
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onNewChat={handleNewChat}
            onOpenMcp={() => setIsMcpModalOpen(true)}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onOpenLanding={() => setViewMode('landing')}
            user={api.user}
          />

          <main className="tab-view-viewport">
            {activeTab === 'Home' && (
              <HomeTab
                chatHistory={api.chatHistory}
                inputMessage={api.inputMessage}
                setInputMessage={api.setInputMessage}
                loading={api.loading}
                copiedId={api.copiedId}
                density={api.density}
                setDensity={api.setDensity}
                projectId={api.projectId}
                setProjectId={(p) => {
                  api.setProjectId(p);
                  api.fetchMemories(p);
                }}
                onSendMessage={api.handleSendMessage}
                onCopy={api.copyPrompt}
              />
            )}

            {activeTab === 'Sessions' && (
              <SessionsTab
                historyList={api.historyList}
                mcpLogs={api.mcpLogs}
                onRerun={handleRerun}
              />
            )}

            {activeTab === 'Graph' && (
              <GraphTab
                graphData={api.graphData}
                loading={api.graphLoading}
                onRefresh={api.fetchGraph}
              />
            )}

            {activeTab === 'Memory' && (
              <MemoryTab
                memories={api.memories}
                pinnedIds={api.pinnedIds}
                projectId={api.projectId}
                onTogglePin={api.togglePinMemory}
                onDeleteMemory={api.handleDeleteMemory}
                onAddMemory={api.handleAddMemory}
              />
            )}
          </main>
        </div>
      )}

      <McpModal
        isOpen={isMcpModalOpen}
        onClose={() => setIsMcpModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={api.login}
        onLogout={api.logout}
        currentUser={api.user}
      />
    </div>
  );
}

