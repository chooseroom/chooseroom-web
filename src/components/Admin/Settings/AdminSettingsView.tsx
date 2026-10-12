"use client";

import { Card, CardContent } from "@/components/Common/UI";
import { useState } from "react";
import toast from "react-hot-toast";

interface AdminSettingsViewProps {
	adminProfile: {
		id: string;
		name: string | null;
		email: string;
		role: string;
		status: string;
		createdAt: string;
	};
	stats: {
		adminCount: number;
		ownerCount: number;
		auditCount: number;
	};
}

export default function AdminSettingsView({
	adminProfile,
	stats,
}: AdminSettingsViewProps) {
	const [passwords, setPasswords] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!passwords.currentPassword ||
			!passwords.newPassword ||
			!passwords.confirmPassword
		) {
			toast.error("Please fill in all password fields.");
			return;
		}

		if (passwords.newPassword.length < 8) {
			toast.error("New password must be at least 8 characters long.");
			return;
		}

		if (passwords.newPassword !== passwords.confirmPassword) {
			toast.error("New password and confirmation do not match.");
			return;
		}

		setIsSubmitting(true);
		try {
			const res = await fetch("/api/admin/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(passwords),
			});

			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Failed to update password.");
				return;
			}

			toast.success("Admin password successfully updated!");
			setPasswords({
				currentPassword: "",
				newPassword: "",
				confirmPassword: "",
			});
		} catch (err: any) {
			toast.error("An error occurred while updating the password.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className='space-y-4 sm:space-y-6'>
			{/* Top Cards: Admin Profile & Platform Overview */}
			<div className='grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3'>
				{/* Admin Identity */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711] lg:col-span-1'>
					<CardContent className='p-4 sm:p-5'>
						<div className='flex items-center gap-3.5'>
							<div className='flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A382B] to-[#10B981] font-satoshi text-base font-bold text-white shadow-sm sm:size-12 sm:text-lg'>
								{adminProfile.name
									? adminProfile.name.charAt(0).toUpperCase()
									: "A"}
							</div>
							<div className='min-w-0 flex-1'>
								<h3 className='truncate font-satoshi text-sm font-bold text-slate-900 dark:text-white sm:text-base'>
									{adminProfile.name || "Admin"}
								</h3>
								<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
									{adminProfile.email}
								</p>
								<div className='mt-1.5 flex items-center gap-1.5'>
									<span className='inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'>
										{adminProfile.role}
									</span>
									<span className='inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
										{adminProfile.status}
									</span>
								</div>
							</div>
						</div>

						<div className='mt-3.5 space-y-2 border-t border-[#E8E3D8] pt-3 text-xs dark:border-[#1E382B] sm:mt-4 sm:pt-3.5'>
							<div className='flex justify-between'>
								<span className='text-slate-500 dark:text-slate-400'>
									Privilege Tier
								</span>
								<span className='font-semibold text-slate-800 dark:text-slate-200'>
									Full Platform Access
								</span>
							</div>
							<div className='flex justify-between'>
								<span className='text-slate-500 dark:text-slate-400'>
									Security Status
								</span>
								<span className='font-semibold text-emerald-700 dark:text-emerald-400'>
									Protected & Verified
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Platform Overview & Metrics */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711] lg:col-span-2'>
					<CardContent className='p-4 sm:p-5'>
						<div>
							<h3 className='font-satoshi text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:text-sm'>
								Platform Metrics
							</h3>
							<p className='mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs'>
								Live platform summary and active platform counts.
							</p>
						</div>

						<div className='mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3'>
							<div className='rounded-xl border border-[#E8E3D8] bg-slate-50/70 p-2.5 text-center dark:border-[#1E382B] dark:bg-[#0A1F17] sm:p-3.5 sm:text-left'>
								<p className='truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
									Admins
								</p>
								<p className='mt-0.5 font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:mt-1 sm:text-2xl'>
									{stats.adminCount}
								</p>
								<p className='hidden truncate text-[10px] text-slate-400 sm:block sm:text-[11px]'>
									Active platform admins
								</p>
							</div>

							<div className='rounded-xl border border-[#E8E3D8] bg-slate-50/70 p-2.5 text-center dark:border-[#1E382B] dark:bg-[#0A1F17] sm:p-3.5 sm:text-left'>
								<p className='truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
									PG Owners
								</p>
								<p className='mt-0.5 font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:mt-1 sm:text-2xl'>
									{stats.ownerCount}
								</p>
								<p className='hidden truncate text-[10px] text-slate-400 sm:block sm:text-[11px]'>
									Registered accounts
								</p>
							</div>

							<div className='rounded-xl border border-[#E8E3D8] bg-slate-50/70 p-2.5 text-center dark:border-[#1E382B] dark:bg-[#0A1F17] sm:p-3.5 sm:text-left'>
								<p className='truncate text-[10px] font-semibold text-slate-500 dark:text-slate-400 sm:text-xs'>
									Audit Logs
								</p>
								<p className='mt-0.5 font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:mt-1 sm:text-2xl'>
									{stats.auditCount}
								</p>
								<p className='hidden truncate text-[10px] text-slate-400 sm:block sm:text-[11px]'>
									Security events
								</p>
							</div>
						</div>

						<div className='mt-3 flex items-center gap-2 rounded-xl bg-emerald-50/80 px-3 py-2 text-[11px] text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 sm:text-xs'>
							<span className='size-2 shrink-0 rounded-full bg-emerald-500'></span>
							<span className='font-medium'>
								All platform security subsystems active and healthy
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Password Change & Governance Safeguards */}
			<div className='grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2'>
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-4 sm:p-5'>
						<div className='flex items-center gap-2.5 sm:gap-3'>
							<div className='flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:size-9'>
								<svg
									className='size-4 sm:size-5'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
									/>
								</svg>
							</div>
							<div>
								<h3 className='font-satoshi text-sm font-bold text-slate-900 dark:text-white sm:text-base'>
									Update Admin Password
								</h3>
								<p className='text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs'>
									Enhance account security with a strong credential.
								</p>
							</div>
						</div>

						<form
							onSubmit={handlePasswordChange}
							className='mt-3.5 space-y-3 sm:mt-4 sm:space-y-3.5'
						>
							<div>
								<label
									htmlFor='current-password'
									className='block text-xs font-semibold text-slate-700 dark:text-slate-300'
								>
									Current Password
								</label>
								<input
									id='current-password'
									type='password'
									value={passwords.currentPassword}
									onChange={(e) =>
										setPasswords({
											...passwords,
											currentPassword: e.target.value,
										})
									}
									placeholder='Enter current password'
									required
									className='mt-1 w-full rounded-xl border border-[#E8E3D8] bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-white sm:px-3.5 sm:py-2.5 sm:text-sm'
								/>
							</div>

							<div>
								<label
									htmlFor='new-password'
									className='block text-xs font-semibold text-slate-700 dark:text-slate-300'
								>
									New Password
								</label>
								<input
									id='new-password'
									type='password'
									value={passwords.newPassword}
									onChange={(e) =>
										setPasswords({ ...passwords, newPassword: e.target.value })
									}
									placeholder='Minimum 8 characters'
									required
									className='mt-1 w-full rounded-xl border border-[#E8E3D8] bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-white sm:px-3.5 sm:py-2.5 sm:text-sm'
								/>
							</div>

							<div>
								<label
									htmlFor='confirm-password'
									className='block text-xs font-semibold text-slate-700 dark:text-slate-300'
								>
									Confirm New Password
								</label>
								<input
									id='confirm-password'
									type='password'
									value={passwords.confirmPassword}
									onChange={(e) =>
										setPasswords({
											...passwords,
											confirmPassword: e.target.value,
										})
									}
									placeholder='Re-type new password'
									required
									className='mt-1 w-full rounded-xl border border-[#E8E3D8] bg-white px-3 py-2 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-white sm:px-3.5 sm:py-2.5 sm:text-sm'
								/>
							</div>

							<div className='pt-1'>
								<button
									type='submit'
									disabled={isSubmitting}
									className='inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50 sm:py-2.5 sm:text-sm'
								>
									{isSubmitting ? (
										<span className='inline-flex items-center gap-2'>
											<span className='size-3.5 animate-spin rounded-full border-2 border-white border-t-transparent'></span>
											Updating Credential...
										</span>
									) : (
										"Save New Password"
									)}
								</button>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Governance Safeguards Card */}
				<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
					<CardContent className='p-4 sm:p-5'>
						<div className='flex items-center gap-2.5 sm:gap-3'>
							<div className='flex size-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 sm:size-9'>
								<svg
									className='size-4 sm:size-5'
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
							<div>
								<h3 className='font-satoshi text-sm font-bold text-slate-900 dark:text-white sm:text-base'>
									Governance & Security Standards
								</h3>
								<p className='text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs'>
									Platform access control and policy safeguards
								</p>
							</div>
						</div>

						<div className='mt-3.5 divide-y divide-[#E8E3D8] rounded-xl border border-[#E8E3D8] bg-slate-50/50 text-xs dark:divide-[#1E382B] dark:border-[#1E382B] dark:bg-[#0A1F17]/50 sm:mt-4'>
							<div className='p-3 sm:p-3.5'>
								<div className='flex items-start gap-2.5'>
									<span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
										<svg
											className='size-2.5'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth='2.5'
												d='M5 13l4 4L19 7'
											/>
										</svg>
									</span>
									<div className='min-w-0 flex-1'>
										<h4 className='font-semibold text-slate-900 dark:text-white'>
											Strict Role Separation
										</h4>
										<p className='mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs'>
											Platform administration and PG operations are strictly
											isolated. Privileges cannot be acquired via public signup.
										</p>
									</div>
								</div>
							</div>

							<div className='p-3 sm:p-3.5'>
								<div className='flex items-start gap-2.5'>
									<span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
										<svg
											className='size-2.5'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth='2.5'
												d='M5 13l4 4L19 7'
											/>
										</svg>
									</span>
									<div className='min-w-0 flex-1'>
										<h4 className='font-semibold text-slate-900 dark:text-white'>
											Encrypted Session Management
										</h4>
										<p className='mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs'>
											Secure, encrypted tokens with instant revocation whenever
											an account status is updated or suspended.
										</p>
									</div>
								</div>
							</div>

							<div className='p-3 sm:p-3.5'>
								<div className='flex items-start gap-2.5'>
									<span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'>
										<svg
											className='size-2.5'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth='2.5'
												d='M5 13l4 4L19 7'
											/>
										</svg>
									</span>
									<div className='min-w-0 flex-1'>
										<h4 className='font-semibold text-slate-900 dark:text-white'>
											Immutable Audit Logging
										</h4>
										<p className='mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs'>
											All privileged actions and security modifications are
											permanently recorded with timestamps and admin identities.
										</p>
									</div>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
