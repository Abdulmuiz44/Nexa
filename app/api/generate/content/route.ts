import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { supabaseServer } from '@/src/lib/supabaseServer';
import { ContentGenerator, UserProfile } from '@/src/services/contentGenerator';
import { ApprovalWorkflowService } from '@/src/lib/services/approvalWorkflowService';

const contentGenerator = new ContentGenerator();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      platform,
      topic,
      count = 1,
      scheduledTime,
      createDraft = false,
      autoApprove = false,
      campaignId
    } = await req.json();

    if (!platform || !['twitter', 'reddit'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform. Must be twitter or reddit.' }, { status: 400 });
    }

    // Get user profile from database
    const { data: user, error: userError } = await supabaseServer
      .from('users')
      .select('onboarding_data, email')
      .eq('id', session.user.id)
      .single();

    if (userError || !user?.onboarding_data) {
      return NextResponse.json({ error: 'User profile not found. Please complete onboarding.' }, { status: 400 });
    }

    const onboarding = user.onboarding_data;
    const userProfile: UserProfile = {
      businessName: onboarding.business_name || onboarding.company_name || 'My Business',
      businessType: onboarding.business_type || 'company',
      websiteUrl: onboarding.website_url,
      promotionGoals: onboarding.promotion_goals || [],
      postingFrequency: onboarding.posting_frequency || 'daily',
      brandTone: onboarding.brand_tone || 'professional',
      sampleCaption: onboarding.sample_caption,
    };

    const contents: any[] = [];
    const drafts: any[] = [];

    if (count > 1) {
      // Generate multiple posts
      const contentSeries = await contentGenerator.generateContentSeries({
        platform,
        topic,
        campaignId,
        userProfile,
        count,
      });

      for (const generatedContent of contentSeries) {
        const finalContent = `${generatedContent.content}\n\n${generatedContent.callToAction || ''}`.trim();

        if (createDraft) {
          // Create draft
          const draft = await ApprovalWorkflowService.createDraft({
            user_id: session.user.id,
            platform,
            content: finalContent,
            topic,
            metadata: {
              generated_content: generatedContent,
              campaign_id: campaignId,
              scheduled_time: scheduledTime,
            },
          });
          drafts.push(draft);

          // Auto-approve if requested
          if (autoApprove) {
            const approvedDraft = await ApprovalWorkflowService.approveDraft(draft.id!, session.user.id);
            drafts[drafts.length - 1] = approvedDraft;

            // Publish immediately
            const publishResult = await ApprovalWorkflowService.publishApprovedContent(draft.id!, session.user.id);
            contents.push({
              ...generatedContent,
              content: finalContent,
              draft_id: draft.id,
              post_id: publishResult.postId,
              published: true,
            });
          } else {
            contents.push({
              ...generatedContent,
              content: finalContent,
              draft_id: draft.id,
              status: 'draft',
            });
          }
        } else {
          contents.push({
            ...generatedContent,
            content: finalContent,
          });
        }
      }

      return NextResponse.json({
        success: true,
        contents,
        drafts: drafts.length > 0 ? drafts : undefined,
        count: contents.length,
      });
    } else {
      // Generate single post
      const generatedContent = await contentGenerator.generateContent({
        platform,
        topic,
        campaignId,
        userProfile,
      });

      const finalContent = `${generatedContent.content}\n\n${generatedContent.callToAction || ''}`.trim();

      let result: any = {
        ...generatedContent,
        content: finalContent,
      };

      if (createDraft) {
        // Create draft
        const draft = await ApprovalWorkflowService.createDraft({
          user_id: session.user.id,
          platform,
          content: finalContent,
          topic,
          metadata: {
            generated_content: generatedContent,
            campaign_id: campaignId,
            scheduled_time: scheduledTime,
          },
        });

        // Auto-approve if requested
        if (autoApprove) {
          const approvedDraft = await ApprovalWorkflowService.approveDraft(draft.id!, session.user.id);
          const publishResult = await ApprovalWorkflowService.publishApprovedContent(draft.id!, session.user.id);
          result = {
            ...result,
            draft_id: draft.id,
            post_id: publishResult.postId,
            published: true,
          };
        } else {
          result = {
            ...result,
            draft_id: draft.id,
            status: 'draft',
          };
        }

        return NextResponse.json({
          success: true,
          post: result,
          draft: draft,
        });
      }

      return NextResponse.json({
        success: true,
        post: result,
        scheduled: !!scheduledTime,
      });
    }
  } catch (error: unknown) {
    console.error('Content generation error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to generate content'
    }, { status: 500 });
  }
}
