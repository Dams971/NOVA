#!/usr/bin/env node

/**
 * NOVA WebSocket Server - Standalone Implementation
 * Real-time chat server for appointment booking
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');
require('dotenv').config({ path: '.env.local' });

const PORT = process.env.WEBSOCKET_PORT || 8080;

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store active sessions
const sessions = new Map();
const authenticatedUsers = new Map();

console.log('🚀 Starting NOVA WebSocket Server...');
console.log(`📡 Port: ${PORT}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const query = url.parse(req.url, true).query;
  const sessionId = query.sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`✅ New connection: ${sessionId}`);
  
  // Store session
  sessions.set(sessionId, {
    ws,
    sessionId,
    authenticated: false,
    userId: null,
    tenantId: null,
    connectedAt: new Date(),
    lastActivity: new Date()
  });
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'status',
    data: {
      status: 'connected',
      sessionId,
      message: 'Bienvenue sur Nova Chat. Veuillez vous authentifier.'
    }
  }));
  
  // Handle messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(sessionId, message);
    } catch (error) {
      console.error('❌ Invalid message format:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { error: 'Format de message invalide' }
      }));
    }
  });
  
  // Handle disconnect
  ws.on('close', () => {
    console.log(`👋 Disconnected: ${sessionId}`);
    sessions.delete(sessionId);
    authenticatedUsers.delete(sessionId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${sessionId}:`, error);
  });
  
  // Ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);
});

// Message handler
function handleMessage(sessionId, message) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  session.lastActivity = new Date();
  
  switch (message.type) {
    case 'authenticate':
      handleAuthentication(sessionId, message.data);
      break;
      
    case 'chat':
      handleChatMessage(sessionId, message.data);
      break;
      
    case 'ping':
      session.ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
      
    default:
      session.ws.send(JSON.stringify({
        type: 'error',
        data: { error: `Type de message inconnu: ${message.type}` }
      }));
  }
}

// Authentication handler
function handleAuthentication(sessionId, data) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  // Simple authentication (in production, verify JWT token)
  if (data && data.userId) {
    session.authenticated = true;
    session.userId = data.userId;
    session.tenantId = data.tenantId;
    authenticatedUsers.set(sessionId, data.userId);
    
    console.log(`🔐 Authenticated: ${sessionId} as user ${data.userId}`);
    
    session.ws.send(JSON.stringify({
      type: 'status',
      data: {
        status: 'authenticated',
        message: 'Authentification réussie'
      }
    }));
  } else {
    session.ws.send(JSON.stringify({
      type: 'error',
      data: { error: 'Authentification échouée' }
    }));
  }
}

// Chat message handler
function handleChatMessage(sessionId, data) {
  const session = sessions.get(sessionId);
  if (!session) return;
  
  // Check if authenticated
  if (!session.authenticated) {
    session.ws.send(JSON.stringify({
      type: 'error',
      data: { error: 'Veuillez vous authentifier d\'abord' }
    }));
    return;
  }
  
  console.log(`💬 Chat message from ${sessionId}: ${data.message}`);
  
  // Simulate typing indicator
  session.ws.send(JSON.stringify({
    type: 'typing',
    data: { typing: true }
  }));
  
  // Process message with simulated NLP
  setTimeout(() => {
    const response = processUserMessage(data.message, data.context);
    
    // Send typing stop
    session.ws.send(JSON.stringify({
      type: 'typing',
      data: { typing: false }
    }));
    
    // Send response
    session.ws.send(JSON.stringify({
      type: 'chat_response',
      data: response
    }));
  }, 1000 + Math.random() * 1000); // Random delay 1-2 seconds
}

// Simple NLP processor (mock implementation)
function processUserMessage(message, context) {
  const lowerMessage = message.toLowerCase();
  
  // Greeting detection
  if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut')) {
    return {
      message: 'Bonjour ! Je suis Nova, votre assistant pour la prise de rendez-vous. Comment puis-je vous aider aujourd\'hui ?',
      suggestedReplies: [
        'Je veux prendre un rendez-vous',
        'J\'ai une urgence dentaire',
        'Voir mes rendez-vous'
      ],
      context: { intent: 'greeting' }
    };
  }
  
  // Appointment booking intent
  if (lowerMessage.includes('rendez-vous') || lowerMessage.includes('rdv')) {
    if (lowerMessage.includes('prendre') || lowerMessage.includes('réserver')) {
      return {
        message: 'Je vais vous aider à prendre rendez-vous. Pour quel type de consultation souhaitez-vous venir ?',
        suggestedReplies: [
          'Consultation de contrôle',
          'Détartrage',
          'Urgence dentaire',
          'Autre'
        ],
        context: { intent: 'book_appointment', state: 'service_selection' }
      };
    }
    
    if (lowerMessage.includes('annuler')) {
      return {
        message: 'Pour annuler un rendez-vous, pouvez-vous me donner votre nom et la date du rendez-vous ?',
        context: { intent: 'cancel_appointment' }
      };
    }
  }
  
  // Service selection
  if (context && context.state === 'service_selection') {
    if (lowerMessage.includes('contrôle') || lowerMessage.includes('consultation')) {
      return {
        message: 'Consultation de contrôle sélectionnée. Quand souhaitez-vous venir ? Nous avons des disponibilités cette semaine.',
        suggestedReplies: [
          'Demain',
          'Cette semaine',
          'La semaine prochaine',
          'Choisir une date'
        ],
        context: { 
          intent: 'book_appointment', 
          state: 'date_selection',
          service: 'consultation'
        }
      };
    }
  }
  
  // Emergency detection
  if (lowerMessage.includes('urgence') || lowerMessage.includes('mal') || lowerMessage.includes('douleur')) {
    return {
      message: '🚨 Je comprends que vous avez une urgence. Nous pouvons vous proposer un créneau d\'urgence aujourd\'hui. Souhaitez-vous que je vérifie les disponibilités immédiates ?',
      suggestedReplies: [
        'Oui, le plus tôt possible',
        'Oui, cet après-midi',
        'Non, demain ça ira'
      ],
      context: { intent: 'emergency', priority: 'high' }
    };
  }
  
  // Default response
  return {
    message: 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ou choisir parmi ces options ?',
    suggestedReplies: [
      'Prendre un rendez-vous',
      'Annuler un rendez-vous',
      'Parler à quelqu\'un',
      'Autre question'
    ],
    context: { intent: 'unknown' }
  };
}

// Start server
server.listen(PORT, () => {
  console.log(`✅ NOVA WebSocket Server running on ws://localhost:${PORT}`);
  console.log('🔗 Connect with: ws://localhost:' + PORT + '?sessionId=your-session-id');
  
  // Log stats periodically
  setInterval(() => {
    const totalSessions = sessions.size;
    const authenticated = Array.from(sessions.values()).filter(s => s.authenticated).length;
    console.log(`📊 Stats - Sessions: ${totalSessions}, Authenticated: ${authenticated}`);
  }, 30000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  
  // Close all connections
  wss.clients.forEach((ws) => {
    ws.send(JSON.stringify({
      type: 'status',
      data: { status: 'server_shutdown', message: 'Le serveur va redémarrer' }
    }));
    ws.close();
  });
  
  server.close(() => {
    console.log('✅ WebSocket server shut down gracefully');
    process.exit(0);
  });
});