"use client";

import { Button } from "@/components/Common/UI";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface OwnerDetailActionsProps {
	ownerId: string;
	ownerName: string | null;
	currentStatus: string;
}

export default function OwnerDetailActions({
	ownerId,
	ownerName,
	currentStatus,
}: OwnerDetailActionsProps) {
	const router = useRouter();
	const [status, setStatus] = useState(currentStatus);
	const [showModal, setShowModal] = useState(false);
	const [actionType, setActionType] = useState<"SUSPEND" | "ACTIVATE">(
		"SUSPEND"
	);
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);

	const isSuspended = status === "SUSPENDED";

	const handleOpenConfirm = (action: "SUSPEND" | "ACTIVATE") => {
		setActionType(action);
		setReason("");
		setShowModal(true);
	};

	const handleExecuteStatusChange = async () => {
		setLoading(true);
		const targetStatus = actionType === "SUSPEND" ? "SUSPENDED" : "ACTIVE";

		try {
			const res = await fetch("/api/admin/owners/status", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					ownerId,
					status: targetStatus,
					reason: reason.trim() || undefined,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				toast.error(data.error || "Failed to update status");
				return;
			}

			toast.success(data.message || `Owner status updated to ${targetStatus}`);
			setStatus(targetStatus);
			setShowModal(false);
			router.refresh();
		} catch (error) {
			toast.error("Failed to communicate with server.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<>
			<div className='flex items-center gap-3'>
				{isSuspended ? (
					<button
						type='button'
						onClick={() => handleOpenConfirm("ACTIVATE")}
						className='rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
					>
						Reactivate Account
					</button>
				) : (
					<button
						type='button'
						onClick={() => handleOpenConfirm("SUSPEND")}
						className='rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-400'
					>
						Suspend Account
					</button>
				)}
			</div>

			{/* Confirmation Dialog */}
			{showModal && (
				<div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
					<div className='w-full max-w-md rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-2xl dark:border-[#1E382B] dark:bg-[#071711]'>
						<div className='flex items-center gap-3'>
							<div
								className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
									actionType === "SUSPEND"
										? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
										: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
								}`}
							>
								{actionType === "SUSPEND" ? (
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
									{actionType === "SUSPEND"
										? "Suspend Account"
										: "Reactivate Account"}
								</h3>
								<p className='text-xs text-slate-500 dark:text-slate-400'>
									{ownerName || ownerId}
								</p>
							</div>
						</div>

						<p className='mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300'>
							{actionType === "SUSPEND"
								? "This will immediately terminate the owner's active sessions and block them at login and middleware."
								: "This will restore active login and dashboard access for this owner immediately."}
						</p>

						<div className='mt-4'>
							<label
								htmlFor='admin-reason'
								className='block text-xs font-semibold text-slate-700 dark:text-slate-300'
							>
								Administrative Note / Reason (Audited):
							</label>
							<input
								id='admin-reason'
								type='text'
								placeholder={
									actionType === "SUSPEND"
										? "Reason for suspension"
										: "Reason for reactivation"
								}
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								className='mt-1 w-full rounded-xl border border-[#E8E3D8] bg-slate-50 p-2.5 text-xs text-slate-900 outline-none focus:border-emerald-600 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-white'
							/>
						</div>

						<div className='mt-6 flex items-center justify-end gap-3'>
							<Button
								variant='outline'
								size='sm'
								onClick={() => setShowModal(false)}
								disabled={loading}
							>
								Cancel
							</Button>
							<button
								type='button'
								onClick={handleExecuteStatusChange}
								disabled={loading}
								className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm transition-all disabled:opacity-50 ${
									actionType === "SUSPEND"
										? "bg-rose-600 hover:bg-rose-700"
										: "bg-emerald-600 hover:bg-emerald-700"
								}`}
							>
								{loading
									? "Saving..."
									: actionType === "SUSPEND"
										? "Confirm Suspension"
										: "Confirm Reactivation"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
