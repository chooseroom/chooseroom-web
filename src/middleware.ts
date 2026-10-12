import { withAuth, NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
	function middleware(req: NextRequestWithAuth) {
		const pathname = req.nextUrl?.pathname;
		const token = req.nextauth.token;

		// 1. Immediately block suspended accounts from accessing protected areas
		if (token?.status === "SUSPENDED") {
			return NextResponse.redirect(
				new URL("/auth/signin?error=AccountSuspended", req.url)
			);
		}

		const isAdmin = token?.role === "ADMIN";
		const isOwner = token?.role === "BUSINESS_OWNER" || token?.role === "USER";

		// 2. Strict Super Admin protection: Only ADMIN role can access /admin
		if (pathname.startsWith("/admin")) {
			if (!isAdmin) {
				// Business owners trying to access admin panel are redirected to their owner portal
				if (isOwner) {
					return NextResponse.redirect(new URL("/user", req.url));
				}
				return NextResponse.redirect(new URL("/auth/signin", req.url));
			}
		}

		// 3. Owner Dashboard protection: Admins belong in /admin, not /user
		if (pathname.startsWith("/user")) {
			if (isAdmin) {
				return NextResponse.redirect(new URL("/admin", req.url));
			}
			if (!isOwner) {
				return NextResponse.redirect(new URL("/auth/signin", req.url));
			}
		}

		return NextResponse.next();
	},
	{
		secret: process.env.SECRET,
		callbacks: {
			authorized: (params) => {
				const { token } = params;
				return !!token;
			},
		},
	}
);

export const config = {
	matcher: ["/user/:path*", "/admin/:path*"],
};
