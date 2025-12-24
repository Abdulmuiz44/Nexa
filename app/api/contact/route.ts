import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting map (simple in-memory rate limiting)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const limit = rateLimitMap.get(ip);

    if (!limit || now > limit.resetTime) {
        rateLimitMap.set(ip, {
            count: 1,
            resetTime: now + 60000, // Reset after 1 minute
        });
        return true;
    }

    if (limit.count >= 5) {
        // Max 5 requests per minute
        return false;
    }

    limit.count++;
    return true;
}

function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mock Email Service Interface (to be replaced with Resend/SendGrid)
async function sendEmailNotification(to: string, subject: string, html: string) {
    // In production, this would call the actual email provider API
    // console.info(`[Email Service] Sending email to ${to}: ${subject}`);
    return true;
}

export async function POST(request: NextRequest) {
    try {
        // Get IP for rate limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

        // Check rate limit
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many requests. Please try again later.',
                },
                { status: 429 }
            );
        }

        const body = await request.json();
        const { name, email, subject, message } = body;

        // Validate required fields
        if (!name || !email || !message) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Name, email, and message are required fields.',
                },
                { status: 400 }
            );
        }

        // Validate email format
        if (!validateEmail(email)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Please provide a valid email address.',
                },
                { status: 400 }
            );
        }

        // Validate message length
        if (message.length < 10 || message.length > 2000) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Message must be between 10 and 2000 characters.',
                },
                { status: 400 }
            );
        }

        // Store contact submission in database
        const { error: dbError } = await supabase.from('contact_submissions').insert({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            subject: subject?.trim() || 'General Inquiry',
            message: message.trim(),
            ip_address: ip,
            created_at: new Date().toISOString(),
        });

        if (dbError) {
            // Log secure error server-side only
            // console.error('Database error:', dbError);
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to submit contact form. Please try again.',
                },
                { status: 500 }
            );
        }

        // Send notifications (async, don't block response)
        const adminEmail = process.env.ADMIN_EMAIL || 'support@nexa.ai'; // Default to support email

        await Promise.all([
            // Notify Admin
            sendEmailNotification(
                adminEmail,
                `New Contact Form: ${subject || 'Inquiry'}`,
                `<p>From: ${name} (${email})</p><p>${message}</p>`
            ),
            // Auto-reply to User
            sendEmailNotification(
                email,
                'We received your message - Nexa Support',
                `<p>Hi ${name},</p><p>Thanks for reaching out! We've received your message and will get back to you soon.</p>`
            )
        ]).catch(() => {
            // Silently fail email sending to not disrupt user experience, but ideally should be logged to monitoring
        });

        return NextResponse.json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you within 24 hours.',
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred. Please try again.',
            },
            { status: 500 }
        );
    }
}
