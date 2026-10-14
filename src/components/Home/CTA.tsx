"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import React from "react";

const CTA = () => {
	const { data: session } = useSession();
	const isLoggedIn = !!session?.user;
	const dashboardHref = session?.user?.role === "ADMIN" ? "/admin" : "/user";

	return (
		<section className='bg-[#FBF9F5] py-16 dark:bg-[#0E1713] sm:py-24'>
			<div className='mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0'>
				<div className='relative overflow-hidden rounded-3xl bg-[#0B2B20] px-6 py-14 text-center shadow-2xl dark:bg-[#081F17] sm:px-12 sm:py-20'>
					{/* Subtle decorative glow */}
					<div className='pointer-events-none absolute -top-24 left-1/2 h-72 w-96 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl' />

					<div className='relative mx-auto max-w-2xl'>
						{/* Clean Brand Pill */}
						<span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#E5A83B] ring-1 ring-white/15'>
							<svg
								className='h-4 w-4'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
								/>
							</svg>
							<span>Choose Bed • Made for PG &amp; Hostel Owners</span>
						</span>

						<h2 className='mt-6 font-inter text-3xl font-extrabold tracking-tight text-white sm:text-5xl sm:leading-[1.15]'>
							<span className='block'>Manage Your PG</span>
							<span className='font-serif mt-1 block font-normal italic text-[#E5A83B] sm:mt-2'>
								the Easy Way.
							</span>
						</h2>

						<p className='mt-4 text-sm leading-relaxed text-slate-300 sm:text-base'>
							Keep track of rooms, resident records, and vacant beds in real
							time directly from your phone or laptop. Designed for Indian PG
							and hostel owners to run smoother, more profitable properties.
						</p>

						<div className='mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row'>
							{isLoggedIn ? (
								<Link
									href={dashboardHref}
									className='w-full rounded-xl bg-[#E5A83B] px-8 py-4 text-center text-sm font-bold text-[#0B2B20] shadow-lg transition-all hover:bg-[#F3BA4C] hover:shadow-xl sm:w-auto'
								>
									Go to Dashboard →
								</Link>
							) : (
								<>
									<Link
										href='/auth/signup'
										className='w-full rounded-xl bg-[#E5A83B] px-8 py-4 text-center text-sm font-bold text-[#0B2B20] shadow-lg transition-all hover:bg-[#F3BA4C] hover:shadow-xl sm:w-auto'
									>
										Register Your PG →
									</Link>
									<Link
										href='/auth/signin'
										className='w-full rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-center text-sm font-bold text-white shadow-sm transition-all hover:bg-white/15 sm:w-auto'
									>
										Sign In to Your Account
									</Link>
								</>
							)}
						</div>

						<p className='mt-6 text-xs text-slate-400'>
							Takes 1 minute to start • Works on all mobile phones • Free owner
							setup
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};

export default CTA;
