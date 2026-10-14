/**
 * rentLedger.ts
 *
 * Core financial domain logic for ChooseBed Rent & Dues Ledger.
 * Provides deterministic status derivation, ledger calculations,
 * billing period helpers, and safe receipt generation.
 *
 * Rules:
 * 1. Integer INR math only. Zero floating-point drift.
 * 2. Security deposits on residents are strictly isolated from rent collections.
 * 3. Status Precedence:
 *    - PAID: remainingBalance <= 0
 *    - OVERDUE: remainingBalance > 0 && now > dueDate
 *    - PARTIALLY_PAID: remainingBalance > 0 && totalPaid > 0 && now <= dueDate
 *    - PENDING: remainingBalance > 0 && totalPaid === 0 && now <= dueDate
 */

import crypto from "crypto";

export type RentStatus = "PAID" | "PARTIALLY_PAID" | "PENDING" | "OVERDUE";

export interface RentChargeCalculation {
	totalAmount: number;
	totalPaid: number;
	remainingBalance: number;
	status: RentStatus;
	isFullyPaid: boolean;
	isPartiallyPaid: boolean;
	isOverdue: boolean;
}

/**
 * Calculates deterministic ledger numbers for a rent charge and its recorded payments.
 */
export function calculateRentSummary(
	charge: {
		amount: number;
		dueDate: Date | string;
		payments?: Array<{ amount: number }>;
	},
	currentDate: Date = new Date()
): RentChargeCalculation {
	const totalAmount = Math.max(0, Math.round(charge.amount || 0));
	const payments = charge.payments || [];
	const totalPaid = payments.reduce(
		(sum, p) => sum + Math.max(0, Math.round(p.amount || 0)),
		0
	);
	const remainingBalance = Math.max(0, totalAmount - totalPaid);

	const dueDateTime = new Date(charge.dueDate).getTime();
	const currentDateTime = currentDate.getTime();
	const isPastDue = currentDateTime > dueDateTime;

	let status: RentStatus = "PENDING";
	if (remainingBalance <= 0 && totalAmount > 0) {
		status = "PAID";
	} else if (remainingBalance <= 0 && totalAmount === 0) {
		status = "PAID";
	} else if (isPastDue) {
		status = "OVERDUE";
	} else if (totalPaid > 0) {
		status = "PARTIALLY_PAID";
	} else {
		status = "PENDING";
	}

	return {
		totalAmount,
		totalPaid,
		remainingBalance,
		status,
		isFullyPaid: remainingBalance <= 0,
		isPartiallyPaid: totalPaid > 0 && remainingBalance > 0,
		isOverdue: isPastDue && remainingBalance > 0,
	};
}

/**
 * Returns formatted "YYYY-MM" billing period string from a date.
 */
export function getBillingPeriodString(date: Date = new Date()): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	return `${year}-${month}`;
}

/**
 * Returns a human-readable billing period string, e.g. "October 2026".
 */
export function formatBillingPeriod(billingPeriod: string): string {
	if (!billingPeriod || !billingPeriod.includes("-")) return billingPeriod;
	const [yearStr, monthStr] = billingPeriod.split("-");
	const year = parseInt(yearStr, 10);
	const month = parseInt(monthStr, 10) - 1;
	if (isNaN(year) || isNaN(month) || month < 0 || month > 11)
		return billingPeriod;

	const date = new Date(year, month, 1);
	return date.toLocaleDateString("en-IN", {
		month: "long",
		year: "numeric",
	});
}

/**
 * Compute the default due date for a billing period.
 * By default: the 5th day of the billing month at 23:59:59.
 */
export function getDefaultDueDate(
	billingPeriod: string,
	dueDay: number = 5
): Date {
	const [yearStr, monthStr] = billingPeriod.split("-");
	const year = parseInt(yearStr, 10) || new Date().getFullYear();
	const month = (parseInt(monthStr, 10) || 1) - 1;
	const day = Math.min(Math.max(1, dueDay), 28);
	return new Date(Date.UTC(year, month, day, 18, 29, 59, 999)); // 23:59:59 IST is 18:29:59 UTC
}

/**
 * Generate a unique and tamper-proof receipt reference number.
 * Format: RCP-YYYYMM-XXXXX (e.g. RCP-202610-7B3E9)
 */
export function generateReceiptNumber(billingPeriod: string): string {
	const cleanPeriod = (billingPeriod || getBillingPeriodString()).replace(
		"-",
		""
	);
	const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
	return `RCP-${cleanPeriod}-${randomSuffix}`;
}
