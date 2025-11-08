
export class InputSanitizer {
  
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') 
      .replace(/javascript:/gi, '') 
      .replace(/on\w+=/gi, '') 
      .replace(/data:/gi, '') 
      .replace(/vbscript:/gi, '') 
      .trim();
  }

  
  static sanitizeHTML(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const allowedTags = ['p', 'br', 'strong', 'em', 'u'];
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^<>]*>/gi;
    
    return input.replace(tagRegex, (match, tagName) => {
      return allowedTags.includes(tagName.toLowerCase()) ? match : '';
    });
  }

  
  static sanitizeSQL(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
      'EXEC', 'EXECUTE', 'UNION', 'SCRIPT', '--', ';', '/*', '*/'
    ];
    
    let sanitized = input;
    sqlKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized.trim();
  }

  
  static sanitizeNoSQL(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeText(input);
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeNoSQL(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.sanitizeNoSQL(value);
      }
      return sanitized;
    }
    
    return input;
  }

  
  static sanitizeEmail(email: string): string {
    if (!email || typeof email !== 'string') return '';
    
    return email
      .toLowerCase()
      .replace(/[^a-z0-9@._-]/g, '')
      .trim();
  }

  
  static sanitizePhone(phone: string): string {
    if (!phone || typeof phone !== 'string') return '';
    
    return phone
      .replace(/[^0-9+()-\s]/g, '')
      .trim();
  }

  
  static sanitizeURL(url: string): string {
    if (!url || typeof url !== 'string') return '';
    
    try {
      const urlObj = new URL(url);
      const allowedProtocols = ['http:', 'https:'];
      
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return '';
      }
      
      return urlObj.toString();
    } catch {
      return '';
    }
  }

  
  static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeText(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeText(key);
        sanitized[sanitizedKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }
}


export const sanitizeInput = InputSanitizer.sanitizeText;
export const sanitizeHTML = InputSanitizer.sanitizeHTML;
export const sanitizeEmail = InputSanitizer.sanitizeEmail;
export const sanitizePhone = InputSanitizer.sanitizePhone;
export const sanitizeURL = InputSanitizer.sanitizeURL;
export const sanitizeObject = InputSanitizer.sanitizeObject;