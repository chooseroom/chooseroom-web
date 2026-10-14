"use client";

import { Badge, Button, Card, CardContent } from "@/components/Common/UI";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

export interface OwnerItem {
	id: string;
	name: string | null;
	email: string | null;
	phone: string | null;
	role: string | null;
	status: string;
	setupCompleted: boolean;
	createdAt: string | Date;
}

interface OwnersManagementProps {
	initialOwners: OwnerItem[];
}

export default function OwnersManagement({
	initialOwners,
}: OwnersManagementProps) {
	const router = useRouter();
	const [owners, setOwners] = useState<OwnerItem[]>(initialOwners);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "ACTIVE" | "SUSPENDED"
	>("ALL");
	const [setupFilter, setSetupFilter] = useState<
		"ALL" | "COMPLETED" | "PENDING"
	>("ALL");

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const pageSize = 10;

	// Modal State
	const [modalOwner, setModalOwner] = useState<OwnerItem | null>(null);
	const [modalAction, setModalAction] = useState<"SUSPEND" | "ACTIVATE">(
		"SUSPEND"
	);
	const [actionReason, setActionReason] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Filter & Search Logic
	const filteredOwners = useMemo(() => {
		return owners.filter((owner) => {
			// Status match
			if (statusFilter === "ACTIVE" && owner.status !== "ACTIVE") return false;
			if (statusFilter === "SUSPENDED" && owner.status !== "SUSPENDED")
				return false;

			// Setup match
			if (setupFilter === "COMPLETED" && !owner.setupCompleted) return false;
			if (setupFilter === "PENDING" && owner.setupCompleted) return false;

			// Search match (Name, Email, Phone)
			if (searchQuery.trim()) {
				const query = searchQuery.toLowerCase().trim();
				const nameMatch = (owner.name || "").toLowerCase().includes(query);
				const emailMatch = (owner.email || "").toLowerCase().includes(query);
				const phoneMatch = (owner.phone || "").toLowerCase().includes(query);
				return nameMatch || emailMatch || phoneMatch;
			}

			return true;
		});
	}, [owners, searchQuery, statusFilter, setupFilter]);

	// Reset page to 1 when filters or search change
	useEffect(() => {
		setCurrentPage(1);
	}, [searchQuery, statusFilter, setupFilter]);

	// Paginated subset (strictly 10 per page)
	const totalPages = Math.max(1, Math.ceil(filteredOwners.length / pageSize));
	const paginatedOwners = useMemo(() => {
		const start = (currentPage - 1) * pageSize;
		return filteredOwners.slice(start, start + pageSize);
	}, [filteredOwners, currentPage, pageSize]);

	// Open Confirmation Dialog
	const handleOpenConfirm = (
		owner: OwnerItem,
		action: "SUSPEND" | "ACTIVATE"
	) => {
		setModalOwner(owner);
		setModalAction(action);
		setActionReason("");
	};

	// Execute Status Change API
	const handleConfirmStatusChange = async () => {
		if (!modalOwner) return;

		setIsSubmitting(true);
		const targetStatus = modalAction === "SUSPEND" ? "SUSPENDED" : "ACTIVE";

		try {
			const res = await fetch("/api/admin/owners/status", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ownerId: modalOwner.id,
					status: targetStatus,
					reason: actionReason.trim() || undefined,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Failed to update owner status");
				return;
			}

			toast.success(
				data.message ||
					`Owner ${modalAction === "SUSPEND" ? "suspended" : "activated"} successfully`
			);

			// Update state locally
			setOwners((prev) =>
				prev.map((o) =>
					o.id === modalOwner.id ? { ...o, status: targetStatus } : o
				)
			);
			setModalOwner(null);
			router.refresh();
		} catch (error) {
			toast.error("An error occurred while connecting to server.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4 sm:space-y-5'>
			{/* Controls: Search, Filters */}
			<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
				{/* Search Bar */}
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
						placeholder='Search by name, email, or mobile...'
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
						className='w-full rounded-xl border border-[#E8E3D8] bg-white py-2 pl-9 pr-3 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-white sm:py-2.5 sm:pl-10 sm:pr-4 sm:text-sm'
					/>
				</div>

				{/* Filters: Status & Setup - 2-column grid on mobile, inline flex on desktop */}
				<div className='grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5'>
					{/* Account Status Filter */}
					<select
						id='status-filter'
						value={statusFilter}
						onChange={(e) => {
							setStatusFilter(e.target.value as any);
							setCurrentPage(1);
						}}
						aria-label='Filter by account status'
						className='w-full rounded-xl border border-[#E8E3D8] bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-slate-200 sm:w-auto sm:px-3 sm:py-2'
					>
						<option value='ALL'>All Statuses</option>
						<option value='ACTIVE'>Active Accounts</option>
						<option value='SUSPENDED'>Suspended</option>
					</select>

					{/* Setup Status Filter */}
					<select
						id='setup-filter'
						value={setupFilter}
						onChange={(e) => {
							setSetupFilter(e.target.value as any);
							setCurrentPage(1);
						}}
						aria-label='Filter by onboarding setup'
						className='w-full rounded-xl border border-[#E8E3D8] bg-white px-2.5 py-2 text-xs font-medium text-slate-700 outline-none transition-all focus:border-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-slate-200 sm:w-auto sm:px-3 sm:py-2'
					>
						<option value='ALL'>All Onboarding</option>
						<option value='COMPLETED'>Setup Completed</option>
						<option value='PENDING'>Setup Pending</option>
					</select>
				</div>
			</div>

			{/* Owners Table */}
			<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
				<CardContent className='p-0'>
					{paginatedOwners.length === 0 ? (
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
										d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
									/>
								</svg>
							</div>
							<h3 className='mt-3 font-satoshi text-sm font-bold text-slate-900 dark:text-white'>
								{searchQuery || statusFilter !== "ALL" || setupFilter !== "ALL"
									? "No PG Owners match the selected filters"
									: "No PG Owners registered yet"}
							</h3>
							<p className='mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400'>
								{searchQuery || statusFilter !== "ALL" || setupFilter !== "ALL"
									? "Try adjusting your search criteria or resetting filters."
									: "When Indian hostel and PG owners create accounts on ChooseBed, their details will be manageable here."}
							</p>
						</div>
					) : (
						<div className='overflow-x-auto'>
							<table className='w-full text-left text-sm'>
								<thead className='border-b border-[#E8E3D8] bg-slate-50/70 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-slate-400'>
									<tr>
										<th className='px-5 py-3.5'>Owner</th>
										<th className='px-5 py-3.5'>Mobile Number</th>
										<th className='px-5 py-3.5'>Email Address</th>
										<th className='px-5 py-3.5'>Registered Date</th>
										<th className='px-5 py-3.5'>Setup Status</th>
										<th className='px-5 py-3.5'>Account Status</th>
										<th className='px-5 py-3.5 text-right'>
											Administrative Actions
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-[#E8E3D8] dark:divide-[#1E382B]'>
									{paginatedOwners.map((owner) => {
										const isSuspended = owner.status === "SUSPENDED";
										const initial = (
											owner.name?.[0] ||
											owner.email?.[0] ||
											"O"
										).toUpperCase();

										return (
											<tr
												key={owner.id}
												className='transition-colors hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
											>
												<td className='whitespace-nowrap px-5 py-4'>
													<div className='flex items-center gap-3'>
														<div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A382B] to-[#10B981] text-xs font-bold text-white shadow-sm'>
															{initial}
														</div>
														<div>
															<p className='font-satoshi font-semibold text-slate-900 dark:text-white'>
																{owner.name || "Unnamed Owner"}
															</p>
															<p className='font-mono text-[11px] text-slate-400'>
																{owner.id}
															</p>
														</div>
													</div>
												</td>

												<td className='whitespace-nowrap px-5 py-4 text-xs font-medium text-slate-800 dark:text-slate-200'>
													{owner.phone ? (
														`+91 ${owner.phone}`
													) : (
														<span className='text-slate-400'>Not provided</span>
													)}
												</td>

												<td className='whitespace-nowrap px-5 py-4 text-xs text-slate-600 dark:text-slate-400'>
													{owner.email || (
														<span className='text-slate-400'>Not provided</span>
													)}
												</td>

												<td className='whitespace-nowrap px-5 py-4 text-xs text-slate-600 dark:text-slate-400'>
													{new Date(owner.createdAt).toLocaleDateString(
														"en-IN",
														{
															day: "numeric",
															month: "short",
															year: "numeric",
														}
													)}
												</td>

												<td className='whitespace-nowrap px-5 py-4'>
													{owner.setupCompleted ? (
														<Badge variant='available' size='sm' dot>
															Completed
														</Badge>
													) : (
														<Badge variant='pending' size='sm' dot>
															Pending
														</Badge>
													)}
												</td>

												<td className='whitespace-nowrap px-5 py-4'>
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

												<td className='whitespace-nowrap px-5 py-4 text-right'>
													<div className='flex items-center justify-end gap-2'>
														<Link href={`/admin/owners/${owner.id}`}>
															<Button variant='outline' size='sm'>
																View Profile
															</Button>
														</Link>

														{isSuspended ? (
															<button
																type='button'
																onClick={() =>
																	handleOpenConfirm(owner, "ACTIVATE")
																}
																className='rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
															>
																Reactivate
															</button>
														) : (
															<button
																type='button'
																onClick={() =>
																	handleOpenConfirm(owner, "SUSPEND")
																}
																className='rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400'
															>
																Suspend
															</button>
														)}
													</div>
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

			{/* Pagination Controls - Always Visible With Records (10 per page) */}
			{filteredOwners.length > 0 && (
				<div className='flex flex-col gap-3 border-t border-[#E8E3D8] pt-4 dark:border-[#1E382B] sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-xs text-slate-500 dark:text-slate-400'>
						Showing{" "}
						<span className='font-semibold'>
							{(currentPage - 1) * pageSize + 1}
						</span>{" "}
						to{" "}
						<span className='font-semibold'>
							{Math.min(currentPage * pageSize, filteredOwners.length)}
						</span>{" "}
						of <span className='font-semibold'>{filteredOwners.length}</span> PG
						Owners (10 per page)
					</p>

					<div className='flex items-center gap-1.5'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
							disabled={currentPage === 1}
						>
							Previous
						</Button>

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

						<Button
							variant='outline'
							size='sm'
							onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
							disabled={currentPage === totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}

			{/* Confirmation Modal */}
			{modalOwner && (
				<div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
					<div className='w-full max-w-md rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-2xl dark:border-[#1E382B] dark:bg-[#071711]'>
						<div className='flex items-center gap-3'>
							<div
								className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
									modalAction === "SUSPEND"
										? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
										: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
								}`}
							>
								{modalAction === "SUSPEND" ? (
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
											d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
										/>
									</svg>
								) : (
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
											d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
										/>
									</svg>
								)}
							</div>
							<div>
								<h3 className='font-satoshi text-base font-bold text-slate-900 dark:text-white'>
									{modalAction === "SUSPEND"
										? "Suspend PG Owner Account"
										: "Reactivate PG Owner Account"}
								</h3>
								<p className='text-xs text-slate-500 dark:text-slate-400'>
									{modalOwner.name || modalOwner.email} (
									{modalOwner.phone || "No phone"})
								</p>
							</div>
						</div>

						<p className='mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300'>
							{modalAction === "SUSPEND"
								? "Are you sure you want to suspend this PG Owner? Suspended owners are immediately blocked at authentication and middleware, and cannot log in or access protected PG operations."
								: "Reactivating this account will restore immediate login and operational access to ChooseBed."}
						</p>

						<div className='mt-4'>
							<label
								htmlFor='action-reason'
								className='block text-xs font-semibold text-slate-700 dark:text-slate-300'
							>
								Reason / Administrative Note (Audited):
							</label>
							<input
								id='action-reason'
								type='text'
								placeholder={
									modalAction === "SUSPEND"
										? "e.g., Unverified documents or non-compliance"
										: "e.g., Verification cleared"
								}
								value={actionReason}
								onChange={(e) => setActionReason(e.target.value)}
								className='mt-1 w-full rounded-xl border border-[#E8E3D8] bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-white'
							/>
						</div>

						<div className='mt-6 flex items-center justify-end gap-3'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setModalOwner(null)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<button
								type='button'
								onClick={handleConfirmStatusChange}
								disabled={isSubmitting}
								className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 ${
									modalAction === "SUSPEND"
										? "bg-rose-600 hover:bg-rose-700"
										: "bg-emerald-600 hover:bg-emerald-700"
								}`}
							>
								{isSubmitting
									? "Processing..."
									: modalAction === "SUSPEND"
										? "Confirm Suspension"
										: "Confirm Activation"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
