"use client";
import { BrandLogo } from "@/components/Common/BrandLogo";
import { Button, Card, CardContent, Input } from "@/components/Common/UI";
import { normalizeIndianMobile } from "@/libs/formatters";
import axios from "axios";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

export default function Signup() {
	const [name, setName] = useState("");
	const [mobile, setMobile] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const router = useRouter();

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!name.trim()) {
			toast.error("Please enter your full name.");
			return;
		}

		const cleanMobile = normalizeIndianMobile(mobile);
		if (cleanMobile.length !== 10) {
			toast.error("Please enter a valid 10-digit Indian mobile number.");
			return;
		}

		if (password.length < 8) {
			toast.error("Password must be at least 8 characters long.");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match. Please re-enter.");
			return;
		}

		setLoading(true);

		try {
			// For existing API compatibility, use email or mobile fallback email
			const registrationEmail = email.trim()
				? email.trim()
				: `${cleanMobile}@pghostel.local`;

			const res = await axios.post("/api/user/register", {
				name: name.trim(),
				email: registrationEmail,
				phone: cleanMobile,
				password,
			});

			if (res.status === 200 || res.status === 201) {
				setIsSuccess(true);
				toast.success("Welcome to Choose Ghar! Setting up your workspace...");

				// Automatically authenticate with NextAuth
				const authRes = await signIn("credentials", {
					email: registrationEmail,
					password,
					redirect: false,
				});

				if (authRes?.ok) {
					setTimeout(() => {
						router.push("/user");
						router.refresh();
					}, 700);
				} else {
					router.push("/auth/signin");
				}
			}
		} catch (error: any) {
			const errMsg =
				error?.response?.data?.message ||
				error?.response?.data ||
				"Registration failed. Please check your details and try again.";
			toast.error(typeof errMsg === "string" ? errMsg : "Registration failed.");
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
							{isSuccess ? "Welcome to Choose Ghar" : "Owner Registration"}
						</h2>
						<p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
							{isSuccess
								? "Your workspace is ready. Redirecting you to the dashboard..."
								: "Create an owner account to manage your PG, hostel, or co-living property."}
						</p>
					</div>

					{isSuccess ? (
						<div className='mt-8 py-4 text-center'>
							<div className='relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B2B20] shadow-lg ring-4 ring-emerald-500/20 dark:bg-[#133E2F]'>
								<svg
									className='h-8 w-8 text-emerald-400'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
									strokeWidth={2.5}
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										d='M5 13l4 4L19 7'
									/>
								</svg>
							</div>

							<div className='mt-5'>
								<h3 className='text-lg font-bold text-[#0B2B20] dark:text-white'>
									Welcome aboard, {name.trim().split(" ")[0]}!
								</h3>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Preparing your property dashboard...
								</p>
							</div>

							<div className='mx-auto mt-6 max-w-xs space-y-2'>
								<div className='h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800'>
									<div className='h-full w-full animate-pulse rounded-full bg-gradient-to-r from-emerald-500 via-[#34D399] to-[#E5A83B]' />
								</div>
								<p className='text-[11px] font-semibold text-emerald-700 dark:text-emerald-400'>
									Opening Owner Operations...
								</p>
							</div>
						</div>
					) : (
						<>
							{/* Form */}
							<form onSubmit={handleSubmit} className='mt-7 space-y-4'>
								<Input
									label='Full Name'
									id='name'
									name='name'
									type='text'
									required
									placeholder='e.g. Ramesh Patel'
									value={name}
									onChange={(e) => setName(e.target.value)}
									autoComplete='name'
								/>

								<Input
									label='Mobile Number'
									id='mobile'
									name='mobile'
									type='tel'
									required
									prefixText='+91'
									placeholder='98765 43210'
									value={mobile}
									onChange={(e) => setMobile(e.target.value)}
									autoComplete='tel'
									helperText='Required for account security and recovery.'
								/>

								<Input
									label='Email Address'
									id='email'
									name='email'
									type='email'
									placeholder='owner@example.com (optional)'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									autoComplete='email'
									helperText='Optional. Used for receiving monthly reports & alerts.'
								/>

								<Input
									label='Password'
									id='password'
									name='password'
									type='password'
									required
									placeholder='At least 8 characters'
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									autoComplete='new-password'
								/>

								<Input
									label='Confirm Password'
									id='confirmPassword'
									name='confirmPassword'
									type='password'
									required
									placeholder='Re-type your password'
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
									Complete Owner Registration
								</Button>
							</form>

							{/* Footer Link */}
							<div className='mt-6 border-t border-slate-100 pt-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:text-sm'>
								<span>Already registered as an owner? </span>
								<Link
									href='/auth/signin'
									className='font-semibold text-slate-900 hover:underline dark:text-white'
								>
									Sign In here →
								</Link>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
