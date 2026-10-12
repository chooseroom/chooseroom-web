import { getAdminApiSession, recordAdminAuditLog } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	// 1. Enforce strict server-side Super Admin authentication
	const { errorResponse, admin } = await getAdminApiSession();
	if (errorResponse || !admin) {
		return errorResponse;
	}

	try {
		const body = await request.json();
		const { ownerId, status, reason } = body;

		if (!ownerId || (status !== "ACTIVE" && status !== "SUSPENDED")) {
			return NextResponse.json(
				{
					error:
						"Invalid payload: ownerId and valid status ('ACTIVE' | 'SUSPENDED') are required.",
				},
				{ status: 400 }
			);
		}

		// 2. Fetch target user
		const targetOwner = await prisma.user.findUnique({
			where: { id: ownerId },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
				status: true,
			},
		});

		if (!targetOwner) {
			return NextResponse.json(
				{ error: "PG Owner not found." },
				{ status: 404 }
			);
		}

		// 3. Safety: Disallow suspending Admins via this owner endpoint
		if (targetOwner.role === "ADMIN") {
			return NextResponse.json(
				{
					error:
						"Administrative accounts cannot be suspended through owner management.",
				},
				{ status: 400 }
			);
		}

		// 4. Update owner account status in live database
		const updated = await prisma.user.update({
			where: { id: ownerId },
			data: {
				status,
			},
			select: {
				id: true,
				email: true,
				name: true,
				status: true,
			},
		});

		// 5. Securely record administrative action in AdminAuditLog
		await recordAdminAuditLog({
			adminId: admin.id,
			adminEmail: admin.email || "admin@system",
			action: status === "SUSPENDED" ? "SUSPEND_OWNER" : "ACTIVATE_OWNER",
			targetId: targetOwner.id,
			targetEmail: targetOwner.email,
			details: reason
				? `Account ${status.toLowerCase()}: ${reason}`
				: `Owner account status changed to ${status}`,
			ipAddress:
				request.headers.get("x-forwarded-for") ||
				request.headers.get("x-real-ip") ||
				null,
		});

		return NextResponse.json({
			message: `Owner account ${status === "SUSPENDED" ? "suspended" : "activated"} successfully.`,
			owner: updated,
		});
	} catch (error: any) {
		console.error("Owner status change failed:", error);
		return NextResponse.json(
			{ error: error?.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
