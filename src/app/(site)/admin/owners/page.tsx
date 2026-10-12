import OwnersManagement from "@/components/Admin/Owners/OwnersManagement";
import { requireAdminSession } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "PG Owners",
	description: "Directory of registered PG and hostel business owners.",
};

export const dynamic = "force-dynamic";

export default async function AdminOwnersPage() {
	// Server-side Super Admin guard
	await requireAdminSession();

	// Fetch business owners from database (strictly excluding passwords, hashes, and secrets)
	const owners = await prisma.user.findMany({
		where: {
			role: { in: ["BUSINESS_OWNER", "USER"] },
		},
		orderBy: { createdAt: "desc" },
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			role: true,
			status: true,
			setupCompleted: true,
			createdAt: true,
		},
	});

	return (
		<div className='space-y-5 pb-10 sm:space-y-6'>
			{/* Clean Page Title */}
			<div>
				<h1 className='font-satoshi text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl'>
					PG Owners
				</h1>
				<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Directory of registered PG and hostel business owners.
				</p>
			</div>

			{/* Interactive Management Component */}
			<OwnersManagement initialOwners={JSON.parse(JSON.stringify(owners))} />
		</div>
	);
}
