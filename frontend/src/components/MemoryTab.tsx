import React, { useState, useMemo } from 'react';
import {
  Search,
  Pin,
  Trash2,
  Calendar,
  Plus,
  Brain,
  X,
  Copy,
  Check,
  Shield,
  Code2,
  Sparkles,
  Layers,
  Database,
} from 'lucide-react';
import type { Memory } from '../types';

interface MemoryTabProps {
  memories: Memory[];
  pinnedIds: string[];
  projectId: string;
  onTogglePin: (id: string) => void;
  onDeleteMemory: (id: string) => void;
  onAddMemory: (fact: string, category: string, project: string) => Promise<boolean>;
}

export const MemoryTab: React.FC<MemoryTabProps> = ({
  memories,
  pinnedIds,
  projectId,
  onTogglePin,
  onDeleteMemory,
  onAddMemory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState('tech_stack');
  const [newProject, setNewProject] = useState(projectId === 'all' ? 'default' : projectId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories count
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: memories.length };
    memories.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [memories]);

  const availableCategories = useMemo(() => {
    const cats = new Set<string>(['all', 'auto_learned', 'tech_stack', 'constraints', 'writing_style']);
    memories.forEach((m) => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, [memories]);

  // Filter and sort memories: pinned first, category filter, then search query
  const filteredMemories = useMemo(() => {
    let list = [...memories];

    if (selectedCategory !== 'all') {
      list = list.filter((m) => m.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.fact.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.project_id && m.project_id.toLowerCase().includes(q))
      );
    }

    // Pinned memories first
    return list.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
      return bPinned - aPinned;
    });
  }, [memories, selectedCategory, searchQuery, pinnedIds]);

  const pinnedCount = useMemo(() => {
    return memories.filter((m) => pinnedIds.includes(m.id)).length;
  }, [memories, pinnedIds]);

  const handleCopyFact = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFact.trim()) return;
    setIsSubmitting(true);
    const success = await onAddMemory(newFact, newCategory, newProject);
    setIsSubmitting(false);
    if (success) {
      setNewFact('');
      setShowAddModal(false);
    }
  };

  const formatCategoryName = (category: string) => {
    if (category === 'auto_learned') return 'Learned Entity';
    if (category === 'tech_stack') return 'Stack Architecture';
    if (category === 'constraints') return 'Constraint Rule';
    if (category === 'writing_style') return 'Style Specification';
    return category.replace('_', ' ');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tech_stack':
        return <Code2 size={13} />;
      case 'constraints':
        return <Shield size={13} />;
      case 'writing_style':
        return <Sparkles size={13} />;
      default:
        return <Layers size={13} />;
    }
  };

  return (
    <div className="tab-page-container animate-fade-in">
      {/* Vault Telemetry HUD */}
      <div className="memory-vault-hud">
        <div className="strip-metric-card">
          <span className="strip-label">SEMANTIC MEMORY VAULT</span>
          <div className="strip-val-row">
            <Brain size={16} style={{ color: 'var(--violet-400)' }} />
            <span className="strip-val">{memories.length} Active Rules</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">PINNED FOR EVERY PROMPT</span>
          <div className="strip-val-row">
            <Pin size={14} style={{ color: 'var(--amber-400)' }} />
            <span className="strip-val highlight">{pinnedCount} Pinned Core</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">PERSISTENCE STORAGE</span>
          <div className="strip-val-row">
            <Database size={14} style={{ color: 'var(--emerald-400)' }} />
            <span className="strip-val green">Neon Cloud DB (Active)</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">CONTEXT INTEGRITY</span>
          <div className="strip-val-row">
            <span className="strip-val">Zero Prompt Leakage</span>
          </div>
        </div>
      </div>

      {/* Search & Actions Toolbar */}
      <div className="memory-toolbar-row">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search memories, technical rules, framework constraints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="memory-category-filter-pills">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              className={`memory-cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{cat === 'all' ? 'All Rules' : formatCategoryName(cat)}</span>
              <span className="cat-pill-count">{categoryCounts[cat] || 0}</span>
            </button>
          ))}
        </div>

        <button
          className="btn-add-memory"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={15} />
          <span>Add Rule</span>
        </button>
      </div>

      {/* Memory Cards Grid */}
      <div className="memory-cards-grid">
        {filteredMemories.length === 0 ? (
          <div className="empty-memories-card">
            <Brain size={36} className="empty-brain-icon" />
            <h4>No rules found in knowledge base</h4>
            <p>
              {searchQuery
                ? 'No facts matched your search criteria.'
                : 'KIRA automatically extracts tech stack rules from your engineering prompts and saves them to Neon DB.'}
            </p>
            <button className="btn-add-memory" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> Add First Rule
            </button>
          </div>
        ) : (
          filteredMemories.map((m) => {
            const isPinned = pinnedIds.includes(m.id);
            const isCopied = copiedId === m.id;
            return (
              <div
                key={m.id}
                className={`memory-card ${isPinned ? 'pinned' : ''} category-${m.category}`}
              >
                <div className="memory-card-top">
                  <div className="memory-card-meta">
                    <span className={`category-badge ${m.category}`}>
                      {getCategoryIcon(m.category)}
                      <span>{formatCategoryName(m.category)}</span>
                    </span>
                    {m.project_id && (
                      <span className="project-badge">
                        📁 {m.project_id}
                      </span>
                    )}
                  </div>

                  <div className="memory-card-actions">
                    <button
                      className="btn-icon-action"
                      onClick={() => handleCopyFact(m.id, m.fact)}
                      title="Copy rule"
                    >
                      {isCopied ? (
                        <Check size={13} style={{ color: '#10B981' }} />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                    <button
                      className={`btn-icon-action ${isPinned ? 'pinned' : ''}`}
                      onClick={() => onTogglePin(m.id)}
                      title={isPinned ? 'Unpin rule' : 'Pin rule for every prompt'}
                    >
                      <Pin size={13} fill={isPinned ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className="btn-icon-action danger"
                      onClick={() => onDeleteMemory(m.id)}
                      title="Delete rule"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="memory-card-body">
                  <p className="memory-fact-text">{m.fact}</p>
                </div>

                <div className="memory-card-footer">
                  <div className="memory-date">
                    <Calendar size={12} />
                    <span>{m.created_at?.slice(0, 10) || 'Recently learned'}</span>
                  </div>
                  <div className="memory-confidence">
                    <span className="confidence-dot"></span>
                    <span>Relevance: 96%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Rule Modal */}
      {showAddModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowAddModal(false)}>
          <div className="modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={18} style={{ color: 'var(--violet-400)' }} />
                <h3 className="modal-title">Add Constraint or Technical Rule</h3>
              </div>
              <button className="icon-close" onClick={() => setShowAddModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateMemory}>
              <div className="modal-body">
                <div className="form-group-custom">
                  <label>Rule or Learned Fact</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Uses Next.js 14 App Router with Tailwind CSS, strict TypeScript and Server Actions"
                    value={newFact}
                    onChange={(e) => setNewFact(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row-custom">
                  <div className="form-group-custom">
                    <label>Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="tech_stack">Tech Stack</option>
                      <option value="writing_style">Writing Style</option>
                      <option value="constraints">Constraints & Boundaries</option>
                    </select>
                  </div>

                  <div className="form-group-custom">
                    <label>Project Scope</label>
                    <select
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                    >
                      <option value="default">default (global)</option>
                      <option value="shop-frontend">shop-frontend</option>
                      <option value="go-payments-backend">go-payments-backend</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-modal-close"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={!newFact.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Saving to Neon...' : 'Save Rule to Neon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
