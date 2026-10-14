import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { calculateRentSummary } from "@/libs/rentLedger";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(
	request: Request,
	context: { params: Promise<{ paymentId: string }> }
) {
	try {
		const session = await getAuthSession();
		if (!session?.user?.id) {
			return NextResponse.json(
				{ message: "Authentication required" },
				{ status: 401 }
			);
		}

		const { paymentId } = await context.params;
		if (!paymentId) {
			return NextResponse.json(
				{ message: "Payment ID is required" },
				{ status: 400 }
			);
		}

		const body = await request.json().catch(() => ({}));
		const reason = (body.reason as string)?.trim() || "Entry error";

		// Auditable payment reversal inside a transaction:
		// We do NOT delete the record; we void it to ₹0 with an immutable audit trail
		const result = await prisma.$transaction(async (tx) => {
			const payment = await tx.paymentRecord.findUnique({
				where: { id: paymentId },
				include: {
					rentCharge: {
						include: {
							property: { select: { id: true, ownerId: true } },
							payments: { select: { id: true, amount: true } },
						},
					},
					recordedBy: { select: { id: true, name: true, email: true } },
				},
			});

			if (!payment) {
				throw new Error("NOT_FOUND: Payment record not found.");
			}

			if (payment.rentCharge.property.ownerId !== session.user.id) {
				throw new Error("FORBIDDEN: You do not own this property.");
			}

			if (payment.amount === 0) {
				throw new Error(
					"ALREADY_VOID: This payment has already been voided/reversed."
				);
			}

			const originalAmount = payment.amount;
			const timestamp = new Date().toISOString();
			const updatedNotes = `[VOIDED/REVERSED on ${timestamp} by ${
				session.user.name || session.user.email
			}]: Reason: ${reason}. Original Amount: ₹${originalAmount}.\n${
				payment.notes || ""
			}`.trim();

			const voidedPayment = await tx.paymentRecord.update({
				where: { id: paymentId },
				data: {
					amount: 0,
					notes: updatedNotes,
				},
			});

			// Recompute summary
			const remainingPayments = payment.rentCharge.payments.map((p) =>
				p.id === paymentId ? { amount: 0 } : { amount: p.amount }
			);

			const newSummary = calculateRentSummary({
				amount: payment.rentCharge.amount,
				dueDate: payment.rentCharge.dueDate,
				payments: remainingPayments,
			});

			return {
				voidedPayment,
				originalAmount,
				newSummary,
			};
		});

		return NextResponse.json({
			success: true,
			message: `Payment #${result.voidedPayment.receiptNumber} of ₹${result.originalAmount} has been audibly reversed and voided. Outstanding balance restored.`,
			payment: result.voidedPayment,
			summary: result.newSummary,
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
		if (msg.startsWith("ALREADY_VOID:")) {
			return NextResponse.json(
				{ message: msg.replace("ALREADY_VOID: ", "") },
				{ status: 400 }
			);
		}
		console.error("DELETE /api/user/rent/payments/[paymentId] error:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
