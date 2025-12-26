/**
 * Content Generators for Programmatic SEO Templates
 * Implementations for different content blocks
 */

import {
  BlockType,
  CodeExample,
  ContentNode,
  FAQItem,
  TemplateContext,
  TemplateUtils,
  ContentGenerator,
} from "./pseo-templates";

// ==================== Getting Started Generator ====================
export class GettingStartedGenerator extends ContentGenerator {
  generate(ctx: TemplateContext): ContentNode[] {
    const { api } = ctx;

    const content: ContentNode[] = [];

    // Introduction
    content.push({
      type: "paragraph",
      text: `The ${api.name} API provides ${api.description}. ${
        api.auth === "No"
          ? "No authentication required - start using it immediately!"
          : `Authentication via ${api.auth} is required to access the API.`
      }`,
    });

    // Quick Info List
    const quickInfo: string[] = [
      `**Base URL**: ${TemplateUtils.extractBaseUrl(api.link)}`,
      `**Protocol**: ${api.https ? "HTTPS ✓" : "HTTP"}`,
      `**CORS**: ${api.cors}`,
      `**Authentication**: ${api.auth}`,
    ];

    if (api.latencyMs !== null) {
      quickInfo.push(`**Average Response Time**: ${api.latencyMs}ms`);
    }

    content.push({
      type: "list",
      items: quickInfo,
    });

    // Quick Start Code Example
    content.push({
      type: "heading",
      level: 3,
      text: "Quick Start Example",
      id: "quick-start",
    });

    content.push({
      type: "code_block",
      language: "bash",
      code: this.generateQuickStartCurl(api),
    });

    // Authentication Details
    if (api.auth !== "No") {
      content.push({
        type: "heading",
        level: 3,
        text: "Authentication",
        id: "authentication",
      });

      content.push({
        type: "paragraph",
        text: this.getAuthenticationGuide(api.auth),
      });
    }

    return content;
  }

  private generateQuickStartCurl(api: TemplateContext["api"]): string {
    const baseUrl = TemplateUtils.extractBaseUrl(api.link);
    let curl = `curl -X GET '${baseUrl}'`;

    if (api.auth !== "No") {
      if (api.auth === "apiKey") {
        curl += ` \\\n  -H 'Authorization: Bearer YOUR_API_KEY'`;
      } else if (api.auth === "OAuth") {
        curl += ` \\\n  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN'`;
      }
    }

    curl += ` \\\n  -H 'Content-Type: application/json'`;

    return curl;
  }

  private getAuthenticationGuide(authType: string): string {
    const guides: Record<string, string> = {
      apiKey:
        "This API uses API Key authentication. Include your API key in the Authorization header as a Bearer token. You can obtain your API key by registering on the provider's website.",
      OAuth:
        "This API uses OAuth 2.0 authentication. You'll need to obtain an access token through the OAuth flow before making API requests. Check the official documentation for OAuth endpoints and scopes.",
      "X-Mashape-Key":
        "This API requires a Mashape key. Include your key in the X-Mashape-Key header. Sign up on RapidAPI to get your key.",
      "User-Agent":
        "This API requires a User-Agent header in your requests. Make sure to include a descriptive User-Agent string identifying your application.",
    };

    return (
      guides[authType] ||
      `This API uses ${authType} authentication. Please refer to the official documentation for detailed authentication instructions.`
    );
  }
}

// ==================== Code Examples Generator ====================
export class CodeExamplesGenerator extends ContentGenerator {
  generate(ctx: TemplateContext): ContentNode[] {
    const { api } = ctx;
    const content: ContentNode[] = [];

    const languages = this.getAvailableLanguages(api);

    content.push({
      type: "paragraph",
      text: `Here are code examples for calling the ${api.name} API in different programming languages:`,
    });

    for (const lang of languages) {
      const example = this.generateCodeExample(api, lang);

      content.push({
        type: "heading",
        level: 3,
        text: this.getLanguageDisplayName(lang),
        id: `example-${lang}`,
      });

      if (example.description) {
        content.push({
          type: "paragraph",
          text: example.description,
        });
      }

      content.push({
        type: "code_block",
        language: example.language,
        code: example.code,
        filename: example.filename,
      });
    }

    return content;
  }

  private getAvailableLanguages(api: TemplateContext["api"]): string[] {
    const documented =
      api.seoMetadata?.languages
        ?.map((l) => l.language?.toLowerCase())
        .filter((l): l is string => !!l) || [];
    const common = ["curl", "javascript", "python"];

    // Merge and deduplicate
    const all = [...new Set([...documented, ...common])];
    return all.slice(0, 5); // Limit to 5 examples
  }

  private generateCodeExample(
    api: TemplateContext["api"],
    lang: string,
  ): CodeExample {
    const baseUrl = TemplateUtils.extractBaseUrl(api.link);
    const hasAuth = api.auth !== "No";

    switch (lang.toLowerCase()) {
      case "javascript":
      case "typescript":
        return {
          language: "javascript",
          filename: `${TemplateUtils.slugify(api.name)}.js`,
          description: `Example using the Fetch API in JavaScript/TypeScript`,
          code: `// ${api.name} API Example
const apiUrl = '${baseUrl}';
${hasAuth ? `const apiKey = 'YOUR_API_KEY';` : ""}

async function fetch${api.name.replace(/\s/g, "")}Data() {
  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        ${hasAuth ? `'Authorization': \`Bearer \${apiKey}\`,` : ""}
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('Error calling API:', error);
    throw error;
  }
}

// Call the function
fetch${api.name.replace(/\s/g, "")}Data();`,
        };

      case "python":
        return {
          language: "python",
          filename: `${TemplateUtils.slugify(api.name)}.py`,
          description: `Example using the requests library in Python`,
          code: `# ${api.name} API Example
import requests
import json

api_url = '${baseUrl}'
${hasAuth ? `api_key = 'YOUR_API_KEY'` : ""}

def fetch_${TemplateUtils.slugify(api.name).replace(/-/g, "_")}_data():
    """Fetch data from ${api.name} API"""
    ${
      hasAuth
        ? `
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
    }`
        : `
    headers = {
        'Content-Type': 'application/json',
    }`
    }

    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        data = response.json()
        print('API Response:', json.dumps(data, indent=2))
        return data
    except requests.exceptions.RequestException as e:
        print(f'Error calling API: {e}')
        raise

if __name__ == '__main__':
    fetch_${TemplateUtils.slugify(api.name).replace(/-/g, "_")}_data()`,
        };

      case "node":
      case "nodejs":
        return {
          language: "javascript",
          filename: `${TemplateUtils.slugify(api.name)}.js`,
          description: `Example using axios in Node.js`,
          code: `// ${api.name} API Example with axios
const axios = require('axios');

const apiUrl = '${baseUrl}';
${hasAuth ? `const apiKey = 'YOUR_API_KEY';` : ""}

async function fetch${api.name.replace(/\s/g, "")}Data() {
  try {
    const response = await axios.get(apiUrl, {
      headers: {
        ${hasAuth ? `'Authorization': \`Bearer \${apiKey}\`,` : ""}
        'Content-Type': 'application/json',
      },
    });

    console.log('API Response:', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    throw error;
  }
}

fetch${api.name.replace(/\s/g, "")}Data();`,
        };

      case "curl":
      default:
        return {
          language: "bash",
          description: `Example using cURL from the command line`,
          code: `# ${api.name} API Example
curl -X GET '${baseUrl}' \\
${hasAuth ? `  -H 'Authorization: Bearer YOUR_API_KEY' \\\n` : ""}  -H 'Content-Type: application/json'`,
        };
    }
  }

  private getLanguageDisplayName(lang: string): string {
    const names: Record<string, string> = {
      javascript: "JavaScript",
      typescript: "TypeScript",
      python: "Python",
      curl: "cURL",
      node: "Node.js",
      nodejs: "Node.js",
      go: "Go",
      rust: "Rust",
      java: "Java",
      php: "PHP",
      ruby: "Ruby",
    };

    return (
      names[lang.toLowerCase()] || lang.charAt(0).toUpperCase() + lang.slice(1)
    );
  }
}

// ==================== FAQ Generator ====================
export class FAQGenerator extends ContentGenerator {
  generate(ctx: TemplateContext): ContentNode[] {
    const { api, healthSummary } = ctx;
    const faqItems = this.generateFAQItems(api, healthSummary);

    const content: ContentNode[] = [];

    content.push({
      type: "paragraph",
      text: `Frequently asked questions about the ${api.name} API:`,
    });

    // Group by category
    const grouped = this.groupByCategory(faqItems);

    for (const [category, items] of Object.entries(grouped)) {
      if (items.length === 0) continue;

      content.push({
        type: "heading",
        level: 3,
        text: this.getCategoryDisplayName(category),
        id: `faq-${category}`,
      });

      for (const item of items) {
        content.push({
          type: "heading",
          level: 4,
          text: item.question,
        });

        content.push({
          type: "paragraph",
          text: item.answer,
        });
      }
    }

    return content;
  }

  private generateFAQItems(
    api: TemplateContext["api"],
    healthSummary?: TemplateContext["healthSummary"],
  ): FAQItem[] {
    const items: FAQItem[] = [];

    // 1. Authentication FAQ
    if (api.auth !== "No") {
      items.push({
        question: `How do I authenticate with the ${api.name} API?`,
        answer: `The ${api.name} API uses ${api.auth} authentication. ${this.getAuthDetail(
          api.auth,
        )}`,
        category: "technical",
        keywords: ["authentication", "auth", api.auth.toLowerCase()],
      });
    } else {
      items.push({
        question: `Does the ${api.name} API require authentication?`,
        answer: `No, the ${api.name} API is publicly accessible without authentication. You can start making requests immediately without any API keys or tokens.`,
        category: "technical",
        keywords: ["authentication", "no auth", "public api"],
      });
    }

    // 2. CORS FAQ
    if (api.cors === "Yes") {
      items.push({
        question: `Can I use the ${api.name} API from a web browser?`,
        answer: `Yes! The ${api.name} API supports CORS (Cross-Origin Resource Sharing), which means you can make requests directly from web browsers without encountering CORS errors.`,
        category: "technical",
        keywords: ["cors", "browser", "client-side"],
      });
    } else {
      items.push({
        question: `Can I call the ${api.name} API from a web browser?`,
        answer: `The ${api.name} API does not support CORS, so direct browser requests may fail due to CORS restrictions. You'll need to make requests from a backend server instead.`,
        category: "technical",
        keywords: ["cors", "browser", "server-side"],
      });
    }

    // 3. HTTPS FAQ
    items.push({
      question: `Is the ${api.name} API secure?`,
      answer: `${
        api.https
          ? `Yes, the ${api.name} API uses HTTPS encryption to secure all data in transit. All API requests and responses are encrypted.`
          : `The ${api.name} API uses HTTP. For production use, consider using HTTPS endpoints if available, or implement additional security measures.`
      }`,
      category: "security",
      keywords: ["https", "ssl", "security", "encryption"],
    });

    // 4. Performance FAQ
    if (api.latencyMs !== null && api.latencyMs !== undefined) {
      items.push({
        question: `What is the typical response time for the ${api.name} API?`,
        answer: `Based on our monitoring, the ${api.name} API typically responds in ${
          api.latencyMs
        }ms. ${
          api.latencyMs < 500
            ? "This is excellent performance, suitable for real-time applications."
            : api.latencyMs < 1000
              ? "This is good performance for most use cases."
              : "Consider implementing caching or CDN for better user experience."
        }`,
        category: "technical",
        keywords: ["performance", "latency", "speed"],
      });
    }

    // 5. Reliability FAQ
    if (
      healthSummary?.uptimePct !== null &&
      healthSummary?.uptimePct !== undefined
    ) {
      items.push({
        question: `How reliable is the ${api.name} API?`,
        answer: `Over the last 30 days, the ${api.name} API has maintained ${healthSummary.uptimePct.toFixed(
          2,
        )}% uptime. ${
          healthSummary.uptimePct >= 99
            ? "This is excellent reliability."
            : healthSummary.uptimePct >= 95
              ? "This is good reliability for most use cases."
              : "You may want to implement retry logic and error handling."
        }`,
        category: "support",
        keywords: ["uptime", "reliability", "sla"],
      });
    }

    // 6. Documentation FAQ
    if (
      api.seoMetadata?.docQualityScore &&
      api.seoMetadata.docQualityScore >= 6
    ) {
      items.push({
        question: `Where can I find the ${api.name} API documentation?`,
        answer: `The ${api.name} API has ${
          api.seoMetadata.docQualityScore >= 8 ? "comprehensive" : "detailed"
        } documentation available at ${api.link}. ${
          api.seoMetadata.hasCodeExamples
            ? "The documentation includes code examples"
            : "The documentation covers all endpoints"
        }${
          api.seoMetadata.languages && api.seoMetadata.languages.length > 0
            ? ` with examples in ${api.seoMetadata.languages
                .map((l) => l.language)
                .filter(Boolean)
                .join(", ")}.`
            : "."
        }`,
        category: "support",
        keywords: ["documentation", "docs", "guide"],
      });
    }

    // 7. OpenAPI FAQ
    if (api.openapiUrl) {
      items.push({
        question: `Does the ${api.name} API have an OpenAPI/Swagger specification?`,
        answer: `Yes, the ${api.name} API provides an OpenAPI specification at ${api.openapiUrl}. You can use this to auto-generate client SDKs, test the API interactively, or integrate with API development tools.`,
        category: "technical",
        keywords: ["openapi", "swagger", "specification"],
      });
    }

    // 8. Use Cases FAQ
    if (api.aiAnalysis?.useCases && api.aiAnalysis.useCases.length > 0) {
      const topUseCases = api.aiAnalysis.useCases
        .slice(0, 3)
        .map((u) => u.tag)
        .filter(Boolean)
        .join(", ");
      items.push({
        question: `What can I build with the ${api.name} API?`,
        answer: `The ${api.name} API is commonly used for: ${topUseCases}. ${
          api.aiAnalysis.summary || ""
        }`,
        category: "general",
        keywords: ["use cases", "examples", "applications"],
      });
    }

    // 9. Rate Limits FAQ (generic)
    items.push({
      question: `Are there rate limits for the ${api.name} API?`,
      answer: `Rate limits vary depending on your usage tier and authentication method. Please refer to the official ${api.name} API documentation for specific rate limit details and best practices for handling rate limit errors.`,
      category: "technical",
      keywords: ["rate limit", "throttling", "quota"],
    });

    // 10. Pricing FAQ (generic)
    items.push({
      question: `Is the ${api.name} API free to use?`,
      answer: `${
        api.auth === "No"
          ? `The ${api.name} API appears to be publicly accessible. However, please check the official documentation for any usage limits, terms of service, or commercial licensing requirements.`
          : `The ${api.name} API requires authentication, which typically indicates paid or tiered access. Please visit ${api.link} for detailed pricing information.`
      }`,
      category: "pricing",
      keywords: ["pricing", "cost", "free", "paid"],
    });

    return items;
  }

  private getAuthDetail(authType: string): string {
    const details: Record<string, string> = {
      apiKey:
        "You'll need to obtain an API key by registering on the provider's website. Include the key in the Authorization header as a Bearer token.",
      OAuth:
        "The API uses OAuth 2.0 authentication. You'll need to implement the OAuth flow to obtain an access token before making API requests.",
      "X-Mashape-Key":
        "This API requires a Mashape/RapidAPI key. Sign up on RapidAPI and include the key in the X-Mashape-Key header.",
      "User-Agent":
        "Make sure to include a descriptive User-Agent header in all your requests to identify your application.",
    };

    return (
      details[authType] ||
      "Please refer to the official documentation for authentication details."
    );
  }

  private groupByCategory(items: FAQItem[]): Record<string, FAQItem[]> {
    const grouped: Record<string, FAQItem[]> = {
      technical: [],
      security: [],
      support: [],
      pricing: [],
      general: [],
    };

    for (const item of items) {
      grouped[item.category].push(item);
    }

    return grouped;
  }

  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      technical: "Technical Questions",
      security: "Security & Privacy",
      support: "Support & Documentation",
      pricing: "Pricing & Plans",
      general: "General Questions",
    };

    return names[category] || category;
  }
}

// ==================== Export all generators ====================
export const contentGenerators = {
  [BlockType.GETTING_STARTED]: GettingStartedGenerator,
  [BlockType.CODE_EXAMPLES]: CodeExamplesGenerator,
  [BlockType.FAQ]: FAQGenerator,
  // More generators can be added here
};
