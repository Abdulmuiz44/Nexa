import { POST as initHandler } from '@/app/api/credits/initialize/route'

jest.mock('next-auth', () => ({
  getServerSession: jest.fn().mockResolvedValue({ user: { id: 'user1', email: 'u@example.com', name: 'User' } })
}))

const mockChain = () => {
  const chain: any = {
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: { id: 'rec1', credits_issued: 50 }, error: null }),
  }
  return chain
}

const chain = mockChain()

jest.mock('@/src/lib/supabaseServer', () => ({
  supabaseServer: {
    from: jest.fn().mockReturnValue(chain),
  }
}))

jest.mock('@/src/payments/flutterwave', () => ({
  FlutterwavePayment: jest.fn().mockImplementation(() => ({
    initializePayment: jest.fn().mockResolvedValue({ status: 'success', data: { link: 'https://pay', reference: 'ref123' } })
  }))
}))

jest.mock('@/lib/utils/credits', () => ({
  CREDIT_VALUE_USD: 0.1,
  MINIMUM_PURCHASE_CREDITS: 50,
}))

function req(body: any) {
  return new Request('http://test.local', { method: 'POST', body: JSON.stringify(body) })
}

describe('credits initialize', () => {
  it('rejects below minimum', async () => {
    const r = await initHandler(req({ amountUSD: 1 })) as Response
    expect(r.status).toBe(400)
  })

  it('returns link and stores tx_ref', async () => {
    const r = await initHandler(req({ amountUSD: 10 })) as Response
    expect(r.status).toBe(200)
    const data = await r.json()
    expect(data.link).toBe('https://pay')
    expect(data.reference).toBe('ref123')
    // ensure provider_tx_id updated
    expect(chain.update).toHaveBeenCalled()
  })
})