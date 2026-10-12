"use client";
import { BrandLogo } from "@/components/Common/BrandLogo";
import { Button, Card, CardContent, Input } from "@/components/Common/UI";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function Signin() {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!identifier.trim() || !password) {
			toast.error("Please enter both your mobile number/email and password.");
			return;
		}

		setLoading(true);

		try {
			const res = await signIn("credentials", {
				email: identifier.trim(),
				password,
				redirect: false,
			});

			if (res?.error) {
				toast.error(
					res.error || "Invalid credentials. Please verify your details."
				);
			} else if (res?.ok) {
				toast.success("Welcome back! Signed in successfully.");
				// Check user role to redirect to the appropriate portal
				try {
					const session = await getSession();
					if ((session?.user as any)?.role === "ADMIN") {
						router.push("/admin");
					} else {
						router.push("/user");
					}
				} catch {
					router.push("/admin");
				}
				router.refresh();
			}
		} catch (error) {
			toast.error("An error occurred during sign in. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex min-h-[calc(100vh-160px)] items-center justify-center px-4 py-12 sm:px-6'>
			<Card className='w-full max-w-md border-slate-200/80 shadow-md dark:border-slate-800'>
				<CardContent className='p-6 sm:p-8'>
					{/* Logo & Header */}
					<div className='text-center'>
						<div className='flex justify-center'>
							<BrandLogo />
						</div>
						<h2 className='mt-6 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl'>
							Sign In
						</h2>
						<p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
							Access your Choose Ghar dashboard and property records.
						</p>
					</div>

					{/* Form */}
					<form onSubmit={handleSubmit} className='mt-7 space-y-4'>
						<Input
							label='Mobile number or email'
							id='identifier'
							name='identifier'
							type='text'
							required
							placeholder='e.g. 9876543210 or owner@example.com'
							value={identifier}
							onChange={(e) => setIdentifier(e.target.value)}
							autoComplete='username'
						/>

						<div>
							<div className='flex items-center justify-between pb-1'>
								<label
									htmlFor='password'
									className='text-xs font-semibold text-slate-700 dark:text-slate-200'
								>
									Password <span className='text-rose-500'>*</span>
								</label>
								<Link
									href='/auth/forgot-password'
									className='text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
								>
									Forgot password?
								</Link>
							</div>
							<Input
								id='password'
								name='password'
								type='password'
								required
								placeholder='Enter your password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								autoComplete='current-password'
							/>
						</div>

						<Button
							type='submit'
							variant='primary'
							size='lg'
							isLoading={loading}
							className='mt-2 w-full'
						>
							Sign In
						</Button>
					</form>

					{/* Footer Link */}
					<div className='mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:text-sm'>
						<span>Need an owner account? </span>
						<Link
							href='/auth/signup'
							className='font-semibold text-slate-900 hover:underline dark:text-white'
						>
							Register as Owner →
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
