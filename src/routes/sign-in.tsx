import { SignIn } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in')({
  ssr: false,
  component: SignInPage,
  head: () => ({
    meta: [{ title: 'OmniBid | Sign In' }],
  }),
})

function SignInPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 sm:py-20 flex justify-center">
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/proposals" />
    </div>
  )
}
