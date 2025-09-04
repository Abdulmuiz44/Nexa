// NEXA - Enhanced Reddit Integration (Free API)
// Copy-paste this for Reddit community automation

interface RedditPost {
  subreddit: string;
  title: string;
  text?: string;
  url?: string;
  kind: 'link' | 'self';
}

interface RedditMetrics {
  upvotes: number;
  downvotes: number;
  comments: number;
  score: number;
  upvoteRatio: number;
}

class EnhancedRedditIntegration {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private baseUrl = 'https://oauth.reddit.com';

  constructor() {
    this.clientId = process.env.REDDIT_CLIENT_ID || '';
    this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
    
    if (!this.clientId || !this.clientSecret) {
      console.warn('Reddit credentials not found. Reddit integration disabled.');
    }
  }

  // Get access token
  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch('https://www.reddit.com/api/v1/access_token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Nexa-AI-Agent/1.0'
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Reddit auth error: ${response.status}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer
      
      return this.accessToken;
    } catch (error) {
      console.error('Failed to get Reddit access token:', error);
      return null;
    }
  }

  // Post to Reddit
  async post(subreddit: string, title: string, content: string, isLink = false): Promise<string | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const postData = new URLSearchParams({
        api_type: 'json',
        sr: subreddit,
        title: title,
        kind: isLink ? 'link' : 'self'
      });

      if (isLink) {
        postData.append('url', content);
      } else {
        postData.append('text', content);
      }

      const response = await fetch(`${this.baseUrl}/api/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Nexa-AI-Agent/1.0'
        },
        body: postData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Reddit API error: ${response.status} - ${error}`);
      }

      const result = await response.json();
      return result.json?.data?.name || null;
    } catch (error) {
      console.error('Failed to post to Reddit:', error);
      return null;
    }
  }

  // Get relevant subreddits for AI tools
  async getRelevantSubreddits(tool: any): Promise<string[]> {
    const toolCategory = tool.category?.toLowerCase() || '';
    const toolKeywords = tool.keywords || [];

    // Subreddits organized by category and size
    const subredditCategories = {
      ai_general: [
        'artificial', 'MachineLearning', 'ChatGPT', 'OpenAI',
        'singularity', 'ArtificialIntelligence', 'LLMs'
      ],
      trading: [
        'trading', 'stocks', 'investing', 'SecurityAnalysis',
        'ValueInvesting', 'StockMarket', 'algotrading'
      ],
      tech_tools: [
        'SaaS', 'startups', 'Entrepreneur', 'productivity',
        'InternetIsBeautiful', 'webdev', 'programming'
      ],
      general_tech: [
        'technology', 'gadgets', 'software', 'apps',
        'coding', 'Programming', 'webdev'
      ]
    };

    let relevantSubs: string[] = [];

    // Add category-specific subreddits
    if (toolCategory.includes('trading') || toolCategory.includes('finance')) {
      relevantSubs.push(...subredditCategories.trading);
    }
    
    if (toolCategory.includes('ai') || toolKeywords.some(k => k.toLowerCase().includes('ai'))) {
      relevantSubs.push(...subredditCategories.ai_general);
    }

    // Add general tech subreddits
    relevantSubs.push(...subredditCategories.tech_tools);
    relevantSubs.push(...subredditCategories.general_tech);

    // Remove duplicates and return top 10
    return [...new Set(relevantSubs)].slice(0, 10);
  }

  // Check subreddit rules and posting guidelines
  async checkSubredditRules(subreddit: string): Promise<{ canPost: boolean; rules: string[] }> {
    try {
      const token = await this.getAccessToken();
      if (!token) return { canPost: false, rules: [] };

      const response = await fetch(`${this.baseUrl}/r/${subreddit}/about/rules`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Nexa-AI-Agent/1.0'
        }
      });

      if (!response.ok) {
        return { canPost: false, rules: ['Unable to fetch rules'] };
      }

      const data = await response.json();
      const rules = data.rules?.map((rule: any) => rule.short_name || rule.description) || [];
      
      // Simple rule checking
      const promotionKeywords = ['promotion', 'advertising', 'spam', 'self-promotion'];
      const hasPromotionRestrictions = rules.some((rule: string) =>
        promotionKeywords.some(keyword => rule.toLowerCase().includes(keyword))
      );

      return {
        canPost: !hasPromotionRestrictions,
        rules: rules
      };
    } catch (error) {
      console.error('Failed to check subreddit rules:', error);
      return { canPost: false, rules: ['Error checking rules'] };
    }
  }

  // Get optimal posting times for Reddit
  async getOptimalPostingTimes(): Promise<string[]> {
    // Based on Reddit analytics research
    return [
      '06:00', '07:00', '08:00', // Early morning
      '11:00', '12:00', '13:00', // Lunch time
      '19:00', '20:00', '21:00'  // Evening
    ];
  }

  // Get post metrics
  async getPostMetrics(postId: string): Promise<RedditMetrics | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${this.baseUrl}/api/info?id=${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Nexa-AI-Agent/1.0'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      const post = data.data?.children?.[0]?.data;

      if (!post) return null;

      return {
        upvotes: post.ups || 0,
        downvotes: post.downs || 0,
        comments: post.num_comments || 0,
        score: post.score || 0,
        upvoteRatio: post.upvote_ratio || 0
      };
    } catch (error) {
      console.error('Failed to get post metrics:', error);
      return null;
    }
  }

  // Generate Reddit-optimized content
  generateRedditContent(tool: any, subreddit: string): { title: string; content: string } {
    const contentTemplates = {
      // Problem-solution format
      problem_solution: {
        title: `How I solved ${this.getCommonProblem(tool.category)} with ${tool.name}`,
        content: `I was struggling with ${this.getCommonProblem(tool.category)} for months. Then I discovered ${tool.name}.

**What it does:**
${tool.description}

**Key features that helped me:**
${tool.features?.map((f: string) => `• ${f}`).join('\n') || '• Smart automation\n• Easy to use\n• Great results'}

**Results so far:**
${this.getExpectedResults(tool.category)}

**Link:** ${tool.url}

Happy to answer questions about my experience with ${tool.name}!`
      },

      // Tool showcase format
      tool_showcase: {
        title: `${tool.name} - ${tool.description?.split('.')[0] || 'Interesting AI tool I found'}`,
        content: `Found this interesting tool that might be useful for the community.

**${tool.name}** - ${tool.description}

**What makes it unique:**
${tool.features?.slice(0, 3).map((f: string) => `• ${f}`).join('\n') || '• Innovative approach\n• User-friendly\n• Powerful features'}

**Use cases:**
${this.getUseCases(tool.category)}

**Check it out:** ${tool.url}

What do you think? Anyone tried something similar?`
      },

      // Question format
      question_format: {
        title: `What's your experience with ${tool.category?.toLowerCase() || 'AI'} tools like ${tool.name}?`,
        content: `I've been exploring different ${tool.category?.toLowerCase() || 'AI'} solutions and came across ${tool.name}.

**What it does:**
${tool.description}

**Key features:**
${tool.features?.slice(0, 4).map((f: string) => `• ${f}`).join('\n') || '• Advanced capabilities\n• Easy setup\n• Good performance\n• Regular updates'}

**Link:** ${tool.url}

Has anyone here tried ${tool.name} or similar tools? Would love to hear about your experiences and alternatives you'd recommend!`
      }
    };

    // Choose template based on subreddit characteristics
    let template = contentTemplates.tool_showcase;
    
    if (subreddit.toLowerCase().includes('help') || subreddit.toLowerCase().includes('advice')) {
      template = contentTemplates.question_format;
    } else if (subreddit.toLowerCase().includes('story') || subreddit.toLowerCase().includes('share')) {
      template = contentTemplates.problem_solution;
    }

    return template;
  }

  private getCommonProblem(category?: string): string {
    const problems: { [key: string]: string } = {
      'Trading AI': 'analyzing my trading performance and identifying patterns',
      'AI Tool': 'automating repetitive tasks efficiently',
      'Productivity': 'managing my workflow and staying productive',
      'Analytics': 'getting actionable insights from my data'
    };

    return problems[category || 'AI Tool'] || 'managing complex workflows efficiently';
  }

  private getExpectedResults(category?: string): string {
    const results: { [key: string]: string } = {
      'Trading AI': '• 25% better trade analysis\n• Faster pattern recognition\n• More confident decisions',
      'AI Tool': '• 40% time savings\n• Better automation\n• Improved accuracy',
      'Productivity': '• 30% productivity increase\n• Better organization\n• Less manual work',
      'Analytics': '• Clearer insights\n• Better decisions\n• Time saved on analysis'
    };

    return results[category || 'AI Tool'] || '• Significant time savings\n• Better results\n• Improved efficiency';
  }

  private getUseCases(category?: string): string {
    const useCases: { [key: string]: string } = {
      'Trading AI': '• Trading performance analysis\n• Risk assessment\n• Pattern recognition\n• Portfolio optimization',
      'AI Tool': '• Process automation\n• Data analysis\n• Content generation\n• Workflow optimization',
      'Productivity': '• Task management\n• Time tracking\n• Goal setting\n• Performance monitoring',
      'Analytics': '• Data visualization\n• Trend analysis\n• Report generation\n• Performance tracking'
    };

    return useCases[category || 'AI Tool'] || '• General automation\n• Data processing\n• Efficiency improvement\n• Workflow enhancement';
  }

  // Check if integration is configured
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}

export const redditIntegration = new EnhancedRedditIntegration();
export default EnhancedRedditIntegration;