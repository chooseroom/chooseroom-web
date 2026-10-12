"use client";
import { BrandLogo } from "@/components/Common/BrandLogo";
import { Button, Card, CardContent, Input } from "@/components/Common/UI";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import z from "zod";
import { integrations, messages } from "../../../../integrations.config";

const schema = z
	.object({
		newPassword: z
			.string()
			.min(8, { message: "Password must be at least 8 characters long" })
			.refine((val) => /[A-Z]/.test(val), {
				message: "Password must contain at least one uppercase letter.",
			})
			.refine((val) => /[a-z]/.test(val), {
				message: "Password must contain at least one lowercase letter.",
			})
			.refine((val) => /\d/.test(val), {
				message: "Password must contain at least one number.",
			})
			.refine((val) => /[@$!%*?&]/.test(val), {
				message: "Password must contain at least one special character.",
			}),

		confirmPassword: z.string().min(8, {
			message: "Password must be at least 8 characters long",
		}),
	})
	.refine((data) => data.newPassword === data.confirmPassword, {
		message: "Passwords do not match.",
		path: ["confirmPassword"],
	});

export default function ResetPassword({ token }: { token: string }) {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const verifyToken = async () => {
			try {
				const res = await axios.post(`/api/forgot-password/verify-token`, {
					token,
				});

				if (res.status === 200) {
					setEmail(res.data.email);
				}
			} catch (error: any) {
				const errMsg =
					error?.response?.data || "Password reset link is invalid or expired.";
				toast.error(
					typeof errMsg === "string" ? errMsg : "Invalid reset token."
				);
				router.push("/auth/forgot-password");
			}
		};

		if (integrations.isAuthEnabled) {
			verifyToken();
		}
	}, [token, router]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!integrations.isAuthEnabled) {
			return toast.error(messages.auth);
		}

		const result = schema.safeParse({ newPassword, confirmPassword });

		if (!result.success) {
			toast.error(result.error.issues[0].message);
			return;
		}

		try {
			setLoading(true);
			const res = await axios.post(`/api/forgot-password/update`, {
				email,
				password: newPassword,
			});

			if (res.status === 200) {
				toast.success(
					typeof res.data === "string"
						? res.data
						: "Password updated successfully! Please sign in."
				);
				router.push("/auth/signin");
			}
		} catch (error: any) {
			const errMsg =
				error?.response?.data || "Unable to update password. Please try again.";
			toast.error(
				typeof errMsg === "string" ? errMsg : "Password update failed."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6'>
			<Card className='w-full max-w-md border-slate-200/80 shadow-md dark:border-slate-800'>
				<CardContent className='p-6 sm:p-8'>
					<div className='text-center'>
						<div className='flex justify-center'>
							<BrandLogo />
						</div>
						<h2 className='mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl'>
							Set New Password
						</h2>
						<p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
							Create a strong, new password for your owner account.
						</p>
					</div>

					<form onSubmit={handleSubmit} className='mt-7 space-y-4'>
						<Input
							label='New Password'
							id='newPassword'
							name='newPassword'
							type='password'
							required
							placeholder='At least 8 characters'
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							autoComplete='new-password'
						/>

						<Input
							label='Confirm New Password'
							id='confirmPassword'
							name='confirmPassword'
							type='password'
							required
							placeholder='Re-enter your new password'
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							autoComplete='new-password'
						/>

						<Button
							type='submit'
							variant='primary'
							size='lg'
							isLoading={loading}
							className='mt-2 w-full'
						>
							Update Password
						</Button>
					</form>

					<div className='mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:text-sm'>
						<span>Remember your password? </span>
						<Link
							href='/auth/signin'
							className='font-semibold text-slate-900 hover:underline dark:text-white'
						>
							Back to Sign In →
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
