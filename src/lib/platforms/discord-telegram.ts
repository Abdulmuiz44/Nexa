// NEXA - Discord & Telegram Integration (Free APIs)
// Copy-paste this for Discord and Telegram automation

interface DiscordMessage {
  content: string;
  embeds?: any[];
  files?: string[];
}

interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

class DiscordTelegramIntegration {
  private discordWebhookUrl: string;
  private telegramBotToken: string;
  private telegramChatIds: string[];

  constructor() {
    this.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
    this.telegramBotToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.telegramChatIds = (process.env.TELEGRAM_CHAT_IDS || '').split(',').filter(Boolean);
    
    if (!this.discordWebhookUrl) {
      console.warn('Discord webhook URL not found. Discord integration disabled.');
    }
    if (!this.telegramBotToken) {
      console.warn('Telegram bot token not found. Telegram integration disabled.');
    }
  }

  // Post to Discord via webhook
  async postToDiscord(content: string, tool: any): Promise<boolean> {
    if (!this.discordWebhookUrl) {
      console.warn('Discord webhook not configured');
      return false;
    }

    try {
      const embed = {
        title: `🚀 ${tool.name}`,
        description: content,
        color: 0x00ff00, // Green color
        fields: [
          {
            name: "🔗 Link",
            value: tool.url,
            inline: true
          },
          {
            name: "📂 Category", 
            value: tool.category || 'AI Tool',
            inline: true
          }
        ],
        footer: {
          text: "Promoted by Nexa AI Agent"
        },
        timestamp: new Date().toISOString()
      };

      const message = {
        content: `**New AI Tool Alert!** 🤖`,
        embeds: [embed]
      };

      const response = await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`Discord webhook error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to post to Discord:', error);
      return false;
    }
  }

  // Post to Telegram
  async postToTelegram(content: string, tool: any): Promise<boolean> {
    if (!this.telegramBotToken || this.telegramChatIds.length === 0) {
      console.warn('Telegram not properly configured');
      return false;
    }

    try {
      const message = this.formatTelegramMessage(content, tool);
      let successCount = 0;

      for (const chatId of this.telegramChatIds) {
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
                disable_web_page_preview: false
              })
            }
          );

          if (response.ok) {
            successCount++;
          }
        } catch (error) {
          console.error(`Failed to send to Telegram chat ${chatId}:`, error);
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error('Failed to post to Telegram:', error);
      return false;
    }
  }

  // Generate Discord-optimized content
  generateDiscordContent(tool: any): string {
    const templates = [
      `🎯 **${tool.name}** is revolutionizing ${tool.category?.toLowerCase() || 'AI tools'}!

${tool.description}

✨ **Key Features:**
${tool.features?.slice(0, 4).map((f: string) => `• ${f}`).join('\n') || '• Advanced AI capabilities\n• User-friendly interface\n• Powerful automation\n• Great performance'}

🔗 **Try it now:** ${tool.url}

What do you think? Drop your thoughts in the comments! 👇`,

      `🚀 **Community Alert:** New AI tool discovery!

**${tool.name}** - ${tool.description}

🔥 **Why it's awesome:**
${tool.features?.slice(0, 3).map((f: string) => `▫️ ${f}`).join('\n') || '▫️ Innovative approach\n▫️ Easy to use\n▫️ Great results'}

💡 **Perfect for:** ${this.getTargetAudience(tool.category)}

🌐 **Check it out:** ${tool.url}

Anyone tried this yet? Share your experience! 💬`,

      `⚡ **Hot Pick:** ${tool.name}

${tool.description}

🎯 **Use Cases:**
${this.getUseCases(tool.category)}

⭐ **Highlights:**
${tool.features?.slice(0, 3).map((f: string) => `→ ${f}`).join('\n') || '→ Smart automation\n→ Reliable performance\n→ User-friendly'}

🔗 ${tool.url}

Worth checking out! What are your favorite AI tools? 🤖`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Generate Telegram-optimized content  
  generateTelegramContent(tool: any): string {
    const templates = [
      `🚀 <b>${tool.name}</b> - Game Changer Alert!

${tool.description}

<b>🎯 Key Benefits:</b>
${tool.features?.slice(0, 4).map((f: string) => `• ${f}`).join('\n') || '• Advanced AI capabilities\n• Easy to use\n• Time-saving\n• Great results'}

<b>🔗 Link:</b> <a href="${tool.url}">${tool.name}</a>

<b>💬 What do you think?</b> Reply with your thoughts!

#AI #Tools #Innovation #${tool.category?.replace(/\s+/g, '') || 'AITool'}`,

      `🎯 <b>New Discovery:</b> ${tool.name}

<i>${tool.description}</i>

<b>✨ Perfect for:</b>
${this.getTargetAudience(tool.category)}

<b>🔥 Features:</b>
${tool.features?.slice(0, 3).map((f: string) => `▪️ ${f}`).join('\n') || '▪️ Smart automation\n▪️ User-friendly\n▪️ Powerful features'}

<b>🌐 Try it:</b> <a href="${tool.url}">Click here</a>

Have you tried similar tools? Share your experience! 👇

#${tool.category?.replace(/\s+/g, '') || 'AITool'} #Automation #Productivity`,

      `⚡ <b>Tool Spotlight:</b> ${tool.name}

${tool.description}

<b>🎪 Use Cases:</b>
${this.getUseCases(tool.category)}

<b>⭐ Why it stands out:</b>
${tool.features?.slice(0, 3).map((f: string) => `» ${f}`).join('\n') || '» Innovative approach\n» Great UX\n» Solid performance'}

<b>🔗 Access:</b> <a href="${tool.url}">${tool.name}</a>

What's your go-to AI tool? Let's discuss! 💭`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Format message for Telegram with HTML
  private formatTelegramMessage(content: string, tool: any): string {
    // If content already contains HTML formatting, use it
    if (content.includes('<b>') || content.includes('<i>')) {
      return content;
    }

    // Otherwise, format the content
    return `<b>🚀 ${tool.name}</b>

<i>${tool.description}</i>

<b>✨ Features:</b>
${tool.features?.slice(0, 4).map((f: string) => `• ${f}`).join('\n') || '• Advanced capabilities\n• User-friendly\n• Great performance\n• Easy setup'}

<b>🔗 Link:</b> <a href="${tool.url}">${tool.name}</a>

${content}

<i>Shared by Nexa AI Agent 🤖</i>`;
  }

  // Get target audience based on tool category
  private getTargetAudience(category?: string): string {
    const audiences: { [key: string]: string } = {
      'Trading AI': 'Traders, investors, financial analysts',
      'AI Tool': 'Developers, entrepreneurs, tech enthusiasts', 
      'Productivity': 'Remote workers, freelancers, teams',
      'Analytics': 'Data analysts, marketers, business owners',
      'Content': 'Content creators, marketers, writers',
      'Development': 'Developers, DevOps engineers, tech teams'
    };

    return audiences[category || 'AI Tool'] || 'AI enthusiasts, developers, entrepreneurs';
  }

  // Get use cases based on tool category
  private getUseCases(category?: string): string {
    const useCases: { [key: string]: string } = {
      'Trading AI': '• Trading analysis\n• Risk assessment\n• Performance tracking\n• Pattern recognition',
      'AI Tool': '• Process automation\n• Data analysis\n• Content generation\n• Workflow optimization',
      'Productivity': '• Task management\n• Time tracking\n• Team collaboration\n• Project planning',
      'Analytics': '• Data visualization\n• Trend analysis\n• Performance monitoring\n• Report generation',
      'Content': '• Content creation\n• Social media management\n• SEO optimization\n• Brand building',
      'Development': '• Code automation\n• Testing\n• Deployment\n• Performance monitoring'
    };

    return useCases[category || 'AI Tool'] || '• General automation\n• Efficiency improvement\n• Problem solving\n• Innovation';
  }

  // Create Discord server invitation (for community building)
  async createDiscordInvite(): Promise<string | null> {
    // This would require Discord bot permissions
    // For webhook-only setup, provide manual invite instructions
    return null;
  }

  // Get Telegram channel/group info
  async getTelegramChannelInfo(): Promise<any> {
    if (!this.telegramBotToken) return null;

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.telegramBotToken}/getMe`
      );

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Failed to get Telegram bot info:', error);
      return null;
    }
  }

  // Schedule messages for optimal times
  async scheduleMessage(
    platform: 'discord' | 'telegram',
    content: string,
    tool: any,
    scheduledFor: Date
  ): Promise<boolean> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { error } = await supabase
        .from('posts')
        .insert({
          platform: platform,
          content: content,
          scheduled_for: scheduledFor.toISOString(),
          status: 'scheduled'
        });

      return !error;
    } catch (error) {
      console.error('Failed to schedule message:', error);
      return false;
    }
  }

  // Get optimal posting times for community platforms
  getOptimalPostingTimes(): string[] {
    // Based on community platform analytics
    return [
      '10:00', '11:00', '12:00', // Late morning
      '14:00', '15:00', '16:00', // Afternoon  
      '18:00', '19:00', '20:00'  // Evening (best for communities)
    ];
  }

  // Check if integrations are configured
  isDiscordConfigured(): boolean {
    return !!this.discordWebhookUrl;
  }

  isTelegramConfigured(): boolean {
    return !!(this.telegramBotToken && this.telegramChatIds.length > 0);
  }

  isConfigured(): boolean {
    return this.isDiscordConfigured() || this.isTelegramConfigured();
  }
}

export const discordTelegramIntegration = new DiscordTelegramIntegration();
export default DiscordTelegramIntegration;