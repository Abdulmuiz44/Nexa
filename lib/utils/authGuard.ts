import { getServerSession } from 'next-auth'
import { authOptions } from '@/src/auth/auth'

export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }

  return session
}

export async function requireAdmin() {
  const session = await requireAuth()

  // Check if user is admin (this would need to be implemented based on your user model)
  // For now, just return the session
  return session
}
