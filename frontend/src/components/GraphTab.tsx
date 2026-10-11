import React, { useState, useMemo, useRef } from 'react';
import { Search, Maximize2, Eye, EyeOff, Layers, RefreshCw, X, Brain, Terminal, ZoomIn, ZoomOut, RotateCcw, Database } from 'lucide-react';
import type { GraphData, GraphNode } from '../types';

interface GraphTabProps {
  graphData: GraphData | null;
  loading: boolean;
  onRefresh: () => void;
}

export const GraphTab: React.FC<GraphTabProps> = ({
  graphData,
  loading,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'project' | 'memory' | 'agent'>('all');
  const [showLabels, setShowLabels] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Auto-sync if graph is not loaded yet
  React.useEffect(() => {
    if (!graphData) {
      onRefresh();
    }
  }, [graphData, onRefresh]);

  // Industry-standard cluster & orbital layout
  const layoutNodes = useMemo(() => {
    if (!graphData || !graphData.nodes.length) return [];

    let nodes = graphData.nodes.map((n) => ({ ...n }));

    if (activeFilter !== 'all') {
      nodes = nodes.filter((n) => n.type === activeFilter || n.type === 'project');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          (n.full_fact && n.full_fact.toLowerCase().includes(q)) ||
          n.type.toLowerCase().includes(q)
      );
    }

    const width = 1200;
    const height = 640;
    const centerX = width / 2;
    const centerY = height / 2;

    const projects = nodes.filter((n) => n.type === 'project');
    const memories = nodes.filter((n) => n.type === 'memory');
    const agents = nodes.filter((n) => n.type === 'agent');

    // 1. Position Projects: 'default' hub in center, others in outer ring
    const projectPositions = new Map<string, { x: number; y: number }>();
    const outerProjects = projects.filter((p) => p.project_id !== 'default');
    const defaultProject = projects.find((p) => p.project_id === 'default');

    if (defaultProject) {
      defaultProject.x = centerX;
      defaultProject.y = centerY;
      projectPositions.set('default', { x: centerX, y: centerY });
    }

    outerProjects.forEach((node, i) => {
      const angle = (i / Math.max(outerProjects.length, 1)) * 2 * Math.PI - Math.PI / 2;
      const radiusX = 320;
      const radiusY = 210;
      const px = centerX + Math.cos(angle) * radiusX;
      const py = centerY + Math.sin(angle) * radiusY;
      node.x = px;
      node.y = py;
      projectPositions.set(node.project_id || `proj-${i}`, { x: px, y: py });
    });

    // 2. Position Memories in neat non-overlapping orbits around their project hub
    const projectMemoriesMap = new Map<string, GraphNode[]>();
    memories.forEach((mem) => {
      const pid = mem.project_id || 'default';
      const arr = projectMemoriesMap.get(pid) || [];
      arr.push(mem);
      projectMemoriesMap.set(pid, arr);
    });

    projectMemoriesMap.forEach((memList, pid) => {
      const hub = projectPositions.get(pid) || { x: centerX, y: centerY };
      const isDefaultHub = pid === 'default';
      const baseRadius = isDefaultHub ? 115 : 68;

      memList.forEach((mem, idx) => {
        // Multi-ring orbit for large memory clusters
        const ring = Math.floor(idx / 12);
        const ringIdx = idx % 12;
        const ringSize = Math.min(12, memList.length - ring * 12);
        const orbitRadius = baseRadius + ring * 38;

        const angle = (ringIdx / Math.max(ringSize, 1)) * 2 * Math.PI;
        mem.x = hub.x + Math.cos(angle) * orbitRadius;
        mem.y = hub.y + Math.sin(angle) * (orbitRadius * 0.9);
      });
    });

    // 3. Position Caller Agents in a left/top satellite arc
    agents.forEach((agent, idx) => {
      const angle = Math.PI * 0.72 + (idx / Math.max(agents.length, 1)) * Math.PI * 0.56;
      const radiusX = 490;
      const radiusY = 260;
      agent.x = centerX + Math.cos(angle) * radiusX;
      agent.y = centerY + Math.sin(angle) * radiusY;
    });

    return nodes;
  }, [graphData, activeFilter, searchQuery]);

  // Build curved bezier edges connecting nodes
  const layoutEdges = useMemo(() => {
    if (!graphData || !graphData.edges.length) return [];
    const nodeMap = new Map<string, GraphNode>();
    layoutNodes.forEach((n) => nodeMap.set(n.id, n));

    return graphData.edges
      .filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target))
      .map((e) => {
        const s = nodeMap.get(e.source)!;
        const t = nodeMap.get(e.target)!;
        return {
          ...e,
          sourceNode: s,
          targetNode: t,
        };
      });
  }, [graphData, layoutNodes]);

  // Connected edge IDs for active highlight
  const activeEdgeIds = useMemo(() => {
    const activeId = hoveredNodeId || selectedNode?.id;
    if (!activeId) return new Set<string>();
    const ids = new Set<string>();
    layoutEdges.forEach((e) => {
      if (e.source === activeId || e.target === activeId) {
        ids.add(e.id);
      }
    });
    return ids;
  }, [hoveredNodeId, selectedNode, layoutEdges]);

  // Connected Neighbor Nodes for the Inspector Drawer
  const connectedNeighbors = useMemo(() => {
    if (!selectedNode) return [];
    const neighbors: GraphNode[] = [];
    const seenIds = new Set<string>();
    layoutEdges.forEach((e) => {
      if (e.source === selectedNode.id && !seenIds.has(e.target)) {
        seenIds.add(e.target);
        if (e.targetNode) neighbors.push(e.targetNode);
      } else if (e.target === selectedNode.id && !seenIds.has(e.source)) {
        seenIds.add(e.source);
        if (e.sourceNode) neighbors.push(e.sourceNode);
      }
    });
    return neighbors;
  }, [selectedNode, layoutEdges]);

  // Pan and Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'circle') return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className={`tab-page-container animate-fade-in ${isFullscreen ? 'graph-fullscreen-mode' : ''}`}>
      {/* Graph Telemetry HUD Strip */}
      <div className="graph-telemetry-strip">
        <div className="strip-metric-card">
          <span className="strip-label">KNOWLEDGE TOPOLOGY</span>
          <div className="strip-val-row">
            <Layers size={15} style={{ color: 'var(--violet-400)' }} />
            <span className="strip-val">{layoutNodes.length} Nodes • {layoutEdges.length} Edges</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">ORBITAL HUBS</span>
          <div className="strip-val-row">
            <span className="strip-val highlight">
              {layoutNodes.filter((n) => n.type === 'project').length} Projects Active
            </span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">CLOUD STORAGE</span>
          <div className="strip-val-row">
            <Database size={14} style={{ color: 'var(--emerald-400)' }} />
            <span className="strip-val green">Neon Serverless DB</span>
          </div>
        </div>

        <div className="strip-metric-card">
          <span className="strip-label">GRAPH RENDERING</span>
          <div className="strip-val-row">
            <span className="strip-val">GPU Hardware Accel (60 FPS)</span>
          </div>
        </div>
      </div>

      {/* Top Toolbar */}
      <div className="graph-toolbar-row">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search nodes, entities, tech rules, projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="graph-filter-pills">
          {(['all', 'project', 'memory', 'agent'] as const).map((filter) => (
            <button
              key={filter}
              className={`graph-filter-btn ${activeFilter === filter ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter === 'all'
                ? 'All Nodes'
                : filter === 'project'
                ? 'Project Hubs'
                : filter === 'memory'
                ? 'Rules & Memories'
                : 'IDE Agents'}
            </button>
          ))}
        </div>

        <div className="graph-toolbar-controls">
          <button
            className="btn-icon-control"
            onClick={() => setZoomLevel((z) => Math.min(2.2, z + 0.2))}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            className="btn-icon-control"
            onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.2))}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            className="btn-icon-control"
            onClick={resetView}
            title="Reset Pan & Zoom"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className={`btn-icon-control ${showLabels ? 'active' : ''}`}
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? 'Hide Labels' : 'Show Labels'}
          >
            {showLabels ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button
            className="btn-icon-control"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen"
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="btn-icon-control"
            onClick={onRefresh}
            title="Sync Live Graph"
          >
            <RefreshCw size={14} className={loading ? 'spin-icon' : ''} />
          </button>
        </div>
      </div>

      {/* Graph Visualizer Card */}
      <div className="graph-canvas-card">
        <div
          className="svg-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <svg
            viewBox="0 0 1200 640"
            className="graph-svg"
            style={{ width: '100%', height: 'calc(100vh - 270px)', minHeight: '430px' }}
          >
            <defs>
              <filter id="glow-purple" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-emerald" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Transform Group for Pan & Zoom */}
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoomLevel})`}>
              {/* Subtle Orbital Background Concentric Guide Rings */}
              <g className="orbital-rings-bg" pointerEvents="none">
                <circle cx="600" cy="320" r="115" fill="none" stroke="rgba(139, 92, 246, 0.08)" strokeDasharray="4 6" />
                <circle cx="600" cy="320" r="190" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeDasharray="4 6" />
                <circle cx="600" cy="320" r="280" fill="none" stroke="rgba(139, 92, 246, 0.04)" strokeDasharray="4 6" />
              </g>

              {/* Curved Bezier Edges */}
              <g className="edges-layer">
                {layoutEdges.map((edge) => {
                  const sx = edge.sourceNode.x || 0;
                  const sy = edge.sourceNode.y || 0;
                  const tx = edge.targetNode.x || 0;
                  const ty = edge.targetNode.y || 0;
                  const mx = (sx + tx) / 2;
                  const my = (sy + ty) / 2 - 12;
                  const path = `M ${sx} ${sy} Q ${mx} ${my} ${tx} ${ty}`;

                  const isHighlighted = activeEdgeIds.has(edge.id);
                  const hasActiveFocus = activeEdgeIds.size > 0;
                  const opacity = isHighlighted ? 0.95 : hasActiveFocus ? 0.08 : 0.28;
                  const strokeColor = isHighlighted ? '#C4B5FD' : edge.color || 'rgba(139, 92, 246, 0.4)';
                  const strokeWidth = isHighlighted ? 2.2 : 1.1;

                  return (
                    <path
                      key={edge.id}
                      d={path}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeDasharray={edge.label?.includes('calls') ? '3 3' : 'none'}
                      style={{ transition: 'stroke 0.2s ease, stroke-width 0.2s ease, stroke-opacity 0.2s ease' }}
                    />
                  );
                })}
              </g>

              {/* Cluster Nodes */}
              <g className="nodes-layer">
                {layoutNodes.map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isProject = node.type === 'project';
                  const isAgent = node.type === 'agent';
                  const radius = isProject ? 22 : isAgent ? 17 : 11;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode(node);
                      }}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Active / Hover glow halo */}
                      {(isSelected || isHovered) && (
                        <circle
                          r={radius + 7}
                          fill="none"
                          stroke={isProject ? '#A78BFA' : isAgent ? '#F472B6' : '#34D399'}
                          strokeWidth={2}
                          filter="url(#glow-purple)"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={radius}
                        fill="#0E121D"
                        stroke={node.color || '#8B5CF6'}
                        strokeWidth={isProject ? 2.8 : isHovered ? 2.2 : 1.6}
                        className="graph-node-circle"
                      />

                      {/* Internal Type Marker */}
                      <text
                        textAnchor="middle"
                        dy="3.5"
                        fill="#F8FAFC"
                        fontSize={radius * 0.72}
                        fontFamily="var(--font-mono)"
                        fontWeight="700"
                        pointerEvents="none"
                      >
                        {isProject ? 'P' : isAgent ? 'A' : 'M'}
                      </text>

                      {/* Clean Text Label */}
                      {showLabels && (isProject || isAgent || isHovered || isSelected) && (
                        <g pointerEvents="none">
                          <text
                            textAnchor="middle"
                            y={radius + 13}
                            fill={isSelected || isHovered ? '#FFFFFF' : '#94A3B8'}
                            fontSize={isProject ? '11' : '9.5'}
                            fontFamily="var(--font-sans)"
                            fontWeight={isProject ? '700' : '500'}
                          >
                            {isProject
                              ? node.label.replace('Project: ', '')
                              : isAgent
                              ? node.label.replace('Agent: ', '')
                              : node.label.length > 24
                              ? node.label.slice(0, 24) + '...'
                              : node.label}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
          </svg>

          {/* Floating Sliding Inspection Drawer */}
          {selectedNode && (
            <div className="node-inspector-drawer animate-scale-up">
              <div className="drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {selectedNode.type === 'project' && <Layers size={15} style={{ color: '#8B5CF6' }} />}
                  {selectedNode.type === 'memory' && <Brain size={15} style={{ color: '#10B981' }} />}
                  {selectedNode.type === 'agent' && <Terminal size={15} style={{ color: '#EC4899' }} />}
                  <h4 className="drawer-title">{selectedNode.label}</h4>
                </div>
                <button className="icon-close" onClick={() => setSelectedNode(null)}>
                  <X size={14} />
                </button>
              </div>

              <div className="drawer-body">
                <div className="drawer-row">
                  <span className="drawer-label">CLUSTER TYPE</span>
                  <span className="drawer-val badge-type">{selectedNode.type.toUpperCase()}</span>
                </div>

                {selectedNode.full_fact && (
                  <div className="drawer-row">
                    <span className="drawer-label">TECHNICAL SPECIFICATION</span>
                    <p className="drawer-fact-text">{selectedNode.full_fact}</p>
                  </div>
                )}

                {selectedNode.project_id && (
                  <div className="drawer-row">
                    <span className="drawer-label">PROJECT SCOPE</span>
                    <span className="drawer-val">{selectedNode.project_id}</span>
                  </div>
                )}

                {selectedNode.call_count !== undefined && (
                  <div className="drawer-row">
                    <span className="drawer-label">TOTAL MCP INVOCATIONS</span>
                    <span className="drawer-val highlight">{selectedNode.call_count} executions</span>
                  </div>
                )}

                {/* Connected Relationships list */}
                {connectedNeighbors.length > 0 && (
                  <div className="drawer-row">
                    <span className="drawer-label">CONNECTED NODES ({connectedNeighbors.length})</span>
                    <div className="connected-neighbor-chips">
                      {connectedNeighbors.slice(0, 6).map((neighbor) => (
                        <button
                          key={neighbor.id}
                          className="neighbor-chip"
                          onClick={() => setSelectedNode(neighbor)}
                        >
                          <span className={`neighbor-dot ${neighbor.type}`}></span>
                          <span>{neighbor.label.length > 18 ? neighbor.label.slice(0, 18) + '...' : neighbor.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Subgraph Stats (Pinned at bottom of Card) */}
        <div className="graph-footer-bar">
          <div className="subgraph-stats">
            <span className="status-dot"></span>
            <span>
              Live cluster mesh:{' '}
              <strong style={{ color: '#F8FAFC' }}>{layoutNodes.length} nodes</strong> •{' '}
              <strong style={{ color: '#F8FAFC' }}>{layoutEdges.length} connections</strong>
            </span>
          </div>

          <div className="legend-pills">
            <span className="legend-item"><span className="legend-dot project"></span> Project Hubs</span>
            <span className="legend-item"><span className="legend-dot memory"></span> Constraint Rules</span>
            <span className="legend-item"><span className="legend-dot agent"></span> IDE Agents</span>
          </div>
        </div>
      </div>
    </div>
  );
};
