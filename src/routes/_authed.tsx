import { auth } from '@clerk/tanstack-react-start/server'
import { createServerFn } from '@tanstack/react-start'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

const fetchClerkAuth = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth()
  return { userId: userId ?? null }
})

export const Route = createFileRoute('/_authed')({
  ssr: false,
  beforeLoad: async () => {
    const { userId } = await fetchClerkAuth()
    if (!userId) {
      throw redirect({ to: '/sign-in' })
    }
  },
  component: () => <Outlet />,
})
