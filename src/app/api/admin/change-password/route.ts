import { getAdminApiSession, recordAdminAuditLog } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
	try {
		const { errorResponse, admin } = await getAdminApiSession();
		if (errorResponse) {
			return errorResponse;
		}

		if (!admin || !admin.email) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { currentPassword, newPassword, confirmPassword } = body;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return NextResponse.json(
				{ error: "All password fields are required." },
				{ status: 400 }
			);
		}

		if (newPassword.length < 8) {
			return NextResponse.json(
				{ error: "New password must be at least 8 characters long." },
				{ status: 400 }
			);
		}

		if (newPassword !== confirmPassword) {
			return NextResponse.json(
				{ error: "New password and confirmation do not match." },
				{ status: 400 }
			);
		}

		// Retrieve admin user from DB with password hash
		const user = await prisma.user.findUnique({
			where: { email: admin.email },
		});

		if (!user || !user.password) {
			return NextResponse.json(
				{ error: "Admin user record not found or has no local credentials." },
				{ status: 404 }
			);
		}

		// Validate current password
		const isMatch = await bcrypt.compare(currentPassword, user.password);
		if (!isMatch) {
			return NextResponse.json(
				{ error: "Current password is incorrect." },
				{ status: 400 }
			);
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 10);

		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashedNewPassword },
		});

		// Record audit event
		await recordAdminAuditLog({
			adminId: user.id,
			adminEmail: user.email || "admin",
			action: "ADMIN_PASSWORD_CHANGE",
			targetId: user.id,
			targetEmail: user.email,
			details: "Super Admin updated account security credentials.",
		});

		return NextResponse.json({
			success: true,
			message: "Password changed successfully.",
		});
	} catch (error: any) {
		console.error("Admin change-password error:", error);
		return NextResponse.json(
			{ error: "Failed to update password. Please try again." },
			{ status: 500 }
		);
	}
}
