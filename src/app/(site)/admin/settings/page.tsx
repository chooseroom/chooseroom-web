import { requireAdminSession } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import AdminSettingsView from "@/components/Admin/Settings/AdminSettingsView";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Settings",
	description:
		"Platform governance, security controls, and admin profile settings",
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
	const { admin } = await requireAdminSession();

	const [dbUser, adminCount, ownerCount, auditCount] = await Promise.all([
		prisma.user.findUnique({
			where: { email: admin.email || undefined },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				createdAt: true,
			},
		}),
		prisma.user.count({ where: { role: "ADMIN" } }),
		prisma.user.count({ where: { role: "BUSINESS_OWNER" } }),
		prisma.adminAuditLog.count(),
	]);

	const adminProfile = {
		id: dbUser?.id || admin.id,
		name: dbUser?.name || "Admin",
		email: dbUser?.email || admin.email || "",
		role: dbUser?.role || "ADMIN",
		status: dbUser?.status || "ACTIVE",
		createdAt: dbUser?.createdAt
			? dbUser.createdAt.toISOString()
			: new Date().toISOString(),
	};

	return (
		<div className='space-y-5 pb-10 sm:space-y-6'>
			{/* Clean Page Title */}
			<div>
				<h1 className='font-satoshi text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl'>
					Settings
				</h1>
				<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Platform governance, security controls, and admin profile settings.
				</p>
			</div>

			{/* Settings View */}
			<AdminSettingsView
				adminProfile={adminProfile}
				stats={{
					adminCount,
					ownerCount,
					auditCount,
				}}
			/>
		</div>
	);
}
