'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Send, 
  Clock,
  Check,
  CheckCheck,
  AlertCircle,
  User,
  Bot
} from 'lucide-react';
import React, { useState } from 'react';
import { Patient } from '@/lib/models/patient';
import { CommunicationHistory, CommunicationMessage } from '@/lib/services/patient-communication-service';

interface CommunicationHistorySectionProps {
  patient: Patient;
  communicationHistory: CommunicationHistory | null;
  loading: boolean;
  onSendMessage: () => void;
}

interface MessageCardProps {
  message: CommunicationMessage;
}

function MessageCard({ message }: MessageCardProps) {
  const getTypeIcon = (type: CommunicationMessage['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageCircle className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      case 'system':
        return <Bot className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: CommunicationMessage['status']) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-gray-500" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: CommunicationMessage['status']) => {
    switch (status) {
      case 'sent': return 'Envoyé';
      case 'delivered': return 'Délivré';
      case 'read': return 'Lu';
      case 'failed': return 'Échec';
      case 'pending': return 'En attente';
      default: return status;
    }
  };

  const isInbound = message.direction === 'inbound';
  const isUnread = isInbound && !message.readAt;

  return (
    <div className={`flex ${isInbound ? 'justify-start' : 'justify-end'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        isInbound 
          ? 'bg-gray-100 text-gray-900' 
          : 'bg-blue-600 text-white'
      } ${isUnread ? 'ring-2 ring-blue-300' : ''}`}>
        
        {/* Message Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getTypeIcon(message.type)}
            <span className="text-xs font-medium">
              {message.type.toUpperCase()}
            </span>
            {isInbound && (
              <User className="h-3 w-3" />
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            {getStatusIcon(message.status)}
            <span className="text-xs opacity-75">
              {format(message.sentAt, 'HH:mm', { locale: fr })}
            </span>
          </div>
        </div>

        {/* Subject (for emails) */}
        {message.subject && (
          <div className="mb-2">
            <p className="text-sm font-medium">{message.subject}</p>
          </div>
        )}

        {/* Message Content */}
        <div className="mb-2">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Message Footer */}
        <div className="flex items-center justify-between text-xs opacity-75">
          <span>
            {format(message.sentAt, 'dd MMM yyyy', { locale: fr })}
          </span>
          
          {!isInbound && (
            <div className="flex items-center space-x-1">
              {getStatusIcon(message.status)}
              <span>{getStatusText(message.status)}</span>
            </div>
          )}
          
          {message.readAt && (
            <span>Lu {format(message.readAt, 'HH:mm', { locale: fr })}</span>
          )}
        </div>

        {/* Metadata */}
        {message.metadata?.appointmentId && (
          <div className="mt-2 pt-2 border-t border-opacity-20 border-current">
            <p className="text-xs opacity-75">
              Lié au rendez-vous #{message.metadata.appointmentId.slice(-6)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunicationHistorySection({ 
  patient, 
  communicationHistory, 
  loading, 
  onSendMessage 
}: CommunicationHistorySectionProps) {
  const [filterType, setFilterType] = useState<'all' | 'email' | 'sms' | 'phone'>('all');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Chargement de l&apos;historique...</p>
        </div>
      </div>
    );
  }

  if (!communicationHistory) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-500">Impossible de charger l&apos;historique des communications.</p>
      </div>
    );
  }

  const filteredMessages = communicationHistory.messages.filter(message => 
    filterType === 'all' || message.type === filterType
  );

  const getMessageCounts = () => {
    const counts = communicationHistory.messages.reduce((acc, message) => {
      acc[message.type] = (acc[message.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      all: communicationHistory.messages.length,
      email: counts.email || 0,
      sms: counts.sms || 0,
      phone: counts.phone || 0
    };
  };

  const counts = getMessageCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Historique des communications</h3>
          <p className="text-sm text-gray-500">
            {communicationHistory.total} message(s) • {communicationHistory.unreadCount} non lu(s)
          </p>
        </div>
        <button
          onClick={onSendMessage}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Send className="h-4 w-4 mr-2" />
          Nouveau message
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Filtrer par type:</span>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'Tout', count: counts.all, icon: MessageCircle },
              { value: 'email', label: 'Email', count: counts.email, icon: Mail },
              { value: 'sms', label: 'SMS', count: counts.sms, icon: MessageCircle },
              { value: 'phone', label: 'Téléphone', count: counts.phone, icon: Phone }
            ].map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => setFilterType(option.value as 'all' | 'email' | 'sms' | 'phone')}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    filterType === option.value
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {option.label} ({option.count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Messages */}
      {filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterType === 'all' ? 'Aucune communication' : `Aucun ${filterType}`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filterType === 'all' 
              ? 'Commencez une conversation avec ce patient.'
              : `Aucun message de type ${filterType} trouvé.`
            }
          </p>
          {filterType === 'all' && (
            <button
              onClick={onSendMessage}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Envoyer un message
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
          {filteredMessages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))}
        </div>
      )}

      {/* Communication Preferences */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Préférences de communication</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-800">Méthode préférée:</span>
            <span className="ml-2 text-blue-700 capitalize">
              {patient.preferences.communicationMethod}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Rappels:</span>
            <span className="ml-2 text-blue-700">
              {patient.preferences.reminderEnabled ? 'Activés' : 'Désactivés'}
            </span>
          </div>
          <div>
            <span className="font-medium text-blue-800">Langue:</span>
            <span className="ml-2 text-blue-700 uppercase">
              {patient.preferences.preferredLanguage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
