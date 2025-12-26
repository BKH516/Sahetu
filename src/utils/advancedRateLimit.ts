
export class AdvancedRateLimiter {
  private static instance: AdvancedRateLimiter;
  private attempts: Map<string, { count: number; resetTime: number; blocked: boolean }> = new Map();
  

  static getInstance(): AdvancedRateLimiter {
    if (!AdvancedRateLimiter.instance) {
      AdvancedRateLimiter.instance = new AdvancedRateLimiter();
    }
    return AdvancedRateLimiter.instance;
  }

  
  checkLimit(
    key: string, 
    maxAttempts: number, 
    windowMs: number,
    blockDuration: number = 300000 
  ): { allowed: boolean; remaining: number; resetTime: number; blocked: boolean } {
    const now = Date.now();
    const attempt = this.attempts.get(key);
    
    
    if (attempt?.blocked) {
      if (now < attempt.resetTime) {
        return { allowed: false, remaining: 0, resetTime: attempt.resetTime, blocked: true };
      } else {
        
        this.attempts.delete(key);
      }
    }
    
    
    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs, blocked: false });
      return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs, blocked: false };
    }
    
    
    if (attempt.count >= maxAttempts) {
      
      this.attempts.set(key, { 
        count: attempt.count, 
        resetTime: now + blockDuration, 
        blocked: true 
      });
      return { allowed: false, remaining: 0, resetTime: now + blockDuration, blocked: true };
    }
    
    
    attempt.count++;
    return { 
      allowed: true, 
      remaining: maxAttempts - attempt.count, 
      resetTime: attempt.resetTime, 
      blocked: false 
    };
  }

  
  checkIPLimit(ip: string, maxAttempts: number = 10, windowMs: number = 60000): boolean {
    const result = this.checkLimit(`ip_${ip}`, maxAttempts, windowMs);
    return result.allowed;
  }

  
  checkUserLimit(userId: string, maxAttempts: number = 5, windowMs: number = 300000): boolean {
    const result = this.checkLimit(`user_${userId}`, maxAttempts, windowMs);
    return result.allowed;
  }

  
  checkEndpointLimit(endpoint: string, maxAttempts: number = 100, windowMs: number = 60000): boolean {
    const result = this.checkLimit(`endpoint_${endpoint}`, maxAttempts, windowMs);
    return result.allowed;
  }

  
  getBlockInfo(key: string): { blocked: boolean; remainingTime: number; attempts: number } | null {
    const attempt = this.attempts.get(key);
    if (!attempt) return null;

    const now = Date.now();
    return {
      blocked: attempt.blocked && now < attempt.resetTime,
      remainingTime: Math.max(0, attempt.resetTime - now),
      attempts: attempt.count
    };
  }

  
  removeBlock(key: string): void {
    this.attempts.delete(key);
  }

  
  cleanup(): void {
    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      if (now > attempt.resetTime) {
        this.attempts.delete(key);
      }
    }
  }

  
  getStats(): Record<string, { total: number; blocked: number; active: number }> {
    const stats: Record<string, { total: number; blocked: number; active: number }> = {
      ip: { total: 0, blocked: 0, active: 0 },
      user: { total: 0, blocked: 0, active: 0 },
      endpoint: { total: 0, blocked: 0, active: 0 }
    };

    const now = Date.now();
    for (const [key, attempt] of this.attempts.entries()) {
      const type = key.split('_')[0] as keyof typeof stats;
      if (stats[type]) {
        stats[type].total++;
        if (attempt.blocked && now < attempt.resetTime) {
          stats[type].blocked++;
        } else if (now < attempt.resetTime) {
          stats[type].active++;
        }
      }
    }

    return stats;
  }
}


export const rateLimiter = AdvancedRateLimiter.getInstance();


// Use requestIdleCallback if available, otherwise fallback to setInterval with longer delay
// This reduces performance impact on main thread
if (typeof requestIdleCallback !== 'undefined') {
  const scheduleCleanup = () => {
    requestIdleCallback(() => {
      rateLimiter.cleanup();
      setTimeout(scheduleCleanup, 60000);
    }, { timeout: 5000 });
  };
  scheduleCleanup();
} else {
  // Fallback: use setInterval but with passive optimization
  setInterval(() => {
    // Only cleanup if page is visible to reduce background work
    if (!document.hidden) {
      rateLimiter.cleanup();
    }
  }, 60000);
} 


export const useRateLimit = () => {
  const checkIPLimit = (ip: string, maxAttempts?: number, windowMs?: number) => {
    return rateLimiter.checkIPLimit(ip, maxAttempts, windowMs);
  };

  const checkUserLimit = (userId: string, maxAttempts?: number, windowMs?: number) => {
    return rateLimiter.checkUserLimit(userId, maxAttempts, windowMs);
  };

  const checkEndpointLimit = (endpoint: string, maxAttempts?: number, windowMs?: number) => {
    return rateLimiter.checkEndpointLimit(endpoint, maxAttempts, windowMs);
  };

  const getBlockInfo = (key: string) => {
    return rateLimiter.getBlockInfo(key);
  };

  const removeBlock = (key: string) => {
    rateLimiter.removeBlock(key);
  };

  return {
    checkIPLimit,
    checkUserLimit,
    checkEndpointLimit,
    getBlockInfo,
    removeBlock
  };
}; 