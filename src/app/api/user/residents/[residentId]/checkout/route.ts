import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";

export async function POST(
	request: Request,
	context: { params: Promise<{ residentId: string }> }
) {
	try {
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required" },
				{ status: 401 }
			);
		}

		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Admins must use the admin portal" },
				{ status: 403 }
			);
		}

		const owner = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, status: true },
		});

		if (!owner || owner.status === "SUSPENDED") {
			return NextResponse.json(
				{ message: "Your account is suspended. Please contact support." },
				{ status: 403 }
			);
		}

		const { residentId } = await context.params;

		// 1. Authoritative verification of resident and ownership
		const resident = await prisma.resident.findUnique({
			where: { id: residentId },
			include: {
				property: { select: { ownerId: true } },
				bed: { select: { id: true, status: true, bedNumber: true } },
			},
		});

		if (!resident || resident.property.ownerId !== session.user.id) {
			return NextResponse.json(
				{ message: "Resident not found or access denied" },
				{ status: 404 }
			);
		}

		// 2. Prevent repeated checkout from corrupting inventory
		if (resident.status === "CHECKED_OUT") {
			return NextResponse.json(
				{
					message:
						"Resident has already checked out and bed was previously released.",
				},
				{ status: 400 }
			);
		}

		// Optional checkout date from body, default to current timestamp
		let checkoutDate = new Date();
		try {
			const body = await request.json();
			if (body?.checkoutDate && !isNaN(new Date(body.checkoutDate).getTime())) {
				checkoutDate = new Date(body.checkoutDate);
			}
		} catch {
			// Body is optional
		}

		// 3. Atomic Transaction: Set resident to CHECKED_OUT, release bed to AVAILABLE
		const updatedResident = await prisma.$transaction(async (tx) => {
			// Mark resident checked out with recorded checkout timestamp
			const checkedOut = await tx.resident.update({
				where: { id: residentId },
				data: {
					status: "CHECKED_OUT",
					checkOutDate: checkoutDate,
				},
				include: {
					property: { select: { id: true, name: true, city: true } },
					room: { select: { id: true, roomNumber: true, floor: true } },
					bed: { select: { id: true, bedNumber: true, status: true } },
				},
			});

			// Safely release bed back to AVAILABLE inventory
			await tx.bed.update({
				where: { id: resident.bedId },
				data: {
					status: "AVAILABLE",
				},
			});

			return checkedOut;
		});

		return NextResponse.json({
			message: "Resident checked out successfully and bed released",
			resident: updatedResident,
		});
	} catch (error) {
		console.error(
			"POST /api/user/residents/[residentId]/checkout error:",
			error
		);
		return NextResponse.json(
			{ message: "Failed to process checkout. Please try again." },
			{ status: 500 }
		);
	}
}
