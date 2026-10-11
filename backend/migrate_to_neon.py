import sqlite3
import psycopg2

print("Starting migration to Neon...")
s_conn = sqlite3.connect('kira_local.db')
s_cur = s_conn.cursor()

dsn = "postgresql://neondb_owner:npg_oS1gL7qKTFGC@ep-dry-surf-azz7bey8-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
p_conn = psycopg2.connect(dsn)
p_cur = p_conn.cursor()

# Profiles
s_cur.execute('SELECT user_id, primary_use, preferred_tone, density_preference, updated_at FROM user_profiles')
for row in s_cur.fetchall():
    p_cur.execute('''INSERT INTO user_profiles (user_id, primary_use, preferred_tone, density_preference, updated_at)
                     VALUES (%s, %s, %s, %s, %s) ON CONFLICT (user_id) DO NOTHING''', row)

# Memories
s_cur.execute('SELECT id, user_id, project_id, category, fact, created_at FROM user_memories')
for row in s_cur.fetchall():
    p_cur.execute('''INSERT INTO user_memories (id, user_id, project_id, category, fact, created_at)
                     VALUES (%s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING''', row)

# History
s_cur.execute('SELECT id, user_id, project_id, session_id, role, message, refined_prompt, created_at FROM chat_history')
for row in s_cur.fetchall():
    p_cur.execute('''INSERT INTO chat_history (id, user_id, project_id, session_id, role, message, refined_prompt, created_at)
                     VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING''', row)

# MCP Logs
s_cur.execute('SELECT id, tool_name, agent_name, arguments, duration_ms, status, created_at FROM mcp_logs')
for row in s_cur.fetchall():
    p_cur.execute('''INSERT INTO mcp_logs (id, tool_name, agent_name, arguments, duration_ms, status, created_at)
                     VALUES (%s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING''', row)

p_conn.commit()
print("Migration completed successfully!")
for t in ['user_profiles', 'user_memories', 'chat_history', 'mcp_logs']:
    p_cur.execute(f"SELECT count(*) FROM {t}")
    print(t, "in Neon:", p_cur.fetchone()[0])

s_conn.close()
p_conn.close()
