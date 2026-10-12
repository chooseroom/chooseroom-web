"use client";

import { Card, CardContent } from "@/components/Common/UI";
import { useEffect, useMemo, useState } from "react";

export interface LogItem {
	id: string;
	adminId: string;
	adminEmail: string;
	action: string;
	targetId: string | null;
	targetEmail: string | null;
	details: string | null;
	ipAddress: string | null;
	createdAt: string | Date;
}

interface ActivityLogViewerProps {
	initialLogs: LogItem[];
}

export default function ActivityLogViewer({
	initialLogs,
}: ActivityLogViewerProps) {
	const [logs] = useState<LogItem[]>(initialLogs);
	const [actionFilter, setActionFilter] = useState<string>("ALL");
	const [searchQuery, setSearchQuery] = useState<string>("");

	// Pagination (Strictly 10 per page)
	const [currentPage, setCurrentPage] = useState<number>(1);
	const pageSize = 10;

	// Filter & Search Logic
	const filteredLogs = useMemo(() => {
		return logs.filter((log) => {
			if (actionFilter !== "ALL" && log.action !== actionFilter) {
				return false;
			}
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const adminMatch = (log.adminEmail || "").toLowerCase().includes(query);
				const targetMatch = (log.targetEmail || "")
					.toLowerCase()
					.includes(query);
				const detailsMatch = (log.details || "").toLowerCase().includes(query);
				const actionMatch = log.action.toLowerCase().includes(query);
				return adminMatch || targetMatch || detailsMatch || actionMatch;
			}
			return true;
		});
	}, [logs, actionFilter, searchQuery]);

	// Reset page when filters change
	useEffect(() => {
		setCurrentPage(1);
	}, [actionFilter, searchQuery]);

	// Paginated subset
	const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
	const paginatedLogs = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredLogs.slice(start, start + pageSize);
	}, [filteredLogs, currentPage, pageSize]);

	return (
		<div className='space-y-4 sm:space-y-5'>
			{/* Filter Controls */}
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				<div className='relative w-full sm:max-w-xs md:max-w-sm'>
					<span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400'>
						<svg
							className='size-4'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
							/>
						</svg>
					</span>
					<input
						type='text'
						placeholder='Search audit events...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full rounded-xl border border-[#E8E3D8] bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-white sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm'
					/>
				</div>

				<select
					id='action-filter'
					value={actionFilter}
					onChange={(e) => setActionFilter(e.target.value)}
					aria-label='Filter by action type'
					className='w-full rounded-xl border border-[#E8E3D8] bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-slate-200 sm:w-auto sm:px-3 sm:py-2'
				>
					<option value='ALL'>All Actions</option>
					<option value='SUSPEND_OWNER'>Suspend Owner</option>
					<option value='ACTIVATE_OWNER'>Activate Owner</option>
					<option value='ADMIN_PASSWORD_CHANGE'>Admin Password Change</option>
					<option value='UPDATE_OWNER'>Update Owner</option>
				</select>
			</div>

			{/* Logs Table */}
			<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
				<CardContent className='p-0'>
					{filteredLogs.length === 0 ? (
						<div className='px-4 py-10 text-center sm:py-14'>
							<div className='mx-auto flex size-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 sm:size-12'>
								<svg
									className='size-5 sm:size-6'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
									/>
								</svg>
							</div>
							<h3 className='mt-3 font-satoshi text-sm font-bold text-slate-900 dark:text-white'>
								{searchQuery || actionFilter !== "ALL"
									? "No audit records match the filter"
									: "No Activity Logs Recorded Yet"}
							</h3>
							<p className='mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400'>
								Privileged administrative actions such as account suspensions,
								reactivations, and security updates will be logged here.
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-sm'>
								<thead className='border-b border-[#E8E3D8] bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-slate-400'>
									<tr>
										<th className='px-5 py-3.5'>Timestamp</th>
										<th className='px-5 py-3.5'>Action</th>
										<th className='px-5 py-3.5'>Admin</th>
										<th className='px-5 py-3.5'>Target Account</th>
										<th className='px-5 py-3.5'>Details</th>
										<th className='px-5 py-3.5 text-right'>IP Address</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-[#E8E3D8] dark:divide-[#1E382B]'>
									{paginatedLogs.map((log) => {
										const isDestructive = log.action.includes("SUSPEND");
										const formattedAction =
											log.action === "SUSPEND_OWNER"
												? "Suspend Owner"
												: log.action === "ACTIVATE_OWNER"
													? "Activate Owner"
													: log.action === "ADMIN_PASSWORD_CHANGE"
														? "Password Change"
														: log.action === "UPDATE_OWNER"
															? "Update Owner"
															: log.action.replace(/_/g, " ");

										return (
											<tr
												key={log.id}
												className='transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
											>
												<td className='whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-600 dark:text-slate-400'>
													{new Date(log.createdAt).toLocaleString("en-IN", {
														day: "numeric",
														month: "short",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
													})}
												</td>

												<td className='whitespace-nowrap px-5 py-4'>
													<span
														className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
															isDestructive
																? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300"
																: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300"
														}`}
													>
														{formattedAction}
													</span>
												</td>

												<td className='whitespace-nowrap px-5 py-4 text-xs font-semibold text-slate-800 dark:text-slate-200'>
													{log.adminEmail}
												</td>

												<td className='whitespace-nowrap px-5 py-4 text-xs text-slate-700 dark:text-slate-300'>
													{log.targetEmail ||
														(log.targetId
															? `ID: ${log.targetId.slice(-8)}`
															: "-")}
												</td>

												<td className='max-w-xs truncate px-5 py-4 text-xs text-slate-600 dark:text-slate-400'>
													{log.details ||
														"Administrative modification executed"}
												</td>

												<td className='font-mono whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400'>
													{log.ipAddress || "Internal"}
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

			{/* Pagination Controls (Always visible when there are records, 10 per page) */}
			{filteredLogs.length > 0 && (
				<div className='flex flex-col gap-3 border-t border-[#E8E3D8] pt-4 dark:border-[#1E382B] sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-xs text-slate-500 dark:text-slate-400'>
						Showing{" "}
						<span className='font-semibold'>
							{(currentPage - 1) * pageSize + 1}
						</span>{" "}
						to{" "}
						<span className='font-semibold'>
							{Math.min(currentPage * pageSize, filteredLogs.length)}
						</span>{" "}
						of <span className='font-semibold'>{filteredLogs.length}</span>{" "}
						audit events (10 per page)
					</p>

					<div className='flex items-center gap-1.5'>
						<button
							type='button'
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
							className='rounded-lg border border-[#E8E3D8] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#1E382B] dark:text-slate-300 dark:hover:bg-[#0A1F17]'
						>
							Previous
						</button>

						{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
							<button
								key={page}
								type='button'
								onClick={() => setCurrentPage(page)}
								className={`size-8 rounded-lg text-xs font-semibold transition ${
									currentPage === page
										? "bg-emerald-700 text-white"
										: "border border-[#E8E3D8] text-slate-700 hover:bg-slate-50 dark:border-[#1E382B] dark:text-slate-300 dark:hover:bg-[#0A1F17]"
								}`}
							>
								{page}
							</button>
						))}

						<button
							type='button'
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
							className='rounded-lg border border-[#E8E3D8] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40 dark:border-[#1E382B] dark:text-slate-300 dark:hover:bg-[#0A1F17]'
						>
							Next
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
