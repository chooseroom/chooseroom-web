import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";
import { z } from "zod";

const SHARING_BED_COUNT: Record<string, number> = {
	SINGLE: 1,
	DOUBLE: 2,
	TRIPLE: 3,
	FOUR: 4,
};

const updateRoomSchema = z.object({
	floor: z
		.string()
		.trim()
		.min(1, { message: "Floor designation is required." })
		.max(50)
		.optional(),
	roomNumber: z
		.string()
		.trim()
		.min(1, { message: "Room number is required." })
		.max(20)
		.regex(/^[A-Za-z0-9\-_ ]+$/, {
			message:
				"Room number can only contain letters, digits, hyphens and spaces.",
		})
		.optional(),
	acType: z.enum(["AC", "NON_AC"]).optional(),
	rentPerBed: z
		.number()
		.int({ message: "Rent must be a whole number in Rupees." })
		.min(0)
		.max(200000)
		.nullable()
		.optional(),
	notes: z.string().max(500).nullable().optional(),
	// Changing sharing is not allowed (would require adding/removing beds)
});

// Helper to verify ownership of a room
async function verifyRoomOwnership(roomId: string, ownerId: string) {
	const room = await prisma.room.findFirst({
		where: {
			id: roomId,
			property: { ownerId },
		},
		include: {
			beds: {
				orderBy: { bedNumber: "asc" },
				select: { id: true, bedNumber: true, status: true },
			},
			property: { select: { id: true, name: true } },
		},
	});
	return room;
}

// ---------------------------------------------------------------
// GET /api/user/rooms/[roomId]
// Returns a single room with its beds
// ---------------------------------------------------------------
export async function GET(
	_request: Request,
	context: { params: Promise<{ roomId: string }> }
) {
	try {
		const { roomId } = await context.params;
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required." },
				{ status: 401 }
			);
		}
		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Use the admin panel." },
				{ status: 403 }
			);
		}

		const dbUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true },
		});
		if (!dbUser || dbUser.status === "SUSPENDED") {
			return NextResponse.json({ message: "Access denied." }, { status: 403 });
		}

		const room = await verifyRoomOwnership(roomId, session.user.id);
		if (!room) {
			return NextResponse.json(
				{ message: "Room not found or access denied." },
				{ status: 404 }
			);
		}

		return NextResponse.json({ room });
	} catch (error) {
		console.error("[GET /api/user/rooms/[roomId]] error:", error);
		return NextResponse.json(
			{ message: "Failed to fetch room." },
			{ status: 500 }
		);
	}
}

// ---------------------------------------------------------------
// PATCH /api/user/rooms/[roomId]
// Update room details (not sharing type — beds are immutable counts)
// ---------------------------------------------------------------
export async function PATCH(
	request: Request,
	context: { params: Promise<{ roomId: string }> }
) {
	try {
		const { roomId } = await context.params;
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required." },
				{ status: 401 }
			);
		}
		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Use the admin panel." },
				{ status: 403 }
			);
		}

		const dbUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true },
		});
		if (!dbUser || dbUser.status === "SUSPENDED") {
			return NextResponse.json({ message: "Access denied." }, { status: 403 });
		}

		const existingRoom = await verifyRoomOwnership(roomId, session.user.id);
		if (!existingRoom) {
			return NextResponse.json(
				{ message: "Room not found or access denied." },
				{ status: 404 }
			);
		}

		const body = await request.json();
		const parsed = updateRoomSchema.safeParse(body);
		if (!parsed.success) {
			const firstError = parsed.error.errors[0]?.message || "Invalid input.";
			return NextResponse.json({ message: firstError }, { status: 400 });
		}

		const { floor, roomNumber, acType, rentPerBed, notes } = parsed.data;

		// If changing room number, verify no duplicate in the same property
		if (roomNumber && roomNumber !== existingRoom.roomNumber) {
			const dup = await prisma.room.findUnique({
				where: {
					propertyId_roomNumber: {
						propertyId: existingRoom.property.id,
						roomNumber,
					},
				},
			});
			if (dup) {
				return NextResponse.json(
					{ message: `Room "${roomNumber}" already exists in this property.` },
					{ status: 409 }
				);
			}
		}

		const updated = await prisma.room.update({
			where: { id: roomId },
			data: {
				...(floor !== undefined && { floor }),
				...(roomNumber !== undefined && { roomNumber }),
				...(acType !== undefined && { acType }),
				...(rentPerBed !== undefined && { rentPerBed: rentPerBed ?? null }),
				...(notes !== undefined && { notes: notes?.trim() || null }),
			},
			include: {
				beds: { orderBy: { bedNumber: "asc" } },
			},
		});

		return NextResponse.json({ room: updated });
	} catch (error: any) {
		if (error?.code === "P2002") {
			return NextResponse.json(
				{ message: "A room with this number already exists in this property." },
				{ status: 409 }
			);
		}
		console.error("[PATCH /api/user/rooms/[roomId]] error:", error);
		return NextResponse.json(
			{ message: "Failed to update room." },
			{ status: 500 }
		);
	}
}

// ---------------------------------------------------------------
// DELETE /api/user/rooms/[roomId]
// Delete a room only if ALL its beds are AVAILABLE (not occupied)
// ---------------------------------------------------------------
export async function DELETE(
	_request: Request,
	context: { params: Promise<{ roomId: string }> }
) {
	try {
		const { roomId } = await context.params;
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required." },
				{ status: 401 }
			);
		}
		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Use the admin panel." },
				{ status: 403 }
			);
		}

		const dbUser = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { status: true },
		});
		if (!dbUser || dbUser.status === "SUSPENDED") {
			return NextResponse.json({ message: "Access denied." }, { status: 403 });
		}

		const room = await verifyRoomOwnership(roomId, session.user.id);
		if (!room) {
			return NextResponse.json(
				{ message: "Room not found or access denied." },
				{ status: 404 }
			);
		}

		// Safety: Prevent deletion if any bed is occupied or in maintenance
		const nonAvailableBeds = room.beds.filter(
			(b: { status: string }) => b.status !== "AVAILABLE"
		);
		if (nonAvailableBeds.length > 0) {
			return NextResponse.json(
				{
					message: `Cannot delete Room ${room.roomNumber}. ${nonAvailableBeds.length} bed(s) are currently occupied or under maintenance. Please vacate all beds first.`,
				},
				{ status: 409 }
			);
		}

		// Double-check no active resident remains allocated
		const activeResidentsCount = await prisma.resident.count({
			where: { roomId, status: "ACTIVE" },
		});
		if (activeResidentsCount > 0) {
			return NextResponse.json(
				{
					message: `Cannot delete Room ${room.roomNumber}. There are ${activeResidentsCount} active resident(s) staying in this room. Please check out residents first.`,
				},
				{ status: 409 }
			);
		}

		// Beds cascade-delete via Prisma relation
		await prisma.room.delete({ where: { id: roomId } });

		return NextResponse.json({ message: "Room deleted successfully." });
	} catch (error) {
		console.error("[DELETE /api/user/rooms/[roomId]] error:", error);
		return NextResponse.json(
			{ message: "Failed to delete room." },
			{ status: 500 }
		);
	}
}

// Suppress unused import warning — used for bed count calculation
void SHARING_BED_COUNT;
