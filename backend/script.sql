-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    -- image URL of google/apple account
    image_url VARCHAR(255),
    email VARCHAR(255) NOT NULL UNIQUE,
    auth_provider VARCHAR(10) NOT NULL,  -- 'google' or 'apple'
    provider_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auth_provider, provider_user_id)
);

-- Create Threads Table
CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_bot BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

-- Create Web Socket Token Table
CREATE TABLE IF NOT EXISTS web_socket_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(auth_provider, provider_user_id);
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_web_socket_tokens_token ON web_socket_tokens(token);