import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import RentLedgerClient from "@/components/User/Billing/RentLedgerClient";
import { getBillingPeriodString } from "@/libs/rentLedger";

export const metadata: Metadata = {
	title: "Rent & Dues Ledger | ChooseBed",
	description:
		"Track monthly rent charges, record UPI/Cash/Bank payments, and issue printable digital receipts.",
};

export const dynamic = "force-dynamic";

export default async function BillingPage() {
	// 1. Authoritative session verification
	const session = await getAuthSession();
	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	if (session.user.role === "ADMIN") {
		redirect("/admin");
	}

	// 2. Query user, account status, and registered properties
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			name: true,
			email: true,
			status: true,
			setupCompleted: true,
			properties: {
				orderBy: { createdAt: "asc" },
				select: {
					id: true,
					name: true,
					city: true,
					area: true,
					type: true,
					gender: true,
				},
			},
		},
	});

	if (!dbUser) {
		redirect("/auth/signin");
	}

	if (dbUser.status === "SUSPENDED") {
		redirect("/auth/signin?error=AccountSuspended");
	}

	if (!dbUser.setupCompleted || dbUser.properties.length === 0) {
		redirect("/user/setup");
	}

	const currentBillingPeriod = getBillingPeriodString();

	return (
		<RentLedgerClient
			properties={dbUser.properties}
			currentBillingPeriod={currentBillingPeriod}
			currentUser={{
				id: dbUser.id,
				name: dbUser.name || "Owner",
				email: dbUser.email || "",
			}}
		/>
	);
}
