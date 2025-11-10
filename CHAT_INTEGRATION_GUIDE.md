# Nexa Chat Integration Guide

## Overview

The Nexa Chat system now has full integration with your connected social media accounts (Twitter/X and Reddit). The AI agent can directly access your connected accounts to perform actions, analyze content, and manage your social media presence through natural conversation.

## What's New

### Enhanced Chat Capabilities

The chat agent now has access to **11 powerful tools** that leverage your connected social media accounts:

1. **post_to_twitter** - Post content to your Twitter account
2. **post_to_reddit** - Post content to Reddit subreddits
3. **get_twitter_timeline** - View your Twitter home feed
4. **search_my_tweets** - Search through your tweet history
5. **engage_with_tweet** - Like, retweet, or reply to tweets
6. **analyze_tweet** - Get AI analysis of tweet characteristics
7. **generate_tweet** - Generate tweets in your authentic style
8. **analyze_my_tweet_patterns** - Learn your writing style and patterns
9. **get_twitter_analytics** - View performance metrics
10. **check_credit_balance** - Check your credit balance
11. **check_connection_status** - Verify account connections

### How It Works

When you chat with Nexa, the AI agent:

1. **Understands Your Request** - Interprets natural language commands
2. **Checks Connections** - Verifies your accounts are connected
3. **Executes Actions** - Performs the requested social media operations
4. **Provides Feedback** - Confirms actions with detailed results

## Usage Examples

### Posting to Twitter

```
You: "Post a tweet about our new product launch"
Nexa: ✅ Posted to Twitter!
      URL: https://twitter.com/yourhandle/status/123456789
      
You: "Tweet 'Excited to announce our new feature! 🚀'"
Nexa: ✅ Tweet posted successfully!
```

### Viewing Timeline

```
You: "Show me what's happening on my Twitter feed"
Nexa: Here are the latest tweets from your timeline:
      1. @user1 - "Great article about AI..."
      2. @user2 - "Just launched our new product..."
      ...
      
You: "What's trending in my feed?"
Nexa: [Shows recent tweets with engagement metrics]
```

### Searching Your History

```
You: "Find my tweets about AI from last month"
Nexa: Found 15 tweets about AI:
      1. [Date] "AI is transforming..." (20 likes, 5 retweets)
      2. [Date] "Machine learning insights..." (35 likes, 8 retweets)
      ...
```

### Auto-Engagement

```
You: "Like this tweet: https://twitter.com/user/status/123"
Nexa: ✅ Liked the tweet!

You: "Retweet that post about AI automation"
Nexa: ✅ Retweeted successfully!

You: "Reply to tweet 123 with 'Great insight!'"
Nexa: ✅ Reply posted!
```

### Tweet Analysis

```
You: "Analyze this tweet: 'Just launched our new AI product 🚀'"
Nexa: Tweet Analysis:
      - Sentiment: Positive
      - Topics: Product Launch, AI, Technology
      - Hooks: Announcement, Emoji engagement
      - Engagement Potential: 85/100
      - Style: Enthusiastic, Professional
      - Voice: Excited, Achievement-focused
```

### Content Generation

```
You: "Generate a tweet about our new feature"
Nexa: First, let me analyze your writing style...
      ✅ Based on your patterns, here's a tweet:
      "Excited to unveil our latest feature! This changes everything for teams
      looking to automate their workflow. Who's ready to try it? 🚀"
      
      Would you like me to post this or generate another option?
```

### Pattern Analysis

```
You: "Analyze my tweet patterns"
Nexa: Analyzing your historical tweets...
      
      Your Writing Style:
      - Common Hooks: Announcements, questions, statistics
      - Voice: Professional yet approachable
      - Structure: Short, punchy sentences
      - Best Posting Time: 9-11 AM EST
      - Best Day: Tuesday
      - Top Themes: AI, automation, productivity
      
      Engagement Insights:
      - Tweets with questions get 2x more engagement
      - Posts with emojis perform 30% better
      - Optimal length: 180-220 characters
```

### Reddit Posting

```
You: "Post to r/webdev about our new tool"
Nexa: What title would you like for the post?

You: "New automation tool for web developers"
Nexa: ✅ Posted to r/webdev!
      URL: https://reddit.com/r/webdev/...
```

### Connection Management

```
You: "Are my accounts connected?"
Nexa: Connection Status:
      - Twitter: ✅ Connected
      - Reddit: ❌ Not connected
      
      To connect Reddit, go to dashboard/connections
```

## Agent Modes

Nexa operates in three modes that affect how it handles requests:

### 1. Manual Mode (Default)
- Executes actions only when explicitly requested
- Waits for user approval before posting
- Provides guidance and suggestions
- Best for: Careful content management

**Example:**
```
You: "Help me with Twitter"
Nexa: I can help you:
      1. Post tweets
      2. View your timeline
      3. Analyze your patterns
      4. Engage with content
      
      What would you like to do?
```

### 2. Review Mode
- Proposes actions for approval
- Shows preview before executing
- Explains reasoning behind suggestions
- Best for: Collaborative content creation

**Example:**
```
You: "Create a tweet about our launch"
Nexa: I'll generate a tweet based on your style:
      
      "🚀 Big news! We're launching our new AI-powered platform today.
      This is going to revolutionize how teams work together. Try it free!"
      
      This matches your enthusiastic, announcement-focused style.
      Should I post this? (Yes/No/Edit)
```

### 3. Autonomous Mode
- Executes actions immediately
- Takes initiative on optimizations
- Proactively suggests improvements
- Best for: Fast-paced management

**Example:**
```
You: "Post about the launch"
Nexa: ✅ Posted to Twitter!
      "🚀 Excited to announce our new AI platform! Revolutionary features
      for modern teams. Free trial available now!"
      
      URL: https://twitter.com/...
      
      I also noticed your engagement is highest at 10 AM.
      Would you like me to schedule future posts for that time?
```

## Connection Requirements

### Before Using Chat Integration

1. **Connect Your Accounts**
   - Go to `/dashboard/connections`
   - Click "Connect Twitter" or "Connect Reddit"
   - Authorize through Composio OAuth
   - Verify "Active" status appears

2. **Verify COMPOSIO_API_KEY**
   - Ensure environment variable is set
   - Required for all social media actions
   - Available in Vercel dashboard

3. **Check Credit Balance**
   - Each social action costs 1 credit
   - Ask Nexa: "What's my credit balance?"
   - Top up if needed

### Connection Status

The agent automatically checks if accounts are connected before attempting actions. If not connected:

```
You: "Post a tweet"
Nexa: ⚠️ Your Twitter account is not connected yet.
      
      To connect:
      1. Go to dashboard/connections
      2. Click "Connect Twitter"
      3. Authorize through Composio
      4. Come back and try again!
```

## Credit System

### Credit Usage

- **Posting:** 1 credit per post (Twitter or Reddit)
- **Engagement:** 1 credit per action (like, retweet, reply)
- **Analytics:** Free
- **Pattern Analysis:** Free
- **Content Generation:** Free
- **Timeline Viewing:** Free
- **Searching:** Free

### Checking Balance

```
You: "How many credits do I have?"
Nexa: Your current balance: 150 credits
      
      Recent usage:
      - 5 Twitter posts (5 credits)
      - 3 Retweets (3 credits)
      - 2 Replies (2 credits)
```

## Advanced Workflows

### 1. Content Strategy Development

```
You: "Help me improve my Twitter strategy"
Nexa: Let me analyze your account...
      
      ✅ Pattern Analysis Complete:
      - You post mostly about AI and automation
      - Best engagement: Questions and statistics
      - Optimal posting time: 9-11 AM Tuesday/Wednesday
      
      Recommendations:
      1. Post more questions (2x engagement)
      2. Use more visual content
      3. Engage with comments within 1 hour
      4. Tweet 3-4 times per day
      
      Would you like me to generate some tweet ideas?
```

### 2. Engagement Campaign

```
You: "Find and engage with tweets about AI automation"
Nexa: Searching your timeline for AI automation content...
      
      Found 8 relevant tweets:
      1. @techguru - "AI is changing..." (High relevance: 92/100)
      2. @developer - "Automation tips..." (High relevance: 88/100)
      
      Would you like me to:
      - Like all high-relevance tweets?
      - Reply with thoughtful comments?
      - Retweet the top 3?
```

### 3. Content Series

```
You: "Create a 5-tweet series about our new feature"
Nexa: Analyzing your style and creating a thread...
      
      Tweet 1/5: "🚀 Big announcement coming! Over the next few tweets, I'll
      share something that will change how you think about [feature]..."
      
      Tweet 2/5: "First, the problem: Teams waste 10+ hours/week on manual
      tasks. We've all been there... 😓"
      
      [Shows all 5 tweets]
      
      Ready to post? I'll publish them as a thread.
```

### 4. Performance Review

```
You: "How are my tweets performing this week?"
Nexa: Analyzing this week's performance...
      
      📊 Week Overview (Last 7 days):
      - Total Tweets: 12
      - Total Impressions: 15,234
      - Total Engagement: 1,245
      - Engagement Rate: 8.2% (Above average!)
      
      Top Performer:
      "Just launched our new AI feature! 🚀" (Tweet ID: 123)
      - 3,456 impressions
      - 342 engagements
      - 45 retweets
      
      Insights:
      - Tweets with emojis got 40% more engagement
      - Tuesday posts performed best
      - Question-format tweets got 2.5x more replies
```

## Technical Details

### API Integration

The chat system integrates with:

1. **ComposioIntegrationService** - Handles all Composio API calls
2. **OpenAI GPT-4** - Powers the AI agent
3. **Supabase** - Stores conversations and connections
4. **Next.js API Routes** - Backend infrastructure

### Tool Execution Flow

```
User Message → OpenAI Analysis → Tool Selection → Parameter Extraction
     ↓
Credit Check → Action Execution → Result Processing → User Response
```

### Error Handling

The system handles various error scenarios:

- **No Connection:** Prompts user to connect account
- **Insufficient Credits:** Requests top-up
- **API Failures:** Provides clear error messages
- **Rate Limiting:** Implements automatic backoff
- **Invalid Parameters:** Requests clarification

## Best Practices

### For Users

1. **Connect Accounts First** - Ensure Twitter/Reddit are connected
2. **Check Credits** - Maintain adequate credit balance
3. **Be Specific** - Clear requests get better results
4. **Review Generated Content** - Always review before posting
5. **Use Pattern Analysis** - Let Nexa learn your style
6. **Monitor Analytics** - Track performance regularly

### For Admins

1. **Set COMPOSIO_API_KEY** - Required in environment
2. **Configure OPENAI_API_KEY** - Powers AI features
3. **Monitor Credit Usage** - Track user consumption
4. **Review Logs** - Check for errors or issues
5. **Update Prompts** - Optimize system prompts as needed

## Troubleshooting

### "Account not connected"
**Solution:** Go to `/dashboard/connections` and connect your account

### "Insufficient credits"
**Solution:** Top up your credit balance in the dashboard

### "Failed to post"
**Solution:** 
- Verify account connection is Active
- Check COMPOSIO_API_KEY is set
- Ensure content meets platform requirements (e.g., 280 char limit for Twitter)

### "Can't generate content"
**Solution:** 
- Run "Analyze my tweet patterns" first
- Provide more context in your request
- Ensure you have at least 10 historical tweets

### "Tool execution timeout"
**Solution:**
- Check your internet connection
- Try again in a few moments
- Contact support if issue persists

## Future Enhancements

Coming soon:

- [ ] Instagram integration
- [ ] LinkedIn integration
- [ ] Automated A/B testing
- [ ] Sentiment monitoring
- [ ] Competitor analysis
- [ ] Trend prediction
- [ ] Multi-platform cross-posting
- [ ] Advanced scheduling with AI optimization
- [ ] Team collaboration features
- [ ] Custom automation workflows

## Support

For issues or questions:

1. Check this guide first
2. Review error messages in chat
3. Verify connections in dashboard
4. Check credit balance
5. Contact support if needed

---

**Ready to start?** Go to `/chat` and try: "Check my connection status" or "Help me get started with Twitter automation"
