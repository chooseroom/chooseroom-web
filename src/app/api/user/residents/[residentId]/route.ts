import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export async function GET(
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

		const { residentId } = await context.params;

		const resident = await prisma.resident.findUnique({
			where: { id: residentId },
			include: {
				property: {
					select: {
						id: true,
						name: true,
						city: true,
						area: true,
						ownerId: true,
					},
				},
				room: {
					select: {
						id: true,
						roomNumber: true,
						floor: true,
						sharing: true,
						acType: true,
					},
				},
				bed: {
					select: {
						id: true,
						bedNumber: true,
						status: true,
					},
				},
			},
		});

		if (!resident || resident.property.ownerId !== session.user.id) {
			return NextResponse.json(
				{ message: "Resident not found or access denied" },
				{ status: 404 }
			);
		}

		return NextResponse.json(resident);
	} catch (error) {
		console.error("GET /api/user/residents/[residentId] error:", error);
		return NextResponse.json(
			{ message: "Failed to retrieve resident details" },
			{ status: 500 }
		);
	}
}

export async function PATCH(
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

		// Verify existing resident and ownership
		const existingResident = await prisma.resident.findUnique({
			where: { id: residentId },
			include: {
				property: { select: { ownerId: true } },
			},
		});

		if (
			!existingResident ||
			existingResident.property.ownerId !== session.user.id
		) {
			return NextResponse.json(
				{ message: "Resident not found or access denied" },
				{ status: 404 }
			);
		}

		const body = await request.json();
		const updateData: any = {};

		if (body.name !== undefined) {
			if (typeof body.name !== "string" || body.name.trim().length < 2) {
				return NextResponse.json(
					{ message: "Resident name must be at least 2 characters long" },
					{ status: 400 }
				);
			}
			updateData.name = body.name.trim();
		}

		if (body.phone !== undefined) {
			const clean = String(body.phone).replace(/\D/g, "");
			const target =
				clean.length === 12 && clean.startsWith("91") ? clean.slice(2) : clean;
			if (!INDIAN_PHONE_REGEX.test(target)) {
				return NextResponse.json(
					{ message: "Please provide a valid 10-digit Indian mobile number" },
					{ status: 400 }
				);
			}
			updateData.phone = target;
		}

		if (body.email !== undefined) {
			if (body.email && typeof body.email === "string") {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(body.email.trim())) {
					return NextResponse.json(
						{ message: "Please provide a valid email address or empty string" },
						{ status: 400 }
					);
				}
				updateData.email = body.email.trim();
			} else {
				updateData.email = null;
			}
		}

		if (body.guardianName !== undefined) {
			updateData.guardianName = body.guardianName
				? String(body.guardianName).trim()
				: null;
		}

		if (body.guardianPhone !== undefined) {
			if (body.guardianPhone) {
				const cleanG = String(body.guardianPhone).replace(/\D/g, "");
				const targetG =
					cleanG.length === 12 && cleanG.startsWith("91")
						? cleanG.slice(2)
						: cleanG;
				if (!INDIAN_PHONE_REGEX.test(targetG)) {
					return NextResponse.json(
						{
							message:
								"Guardian phone must be a valid 10-digit Indian phone number",
						},
						{ status: 400 }
					);
				}
				updateData.guardianPhone = targetG;
			} else {
				updateData.guardianPhone = null;
			}
		}

		if (body.monthlyRent !== undefined) {
			const rent = Number(body.monthlyRent);
			if (isNaN(rent) || rent < 0 || !Number.isInteger(rent)) {
				return NextResponse.json(
					{ message: "Monthly rent must be a non-negative whole Rupee amount" },
					{ status: 400 }
				);
			}
			updateData.monthlyRent = rent;
		}

		if (body.securityDeposit !== undefined) {
			const deposit = Number(body.securityDeposit);
			if (isNaN(deposit) || deposit < 0 || !Number.isInteger(deposit)) {
				return NextResponse.json(
					{
						message:
							"Security deposit must be a non-negative whole Rupee amount",
					},
					{ status: 400 }
				);
			}
			updateData.securityDeposit = deposit;
		}

		if (body.notes !== undefined) {
			updateData.notes = body.notes ? String(body.notes).trim() : null;
		}

		const updated = await prisma.resident.update({
			where: { id: residentId },
			data: updateData,
			include: {
				property: { select: { id: true, name: true, city: true } },
				room: { select: { id: true, roomNumber: true, floor: true } },
				bed: { select: { id: true, bedNumber: true, status: true } },
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("PATCH /api/user/residents/[residentId] error:", error);
		return NextResponse.json(
			{ message: "Failed to update resident details" },
			{ status: 500 }
		);
	}
}
