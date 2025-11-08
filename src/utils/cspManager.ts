interface CSPDirective {
  [key: string]: string[];
}

interface CSPPolicy {
  directives: CSPDirective;
  reportOnly?: boolean;
}

class CSPManager {
  private defaultPolicy: CSPPolicy = {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': ["'self'", 'https://api.evra-co.com', 'https://evra-co.com'],
      'base-uri': ["'self'"],
      'form-action': ["'self'"]
    },
    reportOnly: false
  };

  private currentPolicy: CSPPolicy;

  constructor() {
    this.currentPolicy = { ...this.defaultPolicy };
    this.applyPolicy();
  }

  setPolicy(policy: Partial<CSPPolicy>): void {
    this.currentPolicy = {
      ...this.currentPolicy,
      ...policy,
      directives: {
        ...this.currentPolicy.directives,
        ...policy.directives
      }
    };
    this.applyPolicy();
  }

  addDirective(directive: string, sources: string[]): void {
    if (!this.currentPolicy.directives[directive]) {
      this.currentPolicy.directives[directive] = [];
    }
    
    sources.forEach(source => {
      if (!this.currentPolicy.directives[directive].includes(source)) {
        this.currentPolicy.directives[directive].push(source);
      }
    });
    
    this.applyPolicy();
  }

  removeDirective(directive: string, sources?: string[]): void {
    if (!this.currentPolicy.directives[directive]) {
      return;
    }

    if (!sources) {
      delete this.currentPolicy.directives[directive];
    } else {
      this.currentPolicy.directives[directive] = this.currentPolicy.directives[directive]
        .filter(source => !sources.includes(source));
      
      if (this.currentPolicy.directives[directive].length === 0) {
        delete this.currentPolicy.directives[directive];
      }
    }
    
    this.applyPolicy();
  }

  private applyPolicy(): void {
    const policyString = this.buildPolicyString();
    const headerName = this.currentPolicy.reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';

    
    this.updateMetaTag(headerName, policyString);
  }

  private buildPolicyString(): string {
    return Object.entries(this.currentPolicy.directives)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  private updateMetaTag(name: string, content: string): void {
    
    const existingTag = document.querySelector(`meta[http-equiv="${name}"]`);
    if (existingTag) {
      existingTag.remove();
    }

    
    const metaTag = document.createElement('meta');
    metaTag.setAttribute('http-equiv', name);
    metaTag.setAttribute('content', content);
    document.head.appendChild(metaTag);
  }

  getCurrentPolicy(): CSPPolicy {
    return { ...this.currentPolicy };
  }

  resetToDefault(): void {
    this.currentPolicy = { ...this.defaultPolicy };
    this.applyPolicy();
  }

  enableReportOnly(enable: boolean = true): void {
    this.currentPolicy.reportOnly = enable;
    this.applyPolicy();
  }

  monitorCSPViolations(): void {
    
    document.addEventListener('securitypolicyviolation', (event) => {
      
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber
      });
    });
  }
}

export const cspManager = new CSPManager();