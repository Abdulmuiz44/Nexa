import { POST as webhookHandler } from '@/app/api/payments/webhook/route'

process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH = 'sh'

const chain: any = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'rec1', credits_issued: 50 }, error: null }),
  update: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
}

jest.mock('@/src/lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnValue(chain),
    rpc: jest.fn().mockResolvedValue({}),
  }
}))

jest.mock('@/src/payments/flutterwave', () => ({
  FlutterwavePayment: jest.fn().mockImplementation(() => ({
    verifyPayment: jest.fn().mockResolvedValue({ status: 'success' })
  }))
}))

jest.mock('@/lib/utils/credits', () => ({
  addCredits: jest.fn().mockResolvedValue(150),
}))

function req(body: any) {
  return new Request('http://test.local/api/payments/webhook', {
    method: 'POST',
    headers: { 'verif-hash': 'sh', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('payments webhook', () => {
  it('credits wallet for credits plan', async () => {
    const body = { status: 'successful', tx_ref: 'nexa_user1_credits_123', id: 'prov_tx_1', amount: 5, currency: 'USD' }
    const r = await webhookHandler(req(body)) as Response
    expect(r.status).toBe(200)
  })
})