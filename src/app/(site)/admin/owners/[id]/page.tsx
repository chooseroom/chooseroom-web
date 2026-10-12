import OwnerDetailActions from "@/components/Admin/Owners/OwnerDetailActions";
import { Badge, Card, CardContent } from "@/components/Common/UI";
import { requireAdminSession } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
	title: "Owner Profile",
};

export const dynamic = "force-dynamic";

interface OwnerDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function OwnerDetailPage({
	params,
}: OwnerDetailPageProps) {
	// 1. Strict Server-side Super Admin Guard
	await requireAdminSession();

	const { id } = await params;

	// 2. Query PG Owner from database (Strictly no passwords, hashes, or tokens)
	const owner = await prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			role: true,
			status: true,
			setupCompleted: true,
			emailVerified: true,
			createdAt: true,
		},
	});

	if (!owner || owner.role === "ADMIN") {
		return notFound();
	}

	// 3. Fetch administrative audit logs for this specific owner
	const auditLogs = await prisma.adminAuditLog.findMany({
		where: {
			OR: [
				{ targetId: owner.id },
				...(owner.email ? [{ targetEmail: owner.email }] : []),
			],
		},
		orderBy: { createdAt: "desc" },
		take: 10,
	});

	const initial = (owner.name?.[0] || owner.email?.[0] || "O").toUpperCase();
	const isSuspended = owner.status === "SUSPENDED";

	return (
		<div className='space-y-8 pb-12'>
			{/* Breadcrumb & Navigation */}
			<div className='flex flex-col justify-between gap-4 border-b border-[#E8E3D8] pb-6 dark:border-[#1E382B] sm:flex-row sm:items-center'>
				<div>
					<Link
						href='/admin/owners'
						className='mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline dark:text-emerald-400'
					>
						&larr; Back to Owners Directory
					</Link>
					<div className='flex items-center gap-3'>
						<h1 className='font-satoshi text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl'>
							{owner.name || "PG Owner Profile"}
						</h1>
						{isSuspended ? (
							<Badge variant='overdue' size='md' dot>
								Suspended
							</Badge>
						) : (
							<Badge variant='available' size='md' dot>
								Active Account
							</Badge>
						)}
					</div>
					<p className='font-mono mt-1 text-xs text-slate-500'>
						User ID: {owner.id}
					</p>
				</div>

				{/* Quick Actions Component */}
				<OwnerDetailActions
					ownerId={owner.id}
					ownerName={owner.name}
					currentStatus={owner.status}
				/>
			</div>

			{/* Details Grid */}
			<div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
				{/* Column 1 & 2: Main Profile & Onboarding */}
				<div className='space-y-6 lg:col-span-2'>
					{/* Profile Information Card */}
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-6'>
							<h2 className='border-b border-[#E8E3D8] pb-3 font-satoshi text-base font-bold text-slate-900 dark:border-[#1E382B] dark:text-white'>
								Identity & Contact Details
							</h2>

							<div className='mt-5 flex items-start gap-4'>
								<div className='flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A382B] to-[#10B981] text-xl font-bold text-white shadow-md'>
									{initial}
								</div>
								<div className='grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2'>
									<div>
										<p className='text-xs font-bold uppercase tracking-wider text-slate-400'>
											Full Name
										</p>
										<p className='mt-0.5 text-sm font-semibold text-slate-900 dark:text-white'>
											{owner.name || "Not provided"}
										</p>
									</div>

									<div>
										<p className='text-xs font-bold uppercase tracking-wider text-slate-400'>
											Mobile Number
										</p>
										<p className='mt-0.5 text-sm font-semibold text-slate-900 dark:text-white'>
											{owner.phone ? `+91 ${owner.phone}` : "Not provided"}
										</p>
									</div>

									<div>
										<p className='text-xs font-bold uppercase tracking-wider text-slate-400'>
											Email Address
										</p>
										<p className='mt-0.5 text-sm font-semibold text-slate-900 dark:text-white'>
											{owner.email || "Not provided"}
										</p>
									</div>

									<div>
										<p className='text-xs font-bold uppercase tracking-wider text-slate-400'>
											Registered Date
										</p>
										<p className='mt-0.5 text-sm font-semibold text-slate-900 dark:text-white'>
											{new Date(owner.createdAt).toLocaleString("en-IN", {
												day: "numeric",
												month: "long",
												year: "numeric",
												hour: "2-digit",
												minute: "2-digit",
											})}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Onboarding Checklist Card */}
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-6'>
							<h2 className='border-b border-[#E8E3D8] pb-3 font-satoshi text-base font-bold text-slate-900 dark:border-[#1E382B] dark:text-white'>
								Onboarding & Facility Verification
							</h2>

							<div className='mt-4 divide-y divide-[#E8E3D8] dark:divide-[#1E382B]'>
								<div className='flex items-center justify-between py-3'>
									<div>
										<p className='text-sm font-semibold text-slate-900 dark:text-white'>
											10-Digit Mobile Verification
										</p>
										<p className='text-xs text-slate-500'>
											Indian contact number for resident communication & rent
											notices
										</p>
									</div>
									{owner.phone ? (
										<Badge variant='available' size='sm' dot>
											Verified
										</Badge>
									) : (
										<Badge variant='pending' size='sm' dot>
											Pending
										</Badge>
									)}
								</div>

								<div className='flex items-center justify-between py-3'>
									<div>
										<p className='text-sm font-semibold text-slate-900 dark:text-white'>
											Email Verification
										</p>
										<p className='text-xs text-slate-500'>
											Email confirmed for billing and security resets
										</p>
									</div>
									{owner.emailVerified ? (
										<Badge variant='available' size='sm' dot>
											Verified
										</Badge>
									) : (
										<Badge variant='pending' size='sm' dot>
											Not Verified
										</Badge>
									)}
								</div>

								<div className='flex items-center justify-between py-3'>
									<div>
										<p className='text-sm font-semibold text-slate-900 dark:text-white'>
											PG Facility Setup Status
										</p>
										<p className='text-xs text-slate-500'>
											First property created with room capacity & pricing
											structure
										</p>
									</div>
									{owner.setupCompleted ? (
										<Badge variant='available' size='sm' dot>
											Completed
										</Badge>
									) : (
										<Badge variant='pending' size='sm' dot>
											Awaiting Facility Creation
										</Badge>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Column 3: Audit Trail & Security Info */}
				<div className='space-y-6'>
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-6'>
							<h2 className='border-b border-[#E8E3D8] pb-3 font-satoshi text-base font-bold text-slate-900 dark:border-[#1E382B] dark:text-white'>
								Administrative Audit Trail
							</h2>

							{auditLogs.length === 0 ? (
								<p className='py-6 text-center text-xs text-slate-500 dark:text-slate-400'>
									No administrative actions recorded for this owner.
								</p>
							) : (
								<div className='mt-4 divide-y divide-[#E8E3D8] dark:divide-[#1E382B]'>
									{auditLogs.map((log) => (
										<div key={log.id} className='py-3 text-xs'>
											<div className='flex items-center justify-between'>
												<span className='font-mono font-bold text-emerald-700 dark:text-emerald-400'>
													{log.action}
												</span>
												<span className='text-[11px] text-slate-400'>
													{new Date(log.createdAt).toLocaleDateString("en-IN", {
														day: "numeric",
														month: "short",
													})}
												</span>
											</div>
											<p className='mt-1 text-slate-700 dark:text-slate-300'>
												{log.details || "Status modified"}
											</p>
											<p className='mt-0.5 text-[11px] text-slate-400'>
												Admin: {log.adminEmail}
											</p>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Security Note Card */}
					<Card className='border-[#E8E3D8] bg-emerald-50/50 p-5 dark:border-[#1E382B] dark:bg-emerald-950/20'>
						<div className='flex gap-3'>
							<span className='text-emerald-700 dark:text-emerald-400'>
								<svg
									className='size-5'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
							</span>
							<div>
								<h3 className='text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200'>
									Security Protocol
								</h3>
								<p className='mt-1 text-xs leading-relaxed text-emerald-800 dark:text-emerald-300'>
									Passwords and authorization tokens are strictly omitted from
									administrative responses for zero-knowledge data protection.
								</p>
							</div>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
