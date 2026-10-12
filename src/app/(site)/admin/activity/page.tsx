import { requireAdminSession } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import ActivityLogViewer, {
	LogItem,
} from "@/components/Admin/Activity/ActivityLogViewer";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Activity & Security",
	description: "Privileged actions audit trail and security log",
};

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
	await requireAdminSession();

	const rawLogs = await prisma.adminAuditLog.findMany({
		orderBy: {
			createdAt: "desc",
		},
		take: 100,
	});

	const logs: LogItem[] = rawLogs.map((log: any) => ({
		id: log.id,
		adminId: log.adminId,
		adminEmail: log.adminEmail,
		action: log.action,
		targetId: log.targetId,
		targetEmail: log.targetEmail,
		details: log.details,
		ipAddress: log.ipAddress,
		createdAt: log.createdAt.toISOString(),
	}));

	return (
		<div className='space-y-5 pb-10 sm:space-y-6'>
			{/* Clean Page Title */}
			<div>
				<h1 className='font-satoshi text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl'>
					Activity & Security
				</h1>
				<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Audit trail of administrative actions and security events.
				</p>
			</div>

			{/* Interactive Logs Viewer */}
			<ActivityLogViewer initialLogs={logs} />
		</div>
	);
}
