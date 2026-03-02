const clerkIssuerDomain = process.env.CLERK_JWT_ISSUER_DOMAIN

if (!clerkIssuerDomain) {
  throw new Error(
    'Missing CLERK_JWT_ISSUER_DOMAIN environment variable. Set it with `npx convex env set CLERK_JWT_ISSUER_DOMAIN <your-clerk-issuer-domain>` or define it in .env.local for development.',
  )
}

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: 'convex',
    },
  ],
}
