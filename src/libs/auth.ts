import { prisma } from "@/libs/prismaDb";
import { normalizeIndianMobile } from "@/libs/formatters";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { User } from "@prisma/client";
import bcrypt from "bcrypt";
import {
	type NextAuthOptions,
	DefaultSession,
	getServerSession,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
	interface Session extends DefaultSession {
		user: User &
			DefaultSession["user"] & {
				role?: string | null;
				status?: string | null;
				setupCompleted?: boolean;
			};
	}
}

export const authOptions: NextAuthOptions = {
	pages: {
		signIn: "/auth/signin",
	},
	adapter: PrismaAdapter(prisma),
	secret: process.env.SECRET,
	session: {
		strategy: "jwt",
	},

	providers: [
		CredentialsProvider({
			name: "credentials",
			id: "credentials",
			credentials: {
				email: { label: "Email", type: "text", placeholder: "Jhondoe" },
				password: { label: "Password", type: "password" },
				username: { label: "Username", type: "text", placeholder: "Jhon Doe" },
			},

			async authorize(credentials) {
				// Require both identifier (email/phone) and password
				if (!credentials?.email || !credentials?.password) {
					throw new Error("Please enter your mobile number/email and password");
				}

				const identifier = credentials.email.trim();
				const cleanPhone = normalizeIndianMobile(identifier);

				let user = null;

				// 1. If identifier resembles a 10-digit Indian mobile, check phone and fallback email
				if (cleanPhone.length === 10) {
					user = await prisma.user.findFirst({
						where: {
							OR: [
								{ phone: cleanPhone },
								{ email: `${cleanPhone}@pghostel.local` },
								{ email: identifier.toLowerCase() },
							],
						},
					});
				}

				// 2. If not found by phone, query by case-insensitive email
				if (!user) {
					user = await prisma.user.findFirst({
						where: {
							email: { equals: identifier.toLowerCase(), mode: "insensitive" },
						},
					});
				}

				// Reject if user not found or has no password
				if (!user || !user?.password) {
					throw new Error("Invalid credentials. Please verify your details.");
				}

				// Verify password using constant-time comparison
				const passwordMatch = await bcrypt.compare(
					credentials.password,
					user.password
				);

				if (!passwordMatch) {
					throw new Error("Incorrect password");
				}

				// Reject if account is suspended
				if (user.status === "SUSPENDED") {
					throw new Error(
						"Your account has been suspended. Please contact the administrator."
					);
				}

				return user;
			},
		}),

		/**
		 * IMPERSONATE provider — ADMIN only.
		 *
		 * Security model:
		 *  - The caller MUST supply the correct `adminPassword` for the admin account.
		 *  - The admin account is looked up by `adminEmail` and its DB role is verified.
		 *  - Only then is a session for `userEmail` returned.
		 *
		 * This prevents unauthenticated callers from impersonating arbitrary users
		 * simply by guessing an admin's email address.
		 */
		CredentialsProvider({
			name: "impersonate",
			id: "impersonate",
			credentials: {
				adminEmail: {
					label: "Admin Email",
					type: "text",
					placeholder: "admin@example.com",
				},
				adminPassword: {
					label: "Admin Password",
					type: "password",
				},
				userEmail: {
					label: "User Email",
					type: "text",
					placeholder: "user@example.com",
				},
			},

			async authorize(credentials) {
				if (
					!credentials?.adminEmail ||
					!credentials?.adminPassword ||
					!credentials?.userEmail
				) {
					throw new Error(
						"Admin email, admin password, and user email are required"
					);
				}

				// Look up the admin account
				const admin = await prisma.user.findUnique({
					where: {
						email: credentials.adminEmail.toLocaleLowerCase(),
					},
				});

				// Reject if admin not found, has no password, or is not ADMIN role
				if (!admin || !admin.password || admin.role !== "ADMIN") {
					throw new Error("Access denied");
				}

				// Verify the admin's own password before allowing impersonation
				const adminPasswordMatch = await bcrypt.compare(
					credentials.adminPassword,
					admin.password
				);

				if (!adminPasswordMatch) {
					throw new Error("Access denied");
				}

				// Fetch the target user
				const user = await prisma.user.findUnique({
					where: {
						email: credentials.userEmail.toLocaleLowerCase(),
					},
				});

				if (!user) {
					throw new Error("No user found");
				}

				return user;
			},
		}),

		// REMOVED: fetchSession provider
		//
		// The original `fetchSession` CredentialsProvider was a critical security
		// vulnerability: it issued a valid JWT session for ANY registered user given
		// only their email address — no password or other proof of identity required.
		//
		// An attacker who knew (or guessed) a valid email, including an admin email,
		// could call POST /api/auth/callback/fetchSession and receive a fully
		// authenticated session, bypassing all authentication.
		//
		// The only legitimate use of fetchSession was to refresh billing fields in the
		// JWT after a Paddle checkout. That use case is now handled by the
		// trigger === "update" callback path, which re-fetches the trusted fields from
		// the database rather than accepting them from the client.

		EmailProvider({
			server: {
				host: process.env.EMAIL_SERVER_HOST,
				port: Number(process.env.EMAIL_SERVER_PORT),
				auth: {
					user: process.env.EMAIL_SERVER_USER,
					pass: process.env.EMAIL_SERVER_PASSWORD,
				},
			},
			from: process.env.EMAIL_FROM,
		}),

		GitHubProvider({
			clientId: process.env.GITHUB_CLIENT_ID || "",
			clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
		}),

		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		}),
	],

	callbacks: {
		jwt: async (payload: any) => {
			const { token, trigger } = payload;
			const user: User = payload.user;

			/**
			 * JWT update trigger — called when the client calls useSession().update().
			 *
			 * SECURITY: Do NOT trust client-supplied privileged fields (role, id, email).
			 * Instead, re-fetch only the billing fields we actually need from the DB,
			 * using the user ID already embedded in the token (token.sub) as the
			 * authoritative source of identity. This prevents a client from escalating
			 * their own role by passing { role: "ADMIN" } in the session update payload.
			 */
			if (trigger === "update") {
				if (!token.sub) return token;

				// Re-fetch only safe fields from the database
				const freshUser = await prisma.user.findUnique({
					where: { id: token.sub },
					select: {
						priceId: true,
						subscriptionId: true,
						currentPeriodEnd: true,
						customerId: true,
						image: true,
						name: true,
						status: true,
						setupCompleted: true,
					},
				});

				if (!freshUser) return token;

				return {
					...token,
					name: freshUser.name,
					picture: freshUser.image,
					image: freshUser.image,
					priceId: freshUser.priceId,
					currentPeriodEnd: freshUser.currentPeriodEnd,
					subscriptionId: freshUser.subscriptionId,
					customerId: freshUser.customerId,
					status: freshUser.status,
					setupCompleted: freshUser.setupCompleted,
				};
			}

			// Initial sign-in: embed user data from the authorize() return value
			if (user) {
				return {
					...token,
					uid: user.id,
					priceId: user.priceId,
					currentPeriodEnd: user.currentPeriodEnd,
					subscriptionId: user.subscriptionId,
					role: user.role,
					status: user.status,
					setupCompleted: user.setupCompleted,
					picture: user.image,
					image: user.image,
				};
			}
			return token;
		},

		session: async ({ session, token }) => {
			if (session?.user) {
				return {
					...session,
					user: {
						...session.user,
						id: token.sub,
						priceId: token.priceId,
						currentPeriodEnd: token.currentPeriodEnd,
						subscriptionId: token.subscriptionId,
						role: token.role,
						status: token.status,
						setupCompleted: (token as any).setupCompleted,
						image: token.picture,
					},
				};
			}
			return session;
		},
	},

	// debug: process.env.NODE_ENV === "development",
};

export const getAuthSession = async () => {
	return getServerSession(authOptions);
};
