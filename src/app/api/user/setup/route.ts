import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";
import { z } from "zod";

const setupPropertySchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, { message: "PG/Hostel name must be at least 2 characters long." })
		.max(100, { message: "PG/Hostel name cannot exceed 100 characters." }),
	type: z.enum(["PG", "HOSTEL", "BOTH"], {
		errorMap: () => ({
			message:
				"Please select a valid category (PG, Hostel, or Both PG & Hostel).",
		}),
	}),
	gender: z.enum(["BOYS", "GIRLS", "COED"], {
		errorMap: () => ({
			message: "Please select a valid resident type (Boys, Girls, or Co-ed).",
		}),
	}),
	city: z
		.string()
		.trim()
		.min(2, { message: "City name must be at least 2 characters long." }),
	area: z
		.string()
		.trim()
		.min(2, { message: "Area/locality must be at least 2 characters long." }),
	address: z.string().trim().min(5, {
		message:
			"Please enter a detailed property address (at least 5 characters).",
	}),
});

export async function POST(request: Request) {
	try {
		// 1. Authoritative session verification
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required. Please sign in." },
				{ status: 401 }
			);
		}

		// Admins do not manage personal properties through owner setup
		if (session.user.role === "ADMIN") {
			return NextResponse.json(
				{ message: "Administrative accounts cannot create owner properties." },
				{ status: 403 }
			);
		}

		// 2. Fetch authoritative user from database
		const dbUser = await prisma.user.findUnique({
			where: { id: session.user.id },
		});

		if (!dbUser) {
			return NextResponse.json(
				{ message: "User account not found." },
				{ status: 404 }
			);
		}

		if (dbUser.status === "SUSPENDED") {
			return NextResponse.json(
				{ message: "Your account is suspended. Action prohibited." },
				{ status: 403 }
			);
		}

		// 3. Idempotency Check: if owner already has completed setup, return existing property
		if (dbUser.setupCompleted) {
			const existingProp = await prisma.property.findFirst({
				where: { ownerId: dbUser.id },
			});
			if (existingProp) {
				return NextResponse.json(
					{
						message: "Property setup already completed.",
						property: existingProp,
					},
					{ status: 200 }
				);
			}
		}

		// 4. Validate input payload
		const body = await request.json();
		const parseResult = setupPropertySchema.safeParse(body);

		if (!parseResult.success) {
			return NextResponse.json(
				{
					message: "Validation failed. Please verify your entries.",
					errors: parseResult.error.flatten().fieldErrors,
				},
				{ status: 400 }
			);
		}

		const data = parseResult.data;

		// 5. Transaction: Create Property and mark setupCompleted atomically
		const { property } = await prisma.$transaction(async (tx) => {
			const newProperty = await tx.property.create({
				data: {
					name: data.name,
					type: data.type,
					gender: data.gender,
					city: data.city,
					area: data.area,
					address: data.address,
					ownerId: dbUser.id, // Strictly server verified!
				},
			});

			await tx.user.update({
				where: { id: dbUser.id },
				data: {
					setupCompleted: true,
				},
			});

			return { property: newProperty };
		});

		return NextResponse.json(
			{
				message: "PG/Hostel property configured successfully!",
				property,
			},
			{ status: 201 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{ message: error?.message || "An error occurred during property setup." },
			{ status: 500 }
		);
	}
}
