interface SecurityEvent {
  type: 'login_attempt' | 'login_success' | 'login_failure' | 'suspicious_activity' | 'rate_limit_exceeded';
  eventType?: string;
  userId?: string;
  userEmail?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  details?: any;
  severity?: string;
}


interface SecurityEventInput {
  type?: 'login_attempt' | 'login_success' | 'login_failure' | 'suspicious_activity' | 'rate_limit_exceeded';
  eventType?: string;
  userId?: string;
  userEmail?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  severity?: string;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents = 1000;

  log(event: SecurityEventInput): void {
    
    let normalizedEvent = { ...event };
    
    if (event.eventType && !event.type) {
      normalizedEvent.type = this.mapEventTypeToType(event.eventType);
    }
    
    
    if (!normalizedEvent.type) {
      normalizedEvent.type = 'suspicious_activity'; 
    }

    const securityEvent: SecurityEvent = {
      ...normalizedEvent,
      timestamp: new Date()
    } as SecurityEvent;

    this.events.push(securityEvent);

    
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    
    
    
    

    
    this.sendToLoggingService(securityEvent);
  }

  
  private mapEventTypeToType(eventType: string): SecurityEvent['type'] {
    const eventTypeMap: Record<string, SecurityEvent['type']> = {
      'SECURITY_ALERT': 'suspicious_activity',
      'LOGIN_SUCCESS': 'login_success',
      'LOGIN_FAILURE': 'login_failure',
      'LOGIN_ATTEMPT': 'login_attempt',
      'RATE_LIMIT_EXCEEDED': 'rate_limit_exceeded'
    };
    
    return eventTypeMap[eventType] || 'suspicious_activity';
  }

  private sendToLoggingService(event: SecurityEvent): void {
    
    
  }

  getEvents(type?: SecurityEvent['type']): SecurityEvent[] {
    if (type) {
      return this.events.filter(event => event.type === type);
    }
    return [...this.events];
  }

  getRecentEvents(minutes: number = 60): SecurityEvent[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.events.filter(event => event.timestamp > cutoff);
  }

  clearEvents(): void {
    this.events = [];
  }
}

export const securityLogger = new SecurityLogger();


export const logSecurityAlert = (data: Omit<SecurityEventInput, 'timestamp' | 'type'>) => {
  securityLogger.log({ type: 'suspicious_activity', ...data });
};

export const logLoginSuccess = (data: Omit<SecurityEventInput, 'timestamp' | 'type'>) => {
  securityLogger.log({ type: 'login_success', ...data });
};

export const logLoginFailure = (data: Omit<SecurityEventInput, 'timestamp' | 'type'>) => {
  securityLogger.log({ type: 'login_failure', ...data });
};