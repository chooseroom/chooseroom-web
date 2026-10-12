import PropertySetupWizard from "@/components/User/Setup/PropertySetupWizard";
import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "PG/Hostel Setup",
	description:
		"First-time property setup wizard for Choose Ghar PG and hostel owners.",
};

export const dynamic = "force-dynamic";

export default async function PropertySetupPage() {
	// 1. Authoritative session verification
	const session = await getAuthSession();

	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	// 2. Role safety: Admins never go through owner onboarding
	if (session.user.role === "ADMIN") {
		redirect("/admin");
	}

	// 3. Authoritative database verification
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			name: true,
			role: true,
			status: true,
			setupCompleted: true,
		},
	});

	if (!dbUser) {
		redirect("/auth/signin");
	}

	if (dbUser.status === "SUSPENDED") {
		redirect("/auth/signin?error=AccountSuspended");
	}

	// 4. If owner already completed property setup, redirect directly to dashboard
	if (dbUser.setupCompleted) {
		redirect("/user");
	}

	return (
		<main className='min-h-screen bg-[#FBF9F5] px-4 py-6 dark:bg-[#0E1713] sm:px-6 lg:px-8'>
			<PropertySetupWizard ownerName={dbUser.name || "Owner"} />
		</main>
	);
}
