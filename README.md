Thanks for choosing SaaSBold 🙌
A full-stack SaaS boilerplate and starter kit comes with all essential integrations, pages, components, user/admin
dashboards, landing page, design source and everything you need to turn your feature-rich SaaS startup idea into
reality.

## [🚀 Documentation](https://saasbold.com/docs)

## [⚡ Homepage](https://saasbold.com)

## [💜 Support](https://saasbold.com/support)

## [💬 Community](https://pimjo.com/community)

## Update Logs

📆 26 March 2025

- Update next.js for [CVE-2025-29927](https://nextjs.org/blog/cve-2025-29927) patch

📆 19 March 2025

- Fixed peer dependency issue while installing the application.
- Migrated to `react-instantsearch` from `react-instantsearch-dom`

📆 26 February 2025

- Internationalization support(en and de) with `next-intl`
- Added Language Switcher dropdown
- Resolved React Quill support issue

📆 06 February 2025

- Rate limiting for Magic Links and email-password authentication.
- Request body validation of API endpoints using Zod.
- Preventing sensitive data being exposed on API routes.

📆 28 November 2024

- Integrated zod for Form validation
- Upgraded to Next.js 15

📆 27 October 2024

- Updated sanity integration enable/disable
- Removed lock file to prevent unexpected errors
- Updated package.json file

📆 11 September 2024

- Added integrations enable/disable features

📆 13 June 2024

- Added Paddle Integration
- Added Cancel Subscription API on LemonSqueezy integration
- Separted Stripe, LemonSqueezy and Paddle Billing pages
- Added/Updated files and folders
  **Update Guide**

1. api -> lemon-squeezy (all the apis updated)
2. libs -> auth.ts
3. Stripe -> StripeBilling, Paddle -> PaddleBilling, LemonSqueezy -> LsBilling

📆 26 May 2024

- Added User Impersonation
- Added Invitation from admin dashboard
- Added/Updated files and folders
  **Update Guide**

1. prisma → schema.prisma

2. src → app → user → invite

3. components → Auth → InvitedSignin

4. components → Admin → Users → UsersActions.tsx and UserTopbar.tsx

5. libs → auth.ts

📆 15 May 2024

- Added LemonSqueezy Integration

📆 07 April 2024

- Fixed mobile nav toggle issue
- Removed breadcrumb from single blog page
- Updated Layout (to prevent client rendering):
    - moved pre-loader logic to PreLoader File
    - moved header & footer to HeaderWrapper & FooterWrapper
