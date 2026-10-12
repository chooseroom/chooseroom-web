import { Badge, Card, CardContent } from "@/components/Common/UI";
import { requireAdminSession } from "@/libs/adminAuth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Overview",
	description:
		"Platform administration and owner management console for Choose Ghar.",
};

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
	await requireAdminSession();

	const [
		totalOwners,
		setupCompletedCount,
		setupPendingCount,
		suspendedCount,
		recentOwners,
		recentLogs,
	] = await Promise.all([
		prisma.user.count({
			where: { role: { in: ["BUSINESS_OWNER", "USER"] } },
		}),
		prisma.user.count({
			where: {
				role: { in: ["BUSINESS_OWNER", "USER"] },
				setupCompleted: true,
			},
		}),
		prisma.user.count({
			where: {
				role: { in: ["BUSINESS_OWNER", "USER"] },
				setupCompleted: false,
			},
		}),
		prisma.user.count({
			where: {
				role: { in: ["BUSINESS_OWNER", "USER"] },
				status: "SUSPENDED",
			},
		}),
		prisma.user.findMany({
			where: { role: { in: ["BUSINESS_OWNER", "USER"] } },
			orderBy: { createdAt: "desc" },
			take: 10,
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				status: true,
				setupCompleted: true,
				createdAt: true,
			},
		}),
		prisma.adminAuditLog.findMany({
			orderBy: { createdAt: "desc" },
			take: 10,
		}),
	]);

	return (
		<div className='space-y-5 pb-10 sm:space-y-6'>
			{/* Clean Page Title */}
			<div>
				<h1 className='font-satoshi text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl'>
					Overview
				</h1>
				<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Live platform statistics and recent business owner registrations.
				</p>
			</div>

			{/* 4 Metric Cards - 2x2 Grid on Mobile, 4 Columns on Large Screens */}
			<div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4'>
				{/* Total Registered Owners */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
								Total PG Owners
							</span>
							<span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:size-8'>
								<svg
									className='size-3.5 sm:size-4'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
									/>
								</svg>
							</span>
						</div>
						<p className='mt-2 font-satoshi text-2xl font-extrabold text-slate-900 dark:text-white sm:mt-3 sm:text-3xl'>
							{totalOwners}
						</p>
						<p className='mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs'>
							Registered accounts
						</p>
					</CardContent>
				</Card>

				{/* Setup Completed */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
								Setup Completed
							</span>
							<span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:size-8'>
								<svg
									className='size-3.5 sm:size-4'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
							</span>
						</div>
						<p className='mt-2 font-satoshi text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 sm:mt-3 sm:text-3xl'>
							{setupCompletedCount}
						</p>
						<p className='mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs'>
							Onboarding finished
						</p>
					</CardContent>
				</Card>

				{/* Setup Pending */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
								Setup Pending
							</span>
							<span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 sm:size-8'>
								<svg
									className='size-3.5 sm:size-4'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
							</span>
						</div>
						<p className='mt-2 font-satoshi text-2xl font-extrabold text-amber-700 dark:text-amber-400 sm:mt-3 sm:text-3xl'>
							{setupPendingCount}
						</p>
						<p className='mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs'>
							Awaiting setup
						</p>
					</CardContent>
				</Card>

				{/* Suspended Accounts */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
								Suspended
							</span>
							<span className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 sm:size-8'>
								<svg
									className='size-3.5 sm:size-4'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
									/>
								</svg>
							</span>
						</div>
						<p className='mt-2 font-satoshi text-2xl font-extrabold text-rose-700 dark:text-rose-400 sm:mt-3 sm:text-3xl'>
							{suspendedCount}
						</p>
						<p className='mt-1 truncate text-[10px] text-slate-500 dark:text-slate-400 sm:text-xs'>
							Access restricted
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Recent Owner Registrations */}
			<div className='space-y-2.5 pt-1'>
				<div className='flex items-baseline justify-between gap-3'>
					<div className='min-w-0 flex-1'>
						<h2 className='truncate font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
							Recent Owner Registrations
						</h2>
						<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
							Latest 10 registered PG owners
						</p>
					</div>
					<Link
						href='/admin/owners'
						className='shrink-0 whitespace-nowrap text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline dark:text-emerald-400'
					>
						View All &rarr;
					</Link>
				</div>

				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-0'>
						{recentOwners.length === 0 ? (
							<div className='py-8 text-center sm:py-10'>
								<p className='font-satoshi text-sm font-semibold text-slate-800 dark:text-slate-200'>
									No PG Owners Registered Yet
								</p>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									New business owner signups will appear here automatically.
								</p>
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='w-full text-left text-sm'>
									<thead className='border-b border-[#E8E3D8] bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-slate-400'>
										<tr>
											<th className='px-4 py-3 sm:px-5 sm:py-3.5'>Owner</th>
											<th className='px-4 py-3 sm:px-5 sm:py-3.5'>Contact</th>
											<th className='px-4 py-3 sm:px-5 sm:py-3.5'>
												Registered
											</th>
											<th className='px-4 py-3 sm:px-5 sm:py-3.5'>Setup</th>
											<th className='px-4 py-3 sm:px-5 sm:py-3.5'>Status</th>
											<th className='px-4 py-3 text-right sm:px-5 sm:py-3.5'>
												Action
											</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-[#E8E3D8] dark:divide-[#1E382B]'>
										{recentOwners.map((owner) => {
											const isSuspended = owner.status === "SUSPENDED";
											return (
												<tr
													key={owner.id}
													className='transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
												>
													<td className='whitespace-nowrap px-4 py-3 sm:px-5 sm:py-3.5'>
														<p className='font-satoshi text-sm font-bold text-slate-900 dark:text-white'>
															{owner.name || "PG Owner"}
														</p>
														<p className='text-xs text-slate-500 dark:text-slate-400'>
															ID: {owner.id.slice(-8)}
														</p>
													</td>

													<td className='whitespace-nowrap px-4 py-3 sm:px-5 sm:py-3.5'>
														<p className='text-xs font-medium text-slate-800 dark:text-slate-200'>
															{owner.phone ? `+91 ${owner.phone}` : "No phone"}
														</p>
														<p className='text-xs text-slate-500 dark:text-slate-400'>
															{owner.email || "No email"}
														</p>
													</td>

													<td className='whitespace-nowrap px-4 py-3 text-xs text-slate-600 dark:text-slate-400 sm:px-5 sm:py-3.5'>
														{new Date(owner.createdAt).toLocaleDateString(
															"en-IN",
															{
																day: "numeric",
																month: "short",
																year: "numeric",
															}
														)}
													</td>

													<td className='whitespace-nowrap px-4 py-3 sm:px-5 sm:py-3.5'>
														{owner.setupCompleted ? (
															<Badge variant='available' size='sm' dot>
																Ready
															</Badge>
														) : (
															<Badge variant='pending' size='sm' dot>
																Pending
															</Badge>
														)}
													</td>

													<td className='whitespace-nowrap px-4 py-3 sm:px-5 sm:py-3.5'>
														{isSuspended ? (
															<Badge variant='overdue' size='sm' dot>
																Suspended
															</Badge>
														) : (
															<Badge variant='available' size='sm' dot>
																Active
															</Badge>
														)}
													</td>

													<td className='whitespace-nowrap px-4 py-3 text-right sm:px-5 sm:py-3.5'>
														<Link
															href={`/admin/owners/${owner.id}`}
															className='text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400'
														>
															View Profile
														</Link>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent Administrative Activity */}
			<div className='space-y-2.5 pt-1'>
				<div className='flex items-baseline justify-between gap-3'>
					<div className='min-w-0 flex-1'>
						<h2 className='truncate font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
							Recent Administrative Activity
						</h2>
						<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
							Latest 10 auditable administrative events
						</p>
					</div>
					<Link
						href='/admin/activity'
						className='shrink-0 whitespace-nowrap text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 hover:underline dark:text-emerald-400'
					>
						View All &rarr;
					</Link>
				</div>

				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-0'>
						{recentLogs.length === 0 ? (
							<div className='py-6 text-center text-xs text-slate-500 dark:text-slate-400 sm:py-8'>
								No administrative actions recorded yet.
							</div>
						) : (
							<div className='divide-y divide-[#E8E3D8] dark:divide-[#1E382B]'>
								{recentLogs.map((log) => {
									const isDestructive = log.action.includes("SUSPEND");
									return (
										<div
											key={log.id}
											className='flex flex-col gap-2 p-3.5 text-xs transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-4'
										>
											<div className='flex items-center gap-2.5 sm:gap-3'>
												<span
													className={`font-mono inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${
														isDestructive
															? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
															: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
													}`}
												>
													{log.action}
												</span>
												<span className='font-medium text-slate-700 dark:text-slate-300'>
													{log.details || "Administrative modification"}
												</span>
											</div>
											<div className='flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs'>
												<span>By: {log.adminEmail}</span>
												<span>
													{new Date(log.createdAt).toLocaleDateString("en-IN", {
														day: "numeric",
														month: "short",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
