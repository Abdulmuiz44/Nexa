import { GET as verifyHandler } from '@/app/api/credits/verify/route'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'user1' } })
}))

const chain: any = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'rec1', credits_issued: 75 }, error: null }),
  update: jest.fn().mockReturnThis(),
}

jest.mock('@/src/lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnValue(chain),
  }
}))

jest.mock('@/src/payments/flutterwave', () => ({
  FlutterwavePayment: jest.fn().mockImplementation(() => ({
    verifyPayment: jest.fn().mockResolvedValue({ status: 'success' })
  }))
}))

jest.mock('@/lib/utils/credits', () => ({
  addCredits: jest.fn().mockResolvedValue(100),
  getCreditBalance: jest.fn().mockResolvedValue(175),
}))

function req(url: string) {
  return new Request(url)
}

describe('credits verify', () => {
  it('returns credited and balance', async () => {
    const r = await verifyHandler(req('http://test.local/api/credits/verify?transaction_id=tx1&tx_ref=ref123')) as Response
    expect(r.status).toBe(200)
    const data = await r.json()
    expect(data.success).toBe(true)
    expect(typeof data.credited).toBe('number')
    expect(typeof data.balance).toBe('number')
  })
})