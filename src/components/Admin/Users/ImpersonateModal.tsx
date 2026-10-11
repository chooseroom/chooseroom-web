"use client";
import { useState } from "react";

interface Props {
	show: boolean;
	targetUserEmail: string;
	onClose: () => void;
	onConfirm: (adminPassword: string) => Promise<void>;
}

/**
 * ImpersonateModal
 *
 * Prompts the admin to enter their own password before impersonating a user.
 * This password is sent to the impersonate CredentialsProvider which verifies
 * it with bcrypt server-side — the client never stores it beyond this modal's
 * local state, and it is cleared on close.
 */
export default function ImpersonateModal({
	show,
	targetUserEmail,
	onClose,
	onConfirm,
}: Props) {
	const [adminPassword, setAdminPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const handleClose = () => {
		setAdminPassword("");
		onClose();
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!adminPassword) return;

		setIsLoading(true);
		try {
			await onConfirm(adminPassword);
		} finally {
			setIsLoading(false);
			setAdminPassword("");
		}
	};

	if (!show) return null;

	return (
		<div className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/60'>
			<div className='w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-dark'>
				<h2 className='mb-2 font-satoshi text-xl font-bold text-dark dark:text-white'>
					Confirm Impersonation
				</h2>
				<p className='mb-6 text-sm text-body dark:text-gray-4'>
					You are about to log in as{" "}
					<span className='font-semibold text-dark dark:text-white'>
						{targetUserEmail}
					</span>
					. Enter your admin password to confirm.
				</p>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label
							htmlFor='admin-password'
							className='mb-2 block text-sm font-medium text-dark dark:text-white'
						>
							Your Admin Password
						</label>
						<input
							id='admin-password'
							type='password'
							required
							autoComplete='current-password'
							value={adminPassword}
							onChange={(e) => setAdminPassword(e.target.value)}
							className='w-full rounded-lg border border-stroke bg-transparent px-4 py-3 text-dark outline-none focus:border-primary dark:border-stroke-dark dark:text-white'
							placeholder='Enter your password'
						/>
					</div>

					<div className='flex gap-3 pt-2'>
						<button
							type='button'
							onClick={handleClose}
							disabled={isLoading}
							className='flex-1 rounded-lg border border-stroke py-3 font-medium text-dark duration-200 hover:bg-gray-2 dark:border-stroke-dark dark:text-white dark:hover:bg-white/5'
						>
							Cancel
						</button>
						<button
							type='submit'
							disabled={isLoading || !adminPassword}
							className='flex-1 rounded-lg bg-primary py-3 font-medium text-white duration-200 hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60'
						>
							{isLoading ? "Verifying…" : "Confirm & Login"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
