import { SignUp } from '@clerk/tanstack-react-start'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-up')({
  ssr: false,
  component: SignUpPage,
  head: () => ({
    meta: [{ title: 'OmniBid | Sign Up' }],
  }),
})

function SignUpPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 py-12 sm:py-20 flex justify-center">
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/proposals" />
    </div>
  )
}
