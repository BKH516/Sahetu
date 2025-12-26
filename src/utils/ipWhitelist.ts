interface WhitelistEntry {
  ip: string;
  description?: string;
  addedAt: Date;
  expiresAt?: Date;
}

class IpWhitelistManager {
  private whitelist: WhitelistEntry[] = [];
  private readonly storageKey = 'ip_whitelist';

  constructor() {
    this.loadFromStorage();
  }

  addIp(ip: string, description?: string, expiresInHours?: number): void {
    const entry: WhitelistEntry = {
      ip,
      description,
      addedAt: new Date(),
      expiresAt: expiresInHours ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) : undefined
    };

    
    this.whitelist = this.whitelist.filter(item => item.ip !== ip);
    
    
    this.whitelist.push(entry);
    this.saveToStorage();
  }

  removeIp(ip: string): boolean {
    const initialLength = this.whitelist.length;
    this.whitelist = this.whitelist.filter(item => item.ip !== ip);
    
    if (this.whitelist.length < initialLength) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  isWhitelisted(ip: string): boolean {
    this.cleanExpiredEntries();
    return this.whitelist.some(entry => entry.ip === ip);
  }

  getWhitelist(): WhitelistEntry[] {
    this.cleanExpiredEntries();
    return [...this.whitelist];
  }

  private cleanExpiredEntries(): void {
    const now = new Date();
    const initialLength = this.whitelist.length;
    
    this.whitelist = this.whitelist.filter(entry => 
      !entry.expiresAt || entry.expiresAt > now
    );

    if (this.whitelist.length < initialLength) {
      this.saveToStorage();
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.whitelist = data.map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt),
          expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined
        }));
      }
    } catch (error) {
      
      this.whitelist = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.whitelist));
    } catch (error) {
      
    }
  }

  clearWhitelist(): void {
    this.whitelist = [];
    this.saveToStorage();
  }
}

export const ipWhitelistManager = new IpWhitelistManager();