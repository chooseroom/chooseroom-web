"use client";
import { BrandLogo } from "@/components/Common/BrandLogo";
import { Button, Card, CardContent, Input } from "@/components/Common/UI";
import { normalizeIndianMobile } from "@/libs/formatters";
import axios from "axios";
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
			const res = await axios.post("/api/user/register", {
				name: name.trim(),
				email: email.trim(),
				phone: cleanMobile,
				password,
			});

			if (res.status === 200 || res.status === 201) {
				toast.success(
					"Account registered successfully! Please sign in with your mobile number or email."
				);
				router.push(
					`/auth/signin?registered=true&identifier=${encodeURIComponent(cleanMobile)}`
				);
			}
		} catch (error: any) {
			const errMsg =
				error?.response?.data?.message ||
				error?.response?.data ||
				"Registration failed. Please check your details and try again.";
			toast.error(typeof errMsg === "string" ? errMsg : "Registration failed.");
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
							PG/Hostel Owner Registration
						</h2>
						<p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
							Create an account to manage your PG/Hostel properties and
							operations.
						</p>
					</div>

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
				</CardContent>
			</Card>
		</div>
	);
}
