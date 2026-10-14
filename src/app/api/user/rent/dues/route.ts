import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import {
	calculateRentSummary,
	getBillingPeriodString,
} from "@/libs/rentLedger";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
		const billingPeriodParam = searchParams.get("billingPeriod")?.trim();
		const billingPeriod = billingPeriodParam || getBillingPeriodString();
		const searchQuery = searchParams.get("search")?.trim().toLowerCase();
		const statusFilter = searchParams.get("status")?.trim().toUpperCase();

		// Base filter: only rent charges belonging to properties owned by this owner
		const whereClause: any = {
			property: {
				ownerId: session.user.id,
			},
		};

		if (propertyId && propertyId !== "ALL") {
			whereClause.propertyId = propertyId;
		}

		if (billingPeriod && billingPeriod !== "ALL") {
			whereClause.billingPeriod = billingPeriod;
		}

		const rawCharges = await prisma.rentCharge.findMany({
			where: whereClause,
			include: {
				resident: {
					select: {
						id: true,
						name: true,
						phone: true,
						guardianName: true,
						guardianPhone: true,
						monthlyRent: true,
						securityDeposit: true,
						status: true,
						checkInDate: true,
						checkOutDate: true,
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
							},
						},
					},
				},
				property: {
					select: {
						id: true,
						name: true,
						type: true,
						gender: true,
						city: true,
						area: true,
						address: true,
					},
				},
				payments: {
					orderBy: { paymentDate: "desc" },
					include: {
						recordedBy: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
			},
			orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
		});

		// Calculate deterministic ledger summaries
		const now = new Date();
		const formattedCharges = rawCharges.map((charge) => {
			const summary = calculateRentSummary(charge, now);
			return {
				...charge,
				summary,
			};
		});

		// Apply search filter if present (by resident name, phone, or room number)
		let filtered = formattedCharges;
		if (searchQuery) {
			filtered = filtered.filter((c) => {
				const residentName = c.resident?.name?.toLowerCase() || "";
				const residentPhone = c.resident?.phone?.toLowerCase() || "";
				const roomNo = c.resident?.room?.roomNumber?.toLowerCase() || "";
				const bedNo = String(c.resident?.bed?.bedNumber ?? "");
				return (
					residentName.includes(searchQuery) ||
					residentPhone.includes(searchQuery) ||
					roomNo.includes(searchQuery) ||
					bedNo.includes(searchQuery)
				);
			});
		}

		// Apply status filter if present
		if (statusFilter && statusFilter !== "ALL") {
			if (statusFilter === "PARTIALLY_PAID") {
				filtered = filtered.filter((c) => c.summary.isPartiallyPaid);
			} else if (statusFilter === "OVERDUE") {
				filtered = filtered.filter((c) => c.summary.isOverdue);
			} else {
				filtered = filtered.filter((c) => c.summary.status === statusFilter);
			}
		}

		// Calculate aggregates for current view
		let totalBilled = 0;
		let totalCollected = 0;
		let totalOutstanding = 0;
		let totalOverdue = 0;
		let countPending = 0;
		let countPartiallyPaid = 0;
		let countPaid = 0;
		let countOverdue = 0;

		formattedCharges.forEach((c) => {
			totalBilled += c.summary.totalAmount;
			totalCollected += c.summary.totalPaid;
			totalOutstanding += c.summary.remainingBalance;
			if (c.summary.isOverdue) {
				totalOverdue += c.summary.remainingBalance;
				countOverdue++;
			}
			if (c.summary.status === "PAID") {
				countPaid++;
			} else if (c.summary.status === "PENDING") {
				countPending++;
			} else if (c.summary.status === "PARTIALLY_PAID") {
				countPartiallyPaid++;
			}
		});

		return NextResponse.json({
			billingPeriod,
			charges: filtered,
			stats: {
				totalCharges: formattedCharges.length,
				totalBilled,
				totalCollected,
				totalOutstanding,
				totalOverdue,
				counts: {
					all: formattedCharges.length,
					pending: countPending,
					partiallyPaid: countPartiallyPaid,
					paid: countPaid,
					overdue: countOverdue,
				},
			},
		});
	} catch (error: any) {
		console.error("GET /api/user/rent/dues error:", error);
		return NextResponse.json(
			{ message: "Internal server error", error: error.message },
			{ status: 500 }
		);
	}
}
