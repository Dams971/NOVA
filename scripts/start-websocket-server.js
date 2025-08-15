#!/usr/bin/env node

/**
 * NOVA WebSocket Server Startup Script
 * Standalone WebSocket server for real-time chat
 */

require('dotenv').config({ path: '.env.local' });

const { createChatWebSocketServer } = require('../dist/lib/websocket/chat-server');

const PORT = process.env.WEBSOCKET_PORT || 8080;

console.log('🚀 Starting NOVA WebSocket Server...');
console.log(`📡 Port: ${PORT}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

// Handle graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function gracefulShutdown() {
  console.log('🛑 Received shutdown signal, closing server gracefully...');
  
  try {
    const { getChatWebSocketServer } = require('../dist/lib/websocket/chat-server');
    const server = getChatWebSocketServer();
    
    if (server) {
      await server.shutdown();
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
try {
  const server = createChatWebSocketServer(PORT);
  
  // Log stats every 30 seconds
  setInterval(() => {
    const stats = server.getStats();
    console.log(`📊 Sessions - Total: ${stats.totalSessions}, Authenticated: ${stats.authenticatedSessions}, Active: ${stats.activeSessions}`);
  }, 30000);
  
  console.log('✅ NOVA WebSocket Server started successfully!');
  console.log('🔗 Connect via: ws://localhost:' + PORT + '?sessionId=your-session-id');
  
} catch (error) {
  console.error('❌ Failed to start WebSocket server:', error);
  process.exit(1);
}