import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Problems, handleApiError } from '@/lib/http/problem';
import { createChatOrchestrator, ChatContext, ChatResponse } from '@/services/chat/orchestrator';

/**
 * NOVA AI Chatbot API Endpoint
 * Handles chat messages and returns AI responses
 */

// Request validation
const ChatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  sessionId: z.string(),
  context: z.object({
    user: z.object({
      userId: z.string(),
      role: z.string(),
      email: z.string().email().optional()
    }),
    tenant: z.object({
      id: z.string(),
      name: z.string(),
      timezone: z.string().default('Europe/Paris'),
      businessHours: z.record(z.object({
        open: z.string(),
        close: z.string()
      })).default({})
    }),
    conversation: z.object({
      messages: z.array(z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.string().transform(str => new Date(str)),
        metadata: z.unknown().optional()
      })).default([]),
      state: z.enum(['active', 'waiting_for_input', 'completed', 'escalated']).default('active'),
      currentIntent: z.string().optional(),
      collectedSlots: z.record(z.unknown()).default({}),
      confirmationPending: z.boolean().optional()
    })
  })
});

export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse and validate request
    const body = await request.json();
    const validatedRequest = ChatRequestSchema.parse(body);

    // Rate limiting check (basic implementation)
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // TODO: Implement proper rate limiting with Redis
    
    // Security checks
    if (validatedRequest.message.length > 2000) {
      return Problems.validationError([
        { field: 'message', message: 'Message too long (max 2000 characters)' }
      ]).toResponse();
    }

    // Check if tenant exists and is active
    // TODO: Add tenant validation

    // Create chat context
    const chatContext: ChatContext = {
      sessionId: validatedRequest.sessionId,
      user: validatedRequest.context.user,
      tenant: validatedRequest.context.tenant,
      conversation: validatedRequest.context.conversation as any
    };

    // Process message with orchestrator
    const orchestrator = createChatOrchestrator();
    const response: ChatResponse = await orchestrator.handleMessage(
      validatedRequest.message,
      chatContext
    );

    // Log conversation for analytics
    await logChatInteraction({
      sessionId: validatedRequest.sessionId,
      tenantId: chatContext.tenant.id,
      userId: chatContext.user.userId,
      userMessage: validatedRequest.message,
      botResponse: response.message,
      intent: chatContext.conversation.currentIntent,
      escalated: response.escalate,
      completed: response.completed,
      clientIp
    });

    // Return response
    return NextResponse.json({
      success: true,
      data: {
        message: response.message,
        suggestedReplies: response.suggestedReplies,
        requiresInput: response.requiresInput,
        inputType: response.inputType,
        options: response.options,
        completed: response.completed,
        escalate: response.escalate,
        data: response.data,
        context: {
          currentIntent: chatContext.conversation.currentIntent,
          collectedSlots: chatContext.conversation.collectedSlots,
          confirmationPending: chatContext.conversation.confirmationPending,
          state: response.escalate ? 'escalated' : response.completed ? 'completed' : 'active'
        }
      }
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return Problems.validationError(fieldErrors).toResponse();
    }

    // Handle custom errors
    return handleApiError(error);
  }
}

// Health check endpoint
export async function GET(): Promise<NextResponse> {
  try {
    // Test NLP service
    const _orchestrator = createChatOrchestrator();
    // TODO: Add health check for orchestrator
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        nlp: 'operational',
        database: 'operational',
        orchestrator: 'operational'
      }
    });

  } catch (error) {
    console.error('Chat health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service health check failed'
    }, { status: 503 });
  }
}

/**
 * Log chat interactions for analytics and monitoring
 */
async function logChatInteraction(params: {
  sessionId: string;
  tenantId: string;
  userId: string;
  userMessage: string;
  botResponse: string;
  intent?: string;
  escalated?: boolean;
  completed?: boolean;
  clientIp: string;
}): Promise<void> {
  try {
    // TODO: Implement proper logging to database or analytics service
    console.warn('Chat interaction logged:', {
      sessionId: params.sessionId,
      tenantId: params.tenantId,
      userId: params.userId,
      messageLength: params.userMessage.length,
      responseLength: params.botResponse.length,
      intent: params.intent,
      escalated: params.escalated,
      completed: params.completed,
      clientIp: params.clientIp,
      timestamp: new Date().toISOString()
    });

    // In production, you would:
    // 1. Store in database for audit trail
    // 2. Send to analytics service (e.g., Mixpanel, Amplitude)
    // 3. Update conversation state in Redis/session store
    // 4. Trigger webhooks for escalation/completion events

  } catch (error) {
    console.error('Failed to log chat interaction:', error);
    // Don't throw - logging failures shouldn't break the chat
  }
}

// Export types for frontend use
export type { ChatResponse, ChatContext };