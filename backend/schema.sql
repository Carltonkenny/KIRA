-- KIRA Database Schema (PostgreSQL & SQLite compatible)

-- 1. Profiles: User preferences and style metadata
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    primary_use TEXT,
    preferred_tone VARCHAR(50) DEFAULT 'direct',
    density_preference VARCHAR(50) DEFAULT 'short',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Memories: Distilled semantic facts learned over time
CREATE TABLE IF NOT EXISTS user_memories (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g., 'tech_stack', 'writing_style', 'constraints'
    fact TEXT NOT NULL,             -- e.g., 'Uses Next.js 14', 'Prefers async/await'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_memories_user ON user_memories(user_id);

-- 3. Chat History: Conversation logs for stateful prompt refinement
CREATE TABLE IF NOT EXISTS chat_history (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,      -- 'user' or 'assistant'
    message TEXT NOT NULL,          -- Raw user prompt or LLM description
    refined_prompt TEXT,            -- Refined prompt (null if conversational filler)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_history_user ON chat_history(user_id);

-- 4. MCP Logs: Execution metrics and trace logs for MCP tool calls
CREATE TABLE IF NOT EXISTS mcp_logs (
    id VARCHAR(255) PRIMARY KEY,
    tool_name VARCHAR(100) NOT NULL,
    agent_name VARCHAR(100),
    arguments TEXT NOT NULL,
    duration_ms FLOAT,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_tool ON mcp_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_mcp_logs_created ON mcp_logs(created_at);

