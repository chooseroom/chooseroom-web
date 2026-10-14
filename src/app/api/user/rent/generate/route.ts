import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import {
	formatBillingPeriod,
	getBillingPeriodString,
	getDefaultDueDate,
} from "@/libs/rentLedger";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

		const body = await request.json().catch(() => ({}));
		const billingPeriod =
			(body.billingPeriod as string)?.trim() || getBillingPeriodString();

		// Validate billing period format "YYYY-MM"
		if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(billingPeriod)) {
			return NextResponse.json(
				{
					message:
						"Invalid billing period format. Expected 'YYYY-MM' (e.g. 2026-10).",
				},
				{ status: 400 }
			);
		}

		const dueDay = typeof body.dueDay === "number" ? body.dueDay : 5;
		const dueDate = body.dueDate
			? new Date(body.dueDate)
			: getDefaultDueDate(billingPeriod, dueDay);

		const propertyId = body.propertyId?.trim();

		// 1. Fetch eligible properties owned by this owner
		const propertyWhere: any = { ownerId: session.user.id };
		if (propertyId && propertyId !== "ALL") {
			propertyWhere.id = propertyId;
		}

		const properties = await prisma.property.findMany({
			where: propertyWhere,
			select: { id: true, name: true },
		});

		if (properties.length === 0) {
			return NextResponse.json(
				{ message: "No matching properties found for this owner." },
				{ status: 404 }
			);
		}

		const propertyIds = properties.map((p) => p.id);

		// Calculate start and end bounds of this billing month
		const [yearStr, monthStr] = billingPeriod.split("-");
		const year = parseInt(yearStr, 10);
		const month = parseInt(monthStr, 10); // 1-indexed
		const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

		// 2. Fetch active residents of these properties who checked in on or before monthEnd
		const residents = await prisma.resident.findMany({
			where: {
				propertyId: { in: propertyIds },
				status: "ACTIVE",
				checkInDate: { lte: monthEnd },
			},
			select: {
				id: true,
				name: true,
				propertyId: true,
				monthlyRent: true,
				checkInDate: true,
			},
		});

		if (residents.length === 0) {
			return NextResponse.json({
				success: true,
				createdCount: 0,
				skippedCount: 0,
				billingPeriod,
				message: `No active residents found eligible for billing period ${formatBillingPeriod(billingPeriod)}.`,
			});
		}

		// 3. Find existing rent charges for this period to prevent duplicate creation
		const residentIds = residents.map((r) => r.id);
		const existingCharges = await prisma.rentCharge.findMany({
			where: {
				billingPeriod,
				residentId: { in: residentIds },
			},
			select: { residentId: true },
		});

		const existingResidentIdSet = new Set(
			existingCharges.map((c) => c.residentId)
		);

		const toCreateResidents = residents.filter(
			(r) => !existingResidentIdSet.has(r.id)
		);

		let createdCount = 0;
		if (toCreateResidents.length > 0) {
			// Create charges inside a transaction
			await prisma.$transaction(
				toCreateResidents.map((resident) =>
					prisma.rentCharge.create({
						data: {
							residentId: resident.id,
							propertyId: resident.propertyId,
							billingPeriod,
							amount: Math.max(0, Math.round(resident.monthlyRent)),
							dueDate,
							notes: `Monthly Rent for ${formatBillingPeriod(billingPeriod)}`,
						},
					})
				)
			);
			createdCount = toCreateResidents.length;
		}

		const skippedCount = residents.length - createdCount;

		return NextResponse.json({
			success: true,
			createdCount,
			skippedCount,
			billingPeriod,
			dueDate: dueDate.toISOString(),
			message: `Generated ${createdCount} rent charge(s) for ${formatBillingPeriod(billingPeriod)} (${skippedCount} already existed and skipped).`,
		});
	} catch (error: any) {
		console.error("POST /api/user/rent/generate error:", error);
		return NextResponse.json(
			{ message: "Internal server error", error: error.message },
			{ status: 500 }
		);
	}
}
