/**
 * LogsDashboard — metric cards, prompt history (before vs after), and MCP trace logs.
 */

import { useEffect } from 'react';
import { Activity, Clock, Terminal } from 'lucide-react';
import type { MCPServer, MCPLog, RefinementHistoryItem } from '../types';

interface LogsDashboardProps {
  mcpServers: MCPServer[];
  mcpLogs: MCPLog[];
  historyList: RefinementHistoryItem[];
  fetchLogsAndHistory: () => void;
}

export default function LogsDashboard({
  mcpServers, mcpLogs, historyList, fetchLogsAndHistory,
}: LogsDashboardProps) {
  // Auto-refresh logs when this tab is visible
  useEffect(() => {
    fetchLogsAndHistory();
    const interval = setInterval(fetchLogsAndHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchLogsAndHistory]);

  return (
    <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Metric Cards */}
      <div className="metric-row">
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Activity size={14} style={{ color: 'var(--accent)' }} /> ACTIVE MCP SERVERS
          </div>
          <div className="metric-card-val">
            {mcpServers.filter(s => s.status === 'connected').length} / {mcpServers.length}
          </div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Clock size={14} style={{ color: 'var(--accent)' }} /> TOTAL REFINE CALLS
          </div>
          <div className="metric-card-val">{historyList.length}</div>
        </div>
        <div className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Terminal size={14} style={{ color: 'var(--accent)' }} /> TOTAL MCP ACTIONS
          </div>
          <div className="metric-card-val">{mcpLogs.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Prompt History */}
        <div className="brutalist-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="section-title" style={{ padding: '0 0 12px 0', borderBottom: '2px solid var(--border)', marginBottom: '16px' }}>
            <Clock size={14} /> PROMPT IMPROVEMENT HISTORY
          </h3>
          <div style={{ overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {historyList.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No refinement history logs found.</p>
            ) : (
              historyList.map((item) => (
                <div key={item.id} style={{ border: '2px solid var(--border)', padding: '12px', backgroundColor: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>SESSION: {item.session_id}</span>
                    <span>{item.created_at}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div className="form-label" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>Original Prompt</div>
                      <div style={{ fontSize: '0.75rem', padding: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                        {item.message}
                      </div>
                    </div>
                    <div>
                      <div className="form-label" style={{ fontSize: '0.65rem', marginBottom: '4px', color: 'var(--accent)' }}>Refined Output</div>
                      <div style={{ fontSize: '0.75rem', padding: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                        {item.refined_prompt}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MCP Trace Logs */}
        <div className="brutalist-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="section-title" style={{ padding: '0 0 12px 0', borderBottom: '2px solid var(--border)', marginBottom: '16px' }}>
            <Terminal size={14} /> MCP TRACE LOGS & METRICS
          </h3>
          <div style={{ overflowY: 'auto', maxHeight: '450px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mcpLogs.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No MCP trace logs found.</p>
            ) : (
              mcpLogs.map((log) => (
                <div key={log.id} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', padding: '10px', backgroundColor: 'var(--bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>
                      {log.tool_name}
                    </span>
                    <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-error'}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    <span>CALLER: {log.agent_name}</span>
                    <span>LATENCY: {log.duration_ms.toFixed(1)} ms</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', borderTop: '1px dashed var(--border)', paddingTop: '6px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', overflowY: 'auto', maxHeight: '80px' }}>
                    ARGS: {log.arguments}
                  </div>
                  <div style={{ alignSelf: 'flex-end', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {log.created_at}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
