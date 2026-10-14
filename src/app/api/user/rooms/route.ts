import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";
import { z } from "zod";

// Sharing-type to bed count mapping — canonical source of truth
const SHARING_BED_COUNT: Record<string, number> = {
	SINGLE: 1,
	DOUBLE: 2,
	TRIPLE: 3,
	FOUR: 4,
};

const createRoomSchema = z.object({
	propertyId: z.string().min(1, { message: "Property is required." }),
	roomNumber: z
		.string()
		.trim()
		.min(1, { message: "Room number is required." })
		.max(20, { message: "Room number cannot exceed 20 characters." })
		.regex(/^[A-Za-z0-9\-_ ]+$/, {
			message:
				"Room number can only contain letters, digits, hyphens and spaces.",
		}),
	floor: z
		.string()
		.trim()
		.min(1, { message: "Floor designation is required." })
		.max(50, { message: "Floor name cannot exceed 50 characters." }),
	sharing: z.enum(["SINGLE", "DOUBLE", "TRIPLE", "FOUR"], {
		errorMap: () => ({
			message:
				"Please select a valid sharing type: Single, Double, Triple, or Four Sharing.",
		}),
	}),
	acType: z.enum(["AC", "NON_AC"], {
		errorMap: () => ({
			message: "Please specify whether the room is AC or Non-AC.",
		}),
	}),
	rentPerBed: z
		.number()
		.int({ message: "Rent must be a whole number in Rupees." })
		.min(0, { message: "Rent cannot be negative." })
		.max(200000, { message: "Rent cannot exceed ₹2,00,000 per bed." })
		.nullable()
		.optional(),
	notes: z
		.string()
		.max(500, { message: "Notes cannot exceed 500 characters." })
		.optional()
		.nullable(),
});

// ---------------------------------------------------------------
// GET /api/user/rooms?propertyId=xxx
// Returns all rooms for a property (owned by the current user)
// ---------------------------------------------------------------
export async function GET(request: Request) {
	try {
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required." },
				{ status: 401 }
			);
		}
		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Admin accounts use the admin panel for data access." },
				{ status: 403 }
			);
		}

		// Check account status from DB
		const dbUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true, setupCompleted: true },
		});
		if (!dbUser) {
			return NextResponse.json({ message: "User not found." }, { status: 404 });
		}
		if (dbUser.status === "SUSPENDED") {
			return NextResponse.json(
				{ message: "Your account is suspended." },
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const propertyId = searchParams.get("propertyId");

		if (!propertyId) {
			return NextResponse.json(
				{ message: "propertyId query parameter is required." },
				{ status: 400 }
			);
		}

		// Verify the property belongs to this owner
		const property = await prisma.property.findFirst({
			where: { id: propertyId, ownerId: session.user.id },
			select: { id: true, name: true },
		});
		if (!property) {
			return NextResponse.json(
				{ message: "Property not found or access denied." },
				{ status: 404 }
			);
		}

		const rooms = await prisma.room.findMany({
			where: { propertyId },
			orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
			include: {
				beds: {
					orderBy: { bedNumber: "asc" },
					select: {
						id: true,
						bedNumber: true,
						status: true,
						residents: {
							where: { status: "ACTIVE" },
							select: { id: true, name: true, phone: true },
						},
					},
				},
			},
		});

		return NextResponse.json({ rooms, property });
	} catch (error) {
		console.error("[GET /api/user/rooms] error:", error);
		return NextResponse.json(
			{ message: "Failed to fetch rooms. Please try again." },
			{ status: 500 }
		);
	}
}

// ---------------------------------------------------------------
// POST /api/user/rooms
// Creates a room and its beds in a single transaction
// ---------------------------------------------------------------
export async function POST(request: Request) {
	try {
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required." },
				{ status: 401 }
			);
		}
		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Admin accounts cannot create owner rooms." },
				{ status: 403 }
			);
		}

		// Check account status
		const dbUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true, setupCompleted: true },
		});
		if (!dbUser) {
			return NextResponse.json({ message: "User not found." }, { status: 404 });
		}
		if (dbUser.status === "SUSPENDED") {
			return NextResponse.json(
				{ message: "Your account is suspended." },
				{ status: 403 }
			);
		}
		if (!dbUser.setupCompleted) {
			return NextResponse.json(
				{ message: "Please complete your PG/Hostel setup first." },
				{ status: 403 }
			);
		}

		const body = await request.json();
		const parsed = createRoomSchema.safeParse(body);
		if (!parsed.success) {
			const firstError = parsed.error.errors[0]?.message || "Invalid input.";
			return NextResponse.json({ message: firstError }, { status: 400 });
		}

		const {
			propertyId,
			roomNumber,
			floor,
			sharing,
			acType,
			rentPerBed,
			notes,
		} = parsed.data;

		// Multi-tenant check: verify property ownership
		const property = await prisma.property.findFirst({
			where: { id: propertyId, ownerId: session.user.id },
			select: { id: true },
		});
		if (!property) {
			return NextResponse.json(
				{ message: "Property not found or access denied." },
				{ status: 404 }
			);
		}

		const bedCount = SHARING_BED_COUNT[sharing];
		if (!bedCount) {
			return NextResponse.json(
				{ message: "Invalid sharing type." },
				{ status: 400 }
			);
		}

		// Create room and beds atomically — no partial state possible
		const room = await prisma.$transaction(async (tx) => {
			// Duplicate room number check within the transaction
			const existing = await tx.room.findUnique({
				where: { propertyId_roomNumber: { propertyId, roomNumber } },
			});
			if (existing) {
				throw new Error(
					`Room "${roomNumber}" already exists in this property. Please use a different room number.`
				);
			}

			const newRoom = await tx.room.create({
				data: {
					roomNumber,
					floor,
					sharing,
					acType,
					rentPerBed: rentPerBed ?? null,
					notes: notes?.trim() || null,
					propertyId,
					beds: {
						create: Array.from({ length: bedCount }, (_, i) => ({
							bedNumber: i + 1,
							status: "AVAILABLE",
						})),
					},
				},
				include: {
					beds: { orderBy: { bedNumber: "asc" } },
				},
			});

			return newRoom;
		});

		return NextResponse.json({ room }, { status: 201 });
	} catch (error: any) {
		// Propagate the friendly duplicate-key message
		if (error?.message?.includes("already exists") || error?.code === "P2002") {
			const msg = error?.message?.includes("already exists")
				? error.message
				: "A room with this number already exists in this property.";
			return NextResponse.json({ message: msg }, { status: 409 });
		}
		console.error("[POST /api/user/rooms] error:", error);
		return NextResponse.json(
			{ message: "Failed to create room. Please try again." },
			{ status: 500 }
		);
	}
}
