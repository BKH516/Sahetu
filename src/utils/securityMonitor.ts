import { securityLogger, logSecurityAlert, logLoginSuccess, logLoginFailure } from './securityLogger';


export interface SecurityAlert {
  id: string;
  type: 'SUSPICIOUS_ACTIVITY' | 'RATE_LIMIT_EXCEEDED' | 'MULTIPLE_FAILURES' | 'UNUSUAL_PATTERN';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: string;
  details: Record<string, unknown>;
}

class SecurityMonitor {
  private alerts: SecurityAlert[] = [];
  private failedLoginAttempts: Map<string, number> = new Map();
  private suspiciousPatterns: Map<string, number> = new Map();
  private maxFailedAttempts = 5;
  private maxSuspiciousPatterns = 3;

  
  monitorLoginAttempt(email: string, success: boolean) {
    if (!success) {
      const attempts = this.failedLoginAttempts.get(email) || 0;
      this.failedLoginAttempts.set(email, attempts + 1);

      if (attempts + 1 >= this.maxFailedAttempts) {
        this.createAlert('MULTIPLE_FAILURES', 'HIGH', 
          `Multiple failed login attempts for email: ${email}`, 
          { email, attempts: attempts + 1 });
      }
    } else {
      
      this.failedLoginAttempts.delete(email);
    }

    
    securityLogger.log({
      eventType: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      userEmail: email,
      details: success ? 'Login successful' : 'Login failed',
      severity: success ? 'LOW' : 'MEDIUM'
    });
  }

  
  monitorSuspiciousPattern(pattern: string, details: any) {
    const count = this.suspiciousPatterns.get(pattern) || 0;
    this.suspiciousPatterns.set(pattern, count + 1);

    if (count + 1 >= this.maxSuspiciousPatterns) {
      this.createAlert('SUSPICIOUS_ACTIVITY', 'HIGH',
        `Suspicious pattern detected: ${pattern}`,
        { pattern, count: count + 1, details });
    }
  }

  
  monitorRateLimit(userId?: number, userEmail?: string) {
    this.createAlert('RATE_LIMIT_EXCEEDED', 'MEDIUM',
      'Rate limit exceeded for user',
      { userId, userEmail });

    securityLogger.log({
      eventType: 'RATE_LIMIT_EXCEEDED',
      userId: userId?.toString(),
      userEmail,
      details: 'Rate limit exceeded',
      severity: 'MEDIUM'
    });
  }

  
  private createAlert(type: SecurityAlert['type'], severity: SecurityAlert['severity'], message: string, details: any) {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      details
    };

    this.alerts.push(alert);

    
    if (process.env.NODE_ENV === 'production') {
      this.sendAlertToAdmin(alert);
    }

    
    if (process.env.NODE_ENV === 'development') {
      
    }
  }

  
  private async sendAlertToAdmin(alert: SecurityAlert) {
    try {
      
      const csrfToken = this.getCSRFToken();
      
      await fetch('/api/security/alert', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'same-origin',
        body: JSON.stringify(alert)
      });
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to send security alert: ${error}`,
        severity: 'HIGH'
      });
    }
  }

  
  private getCSRFToken(): string {
    const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
    return metaTag?.content || this.generateCSRFToken();
  }

  
  private generateCSRFToken(): string {
    const token = btoa(Math.random().toString()).substr(10, 32);
    
    sessionStorage.setItem('csrf-token', token);
    return token;
  }

  
  getAlerts(): SecurityAlert[] {
    return [...this.alerts];
  }

  
  getAlertsBySeverity(severity: SecurityAlert['severity']): SecurityAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  
  clearOldAlerts(hours: number = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > cutoff
    );
  }

  
  getSecurityStats() {
    return {
      totalAlerts: this.alerts.length,
      highSeverityAlerts: this.alerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL').length,
      failedLoginAttempts: Array.from(this.failedLoginAttempts.values()).reduce((sum, count) => sum + count, 0),
      suspiciousPatterns: this.suspiciousPatterns.size
    };
  }
}

export const securityMonitor = new SecurityMonitor(); 