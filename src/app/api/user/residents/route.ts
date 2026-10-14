import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";

// Standard Indian mobile number validation (10 digits starting with 6, 7, 8, or 9)
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export async function GET(request: Request) {
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

		// Verify owner account status
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

		const { searchParams } = new URL(request.url);
		const propertyId = searchParams.get("propertyId")?.trim();
		const statusParam = searchParams.get("status")?.trim().toUpperCase();
		const searchQuery = searchParams.get("search")?.trim();

		// Base filter: All properties owned by this owner
		const whereClause: any = {
			property: {
				ownerId: session.user.id,
			},
		};

		if (propertyId) {
			whereClause.propertyId = propertyId;
		}

		if (statusParam === "ACTIVE" || statusParam === "CHECKED_OUT") {
			whereClause.status = statusParam;
		}

		if (searchQuery) {
			whereClause.OR = [
				{ name: { contains: searchQuery, mode: "insensitive" } },
				{ phone: { contains: searchQuery } },
				{
					room: {
						roomNumber: { contains: searchQuery, mode: "insensitive" },
					},
				},
			];
		}

		const residents = await prisma.resident.findMany({
			where: whereClause,
			orderBy: [{ status: "asc" }, { checkInDate: "desc" }],
			include: {
				property: {
					select: {
						id: true,
						name: true,
						city: true,
						area: true,
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

		return NextResponse.json(residents);
	} catch (error) {
		console.error("GET /api/user/residents error:", error);
		return NextResponse.json(
			{ message: "Failed to retrieve residents list" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
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

		const body = await request.json();
		const {
			name,
			phone,
			email,
			guardianName,
			guardianPhone,
			checkInDate,
			propertyId,
			roomId,
			bedId,
			monthlyRent,
			securityDeposit,
			notes,
		} = body;

		// 1. Validate mandatory fields
		if (!name || typeof name !== "string" || name.trim().length < 2) {
			return NextResponse.json(
				{ message: "Resident name must be at least 2 characters long" },
				{ status: 400 }
			);
		}

		const cleanPhone = String(phone || "").replace(/\D/g, "");
		// Check for 10-digit Indian mobile number (or standard 10 digits)
		const targetPhone =
			cleanPhone.length === 12 && cleanPhone.startsWith("91")
				? cleanPhone.slice(2)
				: cleanPhone;

		if (!INDIAN_PHONE_REGEX.test(targetPhone)) {
			return NextResponse.json(
				{
					message:
						"Please provide a valid 10-digit Indian mobile number (e.g. 9876543210)",
				},
				{ status: 400 }
			);
		}

		if (email && typeof email === "string" && email.trim().length > 0) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email.trim())) {
				return NextResponse.json(
					{ message: "Please provide a valid email address or leave it blank" },
					{ status: 400 }
				);
			}
		}

		if (guardianPhone && typeof guardianPhone === "string") {
			const cleanGuardian = guardianPhone.replace(/\D/g, "");
			const targetGuardian =
				cleanGuardian.length === 12 && cleanGuardian.startsWith("91")
					? cleanGuardian.slice(2)
					: cleanGuardian;
			if (targetGuardian && !INDIAN_PHONE_REGEX.test(targetGuardian)) {
				return NextResponse.json(
					{
						message:
							"Guardian/emergency contact must be a valid 10-digit Indian phone number",
					},
					{ status: 400 }
				);
			}
		}

		if (!checkInDate || isNaN(new Date(checkInDate).getTime())) {
			return NextResponse.json(
				{ message: "Please select a valid check-in date" },
				{ status: 400 }
			);
		}

		const rentNum = Number(monthlyRent);
		if (isNaN(rentNum) || rentNum < 0 || !Number.isInteger(rentNum)) {
			return NextResponse.json(
				{ message: "Monthly rent must be a non-negative whole Rupee amount" },
				{ status: 400 }
			);
		}

		const depositNum =
			securityDeposit !== undefined && securityDeposit !== ""
				? Number(securityDeposit)
				: 0;
		if (isNaN(depositNum) || depositNum < 0 || !Number.isInteger(depositNum)) {
			return NextResponse.json(
				{
					message: "Security deposit must be a non-negative whole Rupee amount",
				},
				{ status: 400 }
			);
		}

		if (!propertyId || !roomId || !bedId) {
			return NextResponse.json(
				{ message: "Please select a property, room, and available bed" },
				{ status: 400 }
			);
		}

		// 2. Multi-tenant ownership and hierarchy verification
		const property = await prisma.property.findUnique({
			where: { id: propertyId },
			select: { id: true, ownerId: true },
		});

		if (!property || property.ownerId !== session.user.id) {
			return NextResponse.json(
				{ message: "Property not found or unauthorized" },
				{ status: 403 }
			);
		}

		const room = await prisma.room.findUnique({
			where: { id: roomId },
			select: { id: true, propertyId: true, roomNumber: true },
		});

		if (!room || room.propertyId !== propertyId) {
			return NextResponse.json(
				{
					message: "Selected room does not belong to the specified property",
				},
				{ status: 400 }
			);
		}

		const bed = await prisma.bed.findUnique({
			where: { id: bedId },
			select: { id: true, roomId: true, bedNumber: true, status: true },
		});

		if (!bed || bed.roomId !== roomId) {
			return NextResponse.json(
				{ message: "Selected bed does not belong to the specified room" },
				{ status: 400 }
			);
		}

		if (bed.status !== "AVAILABLE") {
			return NextResponse.json(
				{
					message: `Bed ${bed.bedNumber} is currently ${bed.status.toLowerCase()} and cannot be allocated`,
				},
				{ status: 409 }
			);
		}

		// 3. Atomic Transaction: Concurrency check, mark bed OCCUPIED, and create resident record
		const newResident = await prisma.$transaction(async (tx) => {
			// A. Concurrency double-check inside transaction
			const activeResidentOnBed = await tx.resident.findFirst({
				where: { bedId, status: "ACTIVE" },
			});

			if (activeResidentOnBed) {
				throw new Error("BED_ALREADY_OCCUPIED");
			}

			// B. Atomic bed update: ensures status was still AVAILABLE
			const updatedBed = await tx.bed.update({
				where: {
					id: bedId,
					status: "AVAILABLE",
				},
				data: {
					status: "OCCUPIED",
				},
			});

			if (!updatedBed) {
				throw new Error("BED_NOT_AVAILABLE");
			}

			// C. Create resident record
			return await tx.resident.create({
				data: {
					name: name.trim(),
					phone: targetPhone,
					email: email?.trim() || null,
					guardianName: guardianName?.trim() || null,
					guardianPhone: guardianPhone
						? String(guardianPhone).replace(/\D/g, "").slice(-10)
						: null,
					checkInDate: new Date(checkInDate),
					monthlyRent: rentNum,
					securityDeposit: depositNum,
					notes: notes?.trim() || null,
					status: "ACTIVE",
					propertyId,
					roomId,
					bedId,
				},
				include: {
					property: {
						select: {
							id: true,
							name: true,
							city: true,
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
		});

		return NextResponse.json(newResident, { status: 201 });
	} catch (error: any) {
		console.error("POST /api/user/residents error:", error);
		if (
			error.message === "BED_ALREADY_OCCUPIED" ||
			error.message === "BED_NOT_AVAILABLE" ||
			error.code === "P2002"
		) {
			return NextResponse.json(
				{
					message:
						"The selected bed was already allocated by another request. Please choose an available bed.",
				},
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{ message: "Failed to onboard resident. Please try again." },
			{ status: 500 }
		);
	}
}
