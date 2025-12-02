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
            console.error('Database error:', dbError);
            // Don't expose database errors to client
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to submit contact form. Please try again.',
                },
                { status: 500 }
            );
        }

        // TODO: Send email notification to admin
        // TODO: Send auto-response email to user

        return NextResponse.json({
            success: true,
            message: 'Thank you for contacting us! We will get back to you within 24 hours.',
        });
    } catch (error: any) {
        console.error('Contact form error:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'An unexpected error occurred. Please try again.',
            },
            { status: 500 }
        );
    }
}
