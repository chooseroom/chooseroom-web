"use client";

import React from "react";

export function PainPoints() {
	return (
		<section className='border-y border-[#E8E3D8] bg-[#F7F4EE] py-16 dark:border-slate-800 dark:bg-[#111C16] sm:py-24'>
			<div className='mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0'>
				{/* Section Header */}
				<div className='mx-auto max-w-2xl text-center'>
					<div className='shadow-2xs inline-flex items-center gap-2 rounded-full border border-[#E8E3D8] bg-white px-3.5 py-1 text-xs font-semibold text-[#0B2B20] dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-300'>
						<span className='h-2 w-2 rounded-full bg-[#E5A83B]' />
						<span className='text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
							Simple Property Management
						</span>
					</div>

					<h2 className='mt-4 font-inter text-3xl font-extrabold tracking-tight text-[#0B2B20] dark:text-white sm:text-4xl lg:text-[40px]'>
						Keep Your PG Organised,{" "}
						<span className='font-serif font-normal italic text-[#1A533F] dark:text-[#34D399]'>
							Without the Daily Confusion.
						</span>
					</h2>

					<p className='mt-4 text-base leading-relaxed text-[#4A5550] dark:text-slate-300 sm:text-lg'>
						Running a PG means managing residents, room types, and empty beds
						every day. Choose Ghar gives you one clear, dependable place to see
						who is staying where.
					</p>
				</div>

				{/* 4 Core Essentials Grid */}
				<div className='mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2'>
					{/* Item 1 */}
					<div className='group rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition-all hover:border-[#1A533F]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40'>
						<div className='flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'>
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
								/>
							</svg>
						</div>
						<h3 className='mt-4 text-base font-bold text-[#0B2B20] dark:text-white'>
							All Resident Details in One Place
						</h3>
						<p className='mt-2 text-sm leading-relaxed text-[#5A6560] dark:text-slate-400'>
							Store tenant names, 10-digit mobile numbers, and check-in dates
							safely without searching through paper notebooks or lost
							registers.
						</p>
					</div>

					{/* Item 2 */}
					<div className='group rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition-all hover:border-[#1A533F]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40'>
						<div className='flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'>
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
								/>
							</svg>
						</div>
						<h3 className='mt-4 text-base font-bold text-[#0B2B20] dark:text-white'>
							Check Occupied and Available Beds
						</h3>
						<p className='mt-2 text-sm leading-relaxed text-[#5A6560] dark:text-slate-400'>
							See which beds are taken and which are empty across every floor,
							so you can respond to walk-in tenants and phone inquiries right
							away.
						</p>
					</div>

					{/* Item 3 */}
					<div className='group rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition-all hover:border-[#1A533F]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40'>
						<div className='flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'>
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M4 6h16M4 10h16M4 14h16M4 18h16'
								/>
							</svg>
						</div>
						<h3 className='mt-4 text-base font-bold text-[#0B2B20] dark:text-white'>
							Manage AC, Non-AC & Sharing Types
						</h3>
						<p className='mt-2 text-sm leading-relaxed text-[#5A6560] dark:text-slate-400'>
							Easily organize single rooms, double sharing, and triple sharing
							with exact bed counts and room limits set up beforehand.
						</p>
					</div>

					{/* Item 4 */}
					<div className='group rounded-2xl border border-[#E8E3D8] bg-white p-6 shadow-sm transition-all hover:border-[#1A533F]/40 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40'>
						<div className='flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'>
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
								/>
							</svg>
						</div>
						<h3 className='mt-4 text-base font-bold text-[#0B2B20] dark:text-white'>
							Assign Residents to Rooms
						</h3>
						<p className='mt-2 text-sm leading-relaxed text-[#5A6560] dark:text-slate-400'>
							Allot incoming tenants to specific beds in moments, and smoothly
							update room allocations whenever a resident moves or checks out.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
}
