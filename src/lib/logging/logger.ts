import fs from 'fs';
import path from 'path';
import EnvironmentManager from '../config/environment';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  userId?: string;
  cabinetId?: string;
  requestId?: string;
  ip?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logFilePath: string;
  private isDevelopment: boolean;

  private constructor() {
    const env = EnvironmentManager.getInstance();
    const config = env.getConfig();
    
    this.logLevel = this.parseLogLevel(config.logging.level);
    this.logFilePath = config.logging.filePath;
    this.isDevelopment = env.isDevelopment();
    
    this.ensureLogDirectory();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, meta, userId, cabinetId, requestId, ip } = entry;
    
    let logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (userId) logLine += ` | User: ${userId}`;
    if (cabinetId) logLine += ` | Cabinet: ${cabinetId}`;
    if (requestId) logLine += ` | Request: ${requestId}`;
    if (ip) logLine += ` | IP: ${ip}`;
    
    if (meta) {
      logLine += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    return logLine;
  }

  private writeLog(entry: LogEntry): void {
    const logLine = this.formatLogEntry(entry) + '\n';
    
    // Console output in development
    if (this.isDevelopment) {
      const color = this.getConsoleColor(entry.level);
      console.log(color + logLine.trim() + '\x1b[0m');
    }
    
    // File output
    try {
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private getConsoleColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error': return '\x1b[31m'; // Red
      case 'warn': return '\x1b[33m';  // Yellow
      case 'info': return '\x1b[36m';  // Cyan
      case 'debug': return '\x1b[90m'; // Gray
      default: return '\x1b[0m';       // Reset
    }
  }

  private createLogEntry(
    level: string,
    message: string,
    meta?: any,
    context?: {
      userId?: string;
      cabinetId?: string;
      requestId?: string;
      ip?: string;
    }
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      meta,
      ...context
    };
  }

  public error(message: string, meta?: any, context?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry('error', message, meta, context);
      this.writeLog(entry);
    }
  }

  public warn(message: string, meta?: any, context?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry('warn', message, meta, context);
      this.writeLog(entry);
    }
  }

  public info(message: string, meta?: any, context?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry('info', message, meta, context);
      this.writeLog(entry);
    }
  }

  public debug(message: string, meta?: any, context?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry('debug', message, meta, context);
      this.writeLog(entry);
    }
  }

  // Specialized logging methods
  public logAuth(action: string, userId: string, success: boolean, ip?: string, meta?: any): void {
    this.info(`Auth ${action}: ${success ? 'SUCCESS' : 'FAILED'}`, meta, {
      userId,
      ip
    });
  }

  public logCabinetAccess(action: string, userId: string, cabinetId: string, ip?: string, meta?: any): void {
    this.info(`Cabinet access ${action}`, meta, {
      userId,
      cabinetId,
      ip
    });
  }

  public logAPIRequest(method: string, path: string, userId?: string, cabinetId?: string, requestId?: string, ip?: string): void {
    this.info(`API ${method} ${path}`, undefined, {
      userId,
      cabinetId,
      requestId,
      ip
    });
  }

  public logError(error: Error, context?: any): void {
    this.error(error.message, {
      stack: error.stack,
      name: error.name
    }, context);
  }

  // Audit logging for compliance
  public audit(action: string, resourceType: string, resourceId: string, userId: string, cabinetId?: string, details?: any): void {
    this.info(`AUDIT: ${action} ${resourceType}`, {
      resourceId,
      details,
      audit: true
    }, {
      userId,
      cabinetId
    });
  }
}

export default Logger;