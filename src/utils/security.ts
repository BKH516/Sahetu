
import api from '../lib/axios';


export type SecurityEventType = 
  | 'failed_login'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'session_timeout'
  | 'invalid_token'
  | 'xss_attempt'
  | 'csrf_attempt'
  | 'sql_injection_attempt';


export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}


const SECURITY_CONFIG = {
  maxFailedLogins: 5,
  maxRequestsPerMinute: 10,
  sessionTimeoutMinutes: 30,
  suspiciousPatterns: [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /'; DROP TABLE/gi,
    /UNION SELECT/gi,
    /OR 1=1/gi
  ]
};


class SecurityMonitor {
  private failedLoginAttempts: Map<string, number> = new Map();
  private requestCounts: Map<string, number> = new Map();
  private lastRequestTime: Map<string, number> = new Map();
  private securityEvents: SecurityEvent[] = [];

  
  public checkInput(input: string): { isSuspicious: boolean; pattern: string | null } {
    for (const pattern of SECURITY_CONFIG.suspiciousPatterns) {
      if (pattern.test(input)) {
        this.logSecurityEvent('xss_attempt', {
          input: input.substring(0, 100), 
          pattern: pattern.source
        });
        return { isSuspicious: true, pattern: pattern.source };
      }
    }
    return { isSuspicious: false, pattern: null };
  }

  
  public checkFailedLogin(email: string): boolean {
    const attempts = this.failedLoginAttempts.get(email) || 0;
    const newAttempts = attempts + 1;
    this.failedLoginAttempts.set(email, newAttempts);

    if (newAttempts >= SECURITY_CONFIG.maxFailedLogins) {
      this.logSecurityEvent('failed_login', {
        email,
        attempts: newAttempts,
        blocked: true
      });
      return false; 
    }

    this.logSecurityEvent('failed_login', {
      email,
      attempts: newAttempts,
      blocked: false
    });
    return true; 
  }

  
  public resetFailedLoginAttempts(email: string): void {
    this.failedLoginAttempts.delete(email);
  }

  
  public checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const lastRequest = this.lastRequestTime.get(identifier) || 0;
    const timeDiff = now - lastRequest;

    if (timeDiff < 60000) { 
      const count = this.requestCounts.get(identifier) || 0;
      const newCount = count + 1;
      this.requestCounts.set(identifier, newCount);

      if (newCount > SECURITY_CONFIG.maxRequestsPerMinute) {
        this.logSecurityEvent('rate_limit_exceeded', {
          identifier,
          count: newCount,
          timeDiff
        });
        return false; 
      }
    } else {
      
      this.requestCounts.set(identifier, 1);
    }

    this.lastRequestTime.set(identifier, now);
    return true; 
  }

  
  public checkSessionExpiry(): boolean {
    const lastActivity = localStorage.getItem('lastActivity');
    if (!lastActivity) return true; 

    const timeout = SECURITY_CONFIG.sessionTimeoutMinutes * 60 * 1000;
    const now = Date.now();
    const timeSinceLastActivity = now - parseInt(lastActivity);

    if (timeSinceLastActivity > timeout) {
      this.logSecurityEvent('session_timeout', {
        timeSinceLastActivity,
        timeout
      });
      return true; 
    }

    return false; 
  }

  
  public validateToken(token: string): boolean {
    if (!token || token.length < 10) {
      this.logSecurityEvent('invalid_token', {
        tokenLength: token?.length || 0,
        reason: 'token_too_short'
      });
      return false;
    }

    
    const suspiciousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /'; DROP/gi
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(token)) {
        this.logSecurityEvent('invalid_token', {
          pattern: pattern.source,
          reason: 'suspicious_pattern'
        });
        return false;
      }
    }

    return true;
  }

  
  public logSecurityEvent(
    type: SecurityEventType,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): void {
    const event: SecurityEvent = {
      type,
      userId: this.getCurrentUserId(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      details,
      severity
    };

    this.securityEvents.push(event);
    if (process.env.NODE_ENV === 'development') {
      
    }

    
    this.sendSecurityEventToServer(event);

    
    this.handleSecurityEvent(event);
  }

  
  private handleSecurityEvent(event: SecurityEvent): void {
    switch (event.severity) {
      case 'critical':
        
        this.blockUser(event.userId);
        break;
      case 'high':
        
        this.monitorUser(event.userId);
        break;
      case 'medium':
        
        break;
      case 'low':
        
        break;
    }
  }

  
  private blockUser(userId?: string): void {
    if (userId) {
      localStorage.setItem(`blocked_${userId}`, Date.now().toString());
    }
    
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login?blocked=true';
  }

  
  private monitorUser(userId?: string): void {
    if (userId) {
      const monitoredUsers = JSON.parse(localStorage.getItem('monitored_users') || '[]');
      if (!monitoredUsers.includes(userId)) {
        monitoredUsers.push(userId);
        localStorage.setItem('monitored_users', JSON.stringify(monitoredUsers));
      }
    }
  }

  
  private async sendSecurityEventToServer(event: SecurityEvent): Promise<void> {
    try {
      await api.post('/api/security/log', event);
    } catch (error) {
      
    }
  }

  
  private getCurrentUserId(): string | undefined {
    try {
      const authData = localStorage.getItem('auth-storage');
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.state?.user?.id?.toString();
      }
    } catch (error) {
      
    }
    return undefined;
  }

  
  private getClientIP(): string {
    
    return 'client-ip';
  }

  
  public getSecurityEvents(): SecurityEvent[] {
    return [...this.securityEvents];
  }

  
  public clearSecurityEvents(): void {
    this.securityEvents = [];
  }

  
  public getSecurityStats(): {
    totalEvents: number;
    criticalEvents: number;
    highEvents: number;
    mediumEvents: number;
    lowEvents: number;
  } {
    const stats = {
      totalEvents: this.securityEvents.length,
      criticalEvents: this.securityEvents.filter(e => e.severity === 'critical').length,
      highEvents: this.securityEvents.filter(e => e.severity === 'high').length,
      mediumEvents: this.securityEvents.filter(e => e.severity === 'medium').length,
      lowEvents: this.securityEvents.filter(e => e.severity === 'low').length,
    };

    return stats;
  }
}


export const securityMonitor = new SecurityMonitor();


export const securityUtils = {
  
  sanitizeAndValidate: (input: string, type: 'text' | 'email' | 'phone' | 'password'): {
    isValid: boolean;
    message: string;
    sanitized: string;
  } => {
    
    const suspiciousCheck = securityMonitor.checkInput(input);
    if (suspiciousCheck.isSuspicious) {
      return {
        isValid: false,
        message: 'تم اكتشاف محتوى مشبوه',
        sanitized: ''
      };
    }

    
    const { validateInput } = require('./utils');
    const validation = validateInput(input, type);
    
    return {
      isValid: validation.isValid,
      message: validation.message,
      sanitized: input.trim()
    };
  },

  
  isUserBlocked: (userId?: string): boolean => {
    if (!userId) return false;
    const blockedTime = localStorage.getItem(`blocked_${userId}`);
    if (blockedTime) {
      const blockTime = parseInt(blockedTime);
      const now = Date.now();
      const blockDuration = 24 * 60 * 60 * 1000; 
      return (now - blockTime) < blockDuration;
    }
    return false;
  },

  
  isUserMonitored: (userId?: string): boolean => {
    if (!userId) return false;
    const monitoredUsers = JSON.parse(localStorage.getItem('monitored_users') || '[]');
    return monitoredUsers.includes(userId);
  },

  
  generateSecureToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  
  hashData: (data: string): string => {
    
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; 
    }
    return Math.abs(hash).toString(16);
  }
};


export default securityMonitor; 