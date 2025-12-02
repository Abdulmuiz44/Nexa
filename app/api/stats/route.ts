import { NextResponse } from 'next/server';
import { getRealStats } from '@/lib/real-data';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
    try {
        const stats = await getRealStats();

        return NextResponse.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch statistics',
                message: error.message,
            },
            { status: 500 }
        );
    }
}
