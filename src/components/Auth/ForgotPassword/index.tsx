"use client";
import { BrandLogo } from "@/components/Common/BrandLogo";
import { Button, Card, CardContent, Input } from "@/components/Common/UI";
import axios from "axios";
import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import z from "zod";
import { integrations, messages } from "../../../../integrations.config";

const schema = z.object({
	email: z.string().email({ message: "Please enter a valid email address." }),
});

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!integrations.isAuthEnabled) {
			return toast.error(messages.auth);
		}

		const result = schema.safeParse({ email });

		if (!result.success) {
			toast.error(result.error.issues[0].message);
			return;
		}

		try {
			setLoading(true);
			const res = await axios.post("/api/forgot-password/reset", {
				email,
			});

			if (res.status === 404) {
				toast.error("No account found with this email.");
				return;
			}

			if (res.status === 200) {
				toast.success(
					typeof res.data === "string"
						? res.data
						: "Password reset link has been sent to your email."
				);
				setEmail("");
			}
		} catch (error: any) {
			const errMsg =
				error?.response?.data || "Unable to send reset link. Please try again.";
			toast.error(
				typeof errMsg === "string" ? errMsg : "Failed to send reset link."
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
							Reset Password
						</h2>
						<p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
							Enter your registered email address to receive a secure recovery
							link.
						</p>
					</div>

					<form onSubmit={handleSubmit} className='mt-7 space-y-4'>
						<Input
							label='Email Address'
							id='email'
							name='email'
							type='email'
							required
							placeholder='owner@example.com'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete='email'
						/>

						<Button
							type='submit'
							variant='primary'
							size='lg'
							isLoading={loading}
							className='mt-2 w-full'
						>
							Send Reset Link
						</Button>
					</form>

					<div className='mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:text-sm'>
						<span>Remembered your password? </span>
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
