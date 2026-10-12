/**
 * formatters.ts
 *
 * India-first formatting utilities for PG/Hostel Management.
 * Follows Indian currency formatting (Lakhs/Crores) and Indian phone number conventions.
 */

/**
 * Format a numeric amount into Indian Currency (₹ INR) format.
 * Example: 125000 -> "₹1,25,000"
 * Example: 4500 -> "₹4,500"
 */
export function formatINR(amount: number | null | undefined): string {
	if (amount === null || amount === undefined || isNaN(amount)) {
		return "₹0";
	}

	// Use standard Intl.NumberFormat with en-IN locale
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		maximumFractionDigits: 0,
	}).format(amount);
}

/**
 * Format an Indian 10-digit mobile number with standard spacing.
 * Example: "9876543210" -> "+91 98765 43210"
 */
export function formatIndianMobile(mobile: string | null | undefined): string {
	if (!mobile) return "";
	const cleaned = mobile.replace(/\D/g, "");
	if (cleaned.length === 10) {
		return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
	}
	if (cleaned.length === 12 && cleaned.startsWith("91")) {
		return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
	}
	return mobile;
}

/**
 * Clean and normalize a 10-digit Indian mobile number for storage or lookup.
 * Strips whitespace, dashes, and leading +91 / 0.
 */
export function normalizeIndianMobile(input: string): string {
	let cleaned = input.trim().replace(/\D/g, "");
	if (cleaned.startsWith("91") && cleaned.length === 12) {
		cleaned = cleaned.slice(2);
	} else if (cleaned.startsWith("0") && cleaned.length === 11) {
		cleaned = cleaned.slice(1);
	}
	return cleaned;
}
