import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { calculateRentSummary, generateReceiptNumber } from "@/libs/rentLedger";
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
		const {
			rentChargeId,
			amount: rawAmount,
			paymentMode,
			paymentDate: rawPaymentDate,
			referenceNumber,
			notes,
		} = body;

		if (!rentChargeId || typeof rentChargeId !== "string") {
			return NextResponse.json(
				{ message: "A valid rent charge ID is required." },
				{ status: 400 }
			);
		}

		// Amount must be a positive integer
		const amount = Math.round(Number(rawAmount));
		if (isNaN(amount) || amount <= 0) {
			return NextResponse.json(
				{ message: "Payment amount must be a positive whole INR number." },
				{ status: 400 }
			);
		}

		const validModes = ["CASH", "UPI", "BANK_TRANSFER"];
		if (!paymentMode || !validModes.includes(paymentMode)) {
			return NextResponse.json(
				{
					message:
						"Payment mode must be one of: Cash (CASH), UPI (UPI), or Bank Transfer (BANK_TRANSFER).",
				},
				{ status: 400 }
			);
		}

		const paymentDate = rawPaymentDate ? new Date(rawPaymentDate) : new Date();
		if (isNaN(paymentDate.getTime())) {
			return NextResponse.json(
				{ message: "Invalid payment date format." },
				{ status: 400 }
			);
		}

		// Execute payment recording within a safe database transaction with concurrency protection
		const result = await prisma.$transaction(async (tx) => {
			// 1. Fetch rent charge with property and existing payments
			const charge = await tx.rentCharge.findUnique({
				where: { id: rentChargeId },
				include: {
					property: { select: { id: true, ownerId: true, name: true } },
					payments: { select: { id: true, amount: true } },
					resident: {
						select: {
							id: true,
							name: true,
							phone: true,
						},
					},
				},
			});

			if (!charge) {
				throw new Error("NOT_FOUND: Rent charge does not exist.");
			}

			// 2. Ownership verification: Charge must belong to the authenticated owner's property
			if (charge.property.ownerId !== session.user.id) {
				throw new Error(
					"FORBIDDEN: You do not have permission to record payments for this property."
				);
			}

			// 3. Ledger balance verification
			const existingPaid = charge.payments.reduce(
				(sum, p) => sum + p.amount,
				0
			);
			const remainingBalance = Math.max(0, charge.amount - existingPaid);

			if (remainingBalance <= 0) {
				throw new Error(
					"SETTLED: This rent charge has already been completely settled."
				);
			}

			if (amount > remainingBalance) {
				throw new Error(
					`OVERPAYMENT: Payment amount (₹${amount.toLocaleString(
						"en-IN"
					)}) exceeds remaining balance of ₹${remainingBalance.toLocaleString(
						"en-IN"
					)}.`
				);
			}

			// 4. Generate unique receipt number
			let receiptNumber = generateReceiptNumber(charge.billingPeriod);
			// Guarantee uniqueness
			let isUnique = false;
			let attempts = 0;
			while (!isUnique && attempts < 5) {
				const existingReceipt = await tx.paymentRecord.findUnique({
					where: { receiptNumber },
					select: { id: true },
				});
				if (!existingReceipt) {
					isUnique = true;
				} else {
					receiptNumber = generateReceiptNumber(charge.billingPeriod);
					attempts++;
				}
			}

			// 5. Create Payment Record
			const payment = await tx.paymentRecord.create({
				data: {
					rentChargeId: charge.id,
					amount,
					paymentDate,
					paymentMode,
					referenceNumber: referenceNumber?.trim() || null,
					notes: notes?.trim() || null,
					receiptNumber,
					recordedById: session.user.id,
				},
				include: {
					recordedBy: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			});

			// 6. Calculate new summary after this payment
			const allPayments = [...charge.payments, { amount: payment.amount }];
			const newSummary = calculateRentSummary({
				amount: charge.amount,
				dueDate: charge.dueDate,
				payments: allPayments,
			});

			return {
				payment,
				charge: {
					id: charge.id,
					residentName: charge.resident.name,
					billingPeriod: charge.billingPeriod,
					propertyName: charge.property.name,
				},
				summary: newSummary,
			};
		});

		return NextResponse.json({
			success: true,
			message: `Payment of ₹${amount.toLocaleString(
				"en-IN"
			)} recorded successfully. Receipt #${result.payment.receiptNumber} generated.`,
			payment: result.payment,
			summary: result.summary,
		});
	} catch (error: any) {
		const msg = error.message || "";
		if (msg.startsWith("NOT_FOUND:")) {
			return NextResponse.json(
				{ message: msg.replace("NOT_FOUND: ", "") },
				{ status: 404 }
			);
		}
		if (msg.startsWith("FORBIDDEN:")) {
			return NextResponse.json(
				{ message: msg.replace("FORBIDDEN: ", "") },
				{ status: 403 }
			);
		}
		if (msg.startsWith("SETTLED:") || msg.startsWith("OVERPAYMENT:")) {
			return NextResponse.json(
				{
					message: msg.replace("SETTLED: ", "").replace("OVERPAYMENT: ", ""),
				},
				{ status: 400 }
			);
		}

		console.error("POST /api/user/rent/payments error:", error);
		return NextResponse.json(
			{ message: "Internal server error", error: error.message },
			{ status: 500 }
		);
	}
}
