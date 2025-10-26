import { type NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { creditService } from "@/src/services/creditService";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const isAdmin = await creditService.isUserAdmin(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query for transactions
    let query = creditService.adapter.supabase
      .from('credit_transactions')
      .select(`
        *,
        users!inner(email, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (type) {
      query = query.eq('tx_type', type);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching admin transactions:', error);
      return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }

    const formattedTransactions = transactions?.map(tx => ({
      id: tx.id,
      user_id: tx.user_id,
      user_email: (tx.users as any).email,
      user_name: (tx.users as any).name,
      tx_type: tx.tx_type,
      credits: tx.credits,
      description: tx.description,
      reference_id: tx.reference_id,
      operation_type: tx.operation_type,
      operation_id: tx.operation_id,
      metadata: tx.metadata,
      created_at: tx.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedTransactions,
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error("Error fetching admin transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
