import { authOptions } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * Server Component / Page guard.
 * Validates the caller's session against the database to confirm they possess
 * the ADMIN role. Redirects to sign-in or owner dashboard if unauthorized.
 */
export async function requireAdminSession() {
	const session = await getServerSession(authOptions);

	if (!session?.user?.email) {
		redirect("/auth/signin");
	}

	// Always verify role against the live database record to defeat any token tampering
	const dbUser = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			status: true,
		},
	});

	if (!dbUser || dbUser.role !== "ADMIN" || dbUser.status === "SUSPENDED") {
		redirect("/user");
	}

	return { session, admin: dbUser };
}

/**
 * API Route Guard.
 * Validates that the request comes from an authenticated Admin.
 * Returns either { admin, session } or a 401/403 NextResponse.
 */
export async function getAdminApiSession() {
	const session = await getServerSession(authOptions);

	if (!session?.user?.email) {
		return {
			errorResponse: NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 }
			),
			admin: null,
			session: null,
		};
	}

	const dbUser = await prisma.user.findUnique({
		where: { email: session.user.email },
		select: {
			id: true,
			email: true,
			name: true,
			role: true,
			status: true,
		},
	});

	if (!dbUser || dbUser.role !== "ADMIN" || dbUser.status === "SUSPENDED") {
		return {
			errorResponse: NextResponse.json(
				{ error: "Forbidden: Super Admin access required" },
				{ status: 403 }
			),
			admin: null,
			session: null,
		};
	}

	return { errorResponse: null, admin: dbUser, session };
}

/**
 * Audit Logger for Administrative Actions.
 * Securely records admin interventions into the persistent AdminAuditLog table.
 */
export async function recordAdminAuditLog(params: {
	adminId: string;
	adminEmail: string;
	action: string;
	targetId?: string | null;
	targetEmail?: string | null;
	details?: string | null;
	ipAddress?: string | null;
}) {
	try {
		return await prisma.adminAuditLog.create({
			data: {
				adminId: params.adminId,
				adminEmail: params.adminEmail,
				action: params.action,
				targetId: params.targetId || null,
				targetEmail: params.targetEmail || null,
				details: params.details || null,
				ipAddress: params.ipAddress || null,
			},
		});
	} catch (error) {
		console.error("Failed to write administrative audit log:", error);
		return null;
	}
}
