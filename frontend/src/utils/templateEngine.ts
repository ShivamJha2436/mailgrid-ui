// Template Engine for Go Template Processing
import Papa from 'papaparse';

interface TemplateData {
  [key: string]: any;
}

export class TemplateEngine {
  private static instance: TemplateEngine;
  private cache: Map<string, any> = new Map();

  static getInstance(): TemplateEngine {
    if (!TemplateEngine.instance) {
      TemplateEngine.instance = new TemplateEngine();
    }
    return TemplateEngine.instance;
  }

  // Parse CSV with proper error handling and caching
  parseCSV(csvContent: string): Promise<TemplateData[]> {
    const cacheKey = `csv_${csvContent.substring(0, 100)}`;
    
    if (this.cache.has(cacheKey)) {
      return Promise.resolve(this.cache.get(cacheKey));
    }

    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          const data = results.data as TemplateData[];
          this.cache.set(cacheKey, data);
          resolve(data);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  }

  // Process Go template with data
  processTemplate(template: string, data: TemplateData): string {
    if (!template || !data) return template;

    let processed = template;

    // Handle Go template syntax
    // Basic variable replacement: {{.FieldName}}
    processed = processed.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (match, field) => {
      return data[field] !== undefined ? String(data[field]) : match;
    });

    // Handle with/range blocks
    processed = processed.replace(/\{\{\s*with\s+\.(\w+)\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g, 
      (_match, field, content) => {
        if (data[field]) {
          return this.processTemplate(content, { ...data, '.': data[field] });
        }
        return '';
      }
    );

    // Handle if conditions
    processed = processed.replace(/\{\{\s*if\s+\.(\w+)\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g,
      (_match, field, content) => {
        if (data[field]) {
          return this.processTemplate(content, data);
        }
        return '';
      }
    );

    // Handle if-else conditions
    processed = processed.replace(/\{\{\s*if\s+\.(\w+)\s*\}\}([\s\S]*?)\{\{\s*else\s*\}\}([\s\S]*?)\{\{\s*end\s*\}\}/g,
      (_match, field, ifContent, elseContent) => {
        if (data[field]) {
          return this.processTemplate(ifContent, data);
        }
        return this.processTemplate(elseContent, data);
      }
    );

    // Handle pipe functions
    processed = processed.replace(/\{\{\s*\.(\w+)\s*\|\s*(\w+)\s*\}\}/g,
      (match, field, func) => {
        const value = data[field];
        if (value === undefined) return match;
        
        switch(func.toLowerCase()) {
          case 'upper':
            return String(value).toUpperCase();
          case 'lower':
            return String(value).toLowerCase();
          case 'title':
            return String(value).replace(/\w\S*/g, txt => 
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
          case 'html':
            return String(value); // Already HTML escaped in React
          default:
            return String(value);
        }
      }
    );

    return processed;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Validate template syntax
  validateTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check for unclosed tags
    const openTags = (template.match(/\{\{[^}]*$/g) || []).length;
    const closeTags = (template.match(/^[^{]*\}\}/g) || []).length;
    
    if (openTags !== closeTags) {
      errors.push('Unclosed template tags detected');
    }

    // Check for balanced if/end blocks
    const ifCount = (template.match(/\{\{\s*if\s+/g) || []).length;
    const endCount = (template.match(/\{\{\s*end\s*\}\}/g) || []).length;
    
    if (ifCount !== endCount) {
      errors.push(`Unbalanced if/end blocks: ${ifCount} if blocks, ${endCount} end blocks`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Get all template variables
  extractVariables(template: string): string[] {
    const variables = new Set<string>();
    const regex = /\{\{\s*\.(\w+)(?:\s*\|[^}]*)?\s*\}\}/g;
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }
}

export const templateEngine = TemplateEngine.getInstance();
