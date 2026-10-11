"""Graph API route — exposes architectural knowledge graph linking projects, memories, and caller agents."""

from fastapi import APIRouter
from database import db, LOCAL_USER_ID

router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


from typing import Optional

@router.get("")
async def get_knowledge_graph(user_id: Optional[str] = None):
    """Compiles living graph nodes and edges from user memories, history, and MCP traces."""
    target_user = user_id or LOCAL_USER_ID
    memories = await db.get_memories(target_user, project_id="all")
    mcp_logs = await db.get_mcp_logs(limit=50)
    history = await db.get_all_history(limit=30)

    nodes = []
    edges = []
    seen_node_ids = set()

    # 1. Collect Project nodes
    project_set = {"default"}
    for m in memories:
        pid = m.get("project_id") or "default"
        project_set.add(pid)
    for h in history:
        # History turns may belong to default or specific sessions
        project_set.add("default")

    for pid in project_set:
        node_id = f"proj-{pid}"
        if node_id not in seen_node_ids:
            seen_node_ids.add(node_id)
            nodes.append({
                "id": node_id,
                "label": f"Project: {pid}",
                "type": "project",
                "project_id": pid,
                "size": 24,
                "color": "#8B5CF6",  # Violet
            })

    # 2. Add Memory nodes & connect to Project
    for m in memories:
        mid = m.get("id")
        node_id = f"mem-{mid}"
        pid = m.get("project_id") or "default"
        proj_node_id = f"proj-{pid}"

        if node_id not in seen_node_ids:
            seen_node_ids.add(node_id)
            category = m.get("category", "tech_stack")
            color = "#10B981" if category == "tech_stack" else ("#F59E0B" if category == "constraints" else "#6366F1")
            
            nodes.append({
                "id": node_id,
                "label": m.get("fact", "")[:35] + ("..." if len(m.get("fact", "")) > 35 else ""),
                "full_fact": m.get("fact", ""),
                "type": "memory",
                "category": category,
                "project_id": pid,
                "created_at": m.get("created_at"),
                "confidence": 0.88,
                "size": 16,
                "color": color,
            })

            # Edge from Project to Memory
            edges.append({
                "id": f"edge-{proj_node_id}-{node_id}",
                "source": proj_node_id,
                "target": node_id,
                "label": category,
                "color": "rgba(139, 92, 246, 0.4)",
            })

    # 3. Add Agent nodes from MCP logs & connect to projects
    agent_counts = {}
    for log in mcp_logs:
        agent = log.get("agent_name") or "IDE Client"
        agent_counts[agent] = agent_counts.get(agent, 0) + 1

    for agent, count in agent_counts.items():
        node_id = f"agent-{agent}"
        if node_id not in seen_node_ids:
            seen_node_ids.add(node_id)
            nodes.append({
                "id": node_id,
                "label": f"Agent: {agent}",
                "type": "agent",
                "agent_name": agent,
                "call_count": count,
                "size": 20,
                "color": "#EC4899",  # Pink
            })

            # Edge from Agent to default project hub
            edges.append({
                "id": f"edge-{node_id}-proj-default",
                "source": node_id,
                "target": "proj-default",
                "label": f"{count} calls",
                "color": "rgba(236, 72, 153, 0.4)",
            })

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "project_count": len(project_set),
            "memory_count": len(memories),
            "agent_count": len(agent_counts),
        }
    }
