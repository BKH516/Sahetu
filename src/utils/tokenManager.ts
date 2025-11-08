import { securityLogger, logSecurityAlert, logLoginSuccess, logLoginFailure } from './securityLogger';
import { encryptedStorage } from './encryptedStorage';

export interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  issuedAt: number;
  sessionId: string;
}

export interface SessionInfo {
  userId: string;
  userAgent: string;
  ipAddress: string;
  lastActivity: number;
  loginTime: number;
}

class TokenManager {
  private refreshPromise: Promise<TokenData | null> | null = null;
  private readonly REFRESH_THRESHOLD = 5 * 60 * 1000; 
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; 
  private readonly MAX_SESSIONS = 5; 
  private activeSessions: Map<string, SessionInfo> = new Map();

  constructor() {
    this.loadActiveSessions();
    this.startSessionMonitor();
  }

  
  saveTokens(accessToken: string, refreshToken: string, userId: string, expiresIn: number = 3600): boolean {
    try {
      const sessionId = this.generateSessionId();
      const tokenData: TokenData = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + (expiresIn * 1000),
        issuedAt: Date.now(),
        sessionId
      };

      
      const success = encryptedStorage.setItem('token-data', tokenData);
      if (!success) {
        throw new Error('Failed to encrypt token data');
      }

      
      const sessionInfo: SessionInfo = {
        userId,
        userAgent: navigator.userAgent,
        ipAddress: this.getClientIP(),
        lastActivity: Date.now(),
        loginTime: Date.now()
      };

      this.activeSessions.set(sessionId, sessionInfo);
      this.saveActiveSessions();

      
      this.cleanupOldSessions(userId);

      securityLogger.log({
        eventType: 'LOGIN_SUCCESS',
        details: `Tokens saved for user: ${userId}, session: ${sessionId}`,
        severity: 'LOW'
      });

      return true;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to save tokens: ${error}`,
        severity: 'HIGH'
      });
      return false;
    }
  }

  
  getAccessToken(): string | null {
    try {
      const tokenData = this.getTokenData();
      if (!tokenData) return null;

      
      if (this.isTokenExpired(tokenData)) {
        this.clearTokens();
        return null;
      }

      
      if (!this.isSessionValid(tokenData.sessionId)) {
        this.clearTokens();
        return null;
      }

      
      this.updateSessionActivity(tokenData.sessionId);

      
      if (this.shouldRefreshToken(tokenData)) {
        this.refreshTokens();
        return null; 
      }

      return tokenData.accessToken;
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to get access token: ${error}`,
        severity: 'MEDIUM'
      });
      return null;
    }
  }

  
  private getTokenData(): TokenData | null {
    try {
      return encryptedStorage.getItem<TokenData>('token-data');
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to get token data: ${error}`,
        severity: 'MEDIUM'
      });
      return null;
    }
  }

  
  private isTokenExpired(tokenData: TokenData): boolean {
    return Date.now() >= tokenData.expiresAt;
  }

  
  private shouldRefreshToken(tokenData: TokenData): boolean {
    return (tokenData.expiresAt - Date.now()) <= this.REFRESH_THRESHOLD;
  }

  
  private isSessionValid(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    
    if (Date.now() - session.lastActivity > this.SESSION_TIMEOUT) {
      this.activeSessions.delete(sessionId);
      return false;
    }

    
    if (session.userAgent !== navigator.userAgent) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `User agent mismatch for session: ${sessionId}`,
        severity: 'HIGH'
      });
      return false;
    }

    return true;
  }

  
  private updateSessionActivity(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.lastActivity = Date.now();
      this.saveActiveSessions();
    }
  }

  
  async refreshTokens(): Promise<TokenData | null> {
    
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(): Promise<TokenData | null> {
    try {
      const tokenData = this.getTokenData();
      if (!tokenData?.refreshToken) {
        throw new Error('No refresh token available');
      }

      
      if (!this.isSessionValid(tokenData.sessionId)) {
        throw new Error('Invalid session');
      }

      
      const response = await fetch('https://evra-co.com/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.refreshToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`);
      }

      const newTokenData = await response.json();
      
      
      const success = this.saveTokens(
        newTokenData.access_token,
        newTokenData.refresh_token,
        newTokenData.user_id,
        newTokenData.expires_in
      );

      if (!success) {
        throw new Error('Failed to save refreshed tokens');
      }

      logSecurityAlert({
        details: 'Tokens refreshed successfully',
        severity: 'LOW'
      });

      return this.getTokenData();
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Token refresh failed: ${error}`,
        severity: 'HIGH'
      });
      
      
      this.clearTokens();
      return null;
    }
  }

  
  clearTokens(): void {
    try {
      const tokenData = this.getTokenData();
      if (tokenData) {
        
        this.activeSessions.delete(tokenData.sessionId);
        this.saveActiveSessions();
      }

      encryptedStorage.removeItem('token-data');
      
      logSecurityAlert({
        details: 'Tokens cleared',
        severity: 'LOW'
      });
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to clear tokens: ${error}`,
        severity: 'MEDIUM'
      });
    }
  }

  
  hasValidToken(): boolean {
    try {
      const tokenData = this.getTokenData();
      if (!tokenData) return false;

      return !this.isTokenExpired(tokenData) && this.isSessionValid(tokenData.sessionId);
    } catch (error) {
      return false;
    }
  }

  
  getTimeUntilExpiry(): number {
    try {
      const tokenData = this.getTokenData();
      if (!tokenData) return 0;

      return Math.max(0, tokenData.expiresAt - Date.now());
    } catch (error) {
      return 0;
    }
  }

  
  private generateSessionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2);
    return CryptoJS.SHA256(timestamp + random + navigator.userAgent).toString().substring(0, 16);
  }

  
  private getClientIP(): string {
    
    return 'unknown';
  }

  
  private cleanupOldSessions(userId: string): void {
    const userSessions = Array.from(this.activeSessions.entries())
      .filter(([_, session]) => session.userId === userId);

    if (userSessions.length > this.MAX_SESSIONS) {
      
      userSessions
        .sort((a, b) => a[1].loginTime - b[1].loginTime)
        .slice(0, userSessions.length - this.MAX_SESSIONS)
        .forEach(([sessionId, _]) => {
          this.activeSessions.delete(sessionId);
        });

      this.saveActiveSessions();
    }
  }

  
  private saveActiveSessions(): void {
    try {
      encryptedStorage.setItem('active-sessions', Array.from(this.activeSessions.entries()));
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to save active sessions: ${error}`,
        severity: 'MEDIUM'
      });
    }
  }

  
  private loadActiveSessions(): void {
    try {
      const sessions = encryptedStorage.getItem<[string, SessionInfo][]>('active-sessions');
      if (sessions) {
        this.activeSessions = new Map(sessions);
      }
    } catch (error) {
      securityLogger.log({
        eventType: 'SECURITY_ALERT',
        details: `Failed to load active sessions: ${error}`,
        severity: 'MEDIUM'
      });
    }
  }

  
  private startSessionMonitor(): void {
    setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;

      for (const [sessionId, session] of this.activeSessions.entries()) {
        if (now - session.lastActivity > this.SESSION_TIMEOUT) {
          this.activeSessions.delete(sessionId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.saveActiveSessions();
        securityLogger.log({
          eventType: 'SECURITY_ALERT',
          details: `Cleaned ${cleanedCount} expired sessions`,
          severity: 'LOW'
        });
      }
    }, 5 * 60 * 1000); 
  }

  
  getSessionStats(): { total: number; active: number; expired: number } {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const session of this.activeSessions.values()) {
      if (now - session.lastActivity <= this.SESSION_TIMEOUT) {
        active++;
      } else {
        expired++;
      }
    }

    return {
      total: this.activeSessions.size,
      active,
      expired
    };
  }
}


export const tokenManager = new TokenManager(); 