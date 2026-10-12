"use client";

import React, { useEffect, useState } from "react";

/**
 * Choose Ghar — Ultra-Premium Brand PreLoader
 * Features the signature Concept B CG architectural monogram
 * enveloped by an emerald & gold orbital aura and smooth fade-out.
 */
const PreLoader = () => {
	const [isVisible, setIsVisible] = useState(true);
	const [isFading, setIsFading] = useState(false);

	useEffect(() => {
		// Begin fade out after a brief, crisp brand introduction
		const fadeTimer = setTimeout(() => {
			setIsFading(true);
		}, 650);

		// Completely unmount after fade-out transition finishes
		const unmountTimer = setTimeout(() => {
			setIsVisible(false);
		}, 1000);

		return () => {
			clearTimeout(fadeTimer);
			clearTimeout(unmountTimer);
		};
	}, []);

	if (!isVisible) return null;

	return (
		<div
			className={`duration-350 fixed inset-0 z-999999 flex flex-col items-center justify-center bg-[#FBF9F5] transition-opacity ease-out dark:bg-[#0B1713] ${
				isFading ? "pointer-events-none opacity-0" : "opacity-100"
			}`}
			aria-hidden='true'
		>
			{/* Ambient Warm Glow */}
			<div className='pointer-events-none absolute h-64 w-64 rounded-full bg-gradient-to-tr from-[#34D399]/15 via-[#E5A83B]/10 to-transparent blur-3xl' />

			{/* Center Brand Icon with Orbital Ring */}
			<div className='relative flex items-center justify-center'>
				{/* Rotating Emerald & Gold Orbit Ring */}
				<svg
					className='h-20 w-20 animate-spin duration-1000'
					viewBox='0 0 80 80'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'
				>
					<circle
						cx='40'
						cy='40'
						r='36'
						stroke='currentColor'
						strokeWidth='2.5'
						strokeLinecap='round'
						className='text-[#0B2B20]/10 dark:text-emerald-950/40'
					/>
					<path
						d='M40 4C59.8823 4 76 20.1177 76 40'
						stroke='url(#orbitGlow)'
						strokeWidth='3'
						strokeLinecap='round'
					/>
					<defs>
						<linearGradient
							id='orbitGlow'
							x1='40'
							y1='4'
							x2='76'
							y2='40'
							gradientUnits='userSpaceOnUse'
						>
							<stop stopColor='#E5A83B' />
							<stop offset='1' stopColor='#34D399' />
						</linearGradient>
					</defs>
				</svg>

				{/* Brand Symbol Squircle Emblem */}
				<div className='absolute flex h-13 w-13 items-center justify-center rounded-xl bg-[#0B2B20] shadow-md ring-1 ring-[#1B4D3A] dark:bg-[#133E2F] dark:ring-[#25634B]/70'>
					<svg
						className='h-7 w-7'
						viewBox='0 0 32 32'
						fill='none'
						xmlns='http://www.w3.org/2000/svg'
					>
						{/* Outer 'C' Ribbon */}
						<path
							d='M22.8 10.4C21 8.2 18.2 7 15.2 7C9.9 7 5.6 11 5.6 16.2C5.6 21.4 9.9 25.4 15.2 25.4C19.4 25.4 23 22.8 24.2 19'
							stroke='#FFFFFF'
							strokeWidth='2.8'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
						{/* Inner 'G' Architectural Flow */}
						<path
							d='M15.2 12C12.7 12 10.7 13.9 10.7 16.2C10.7 18.5 12.7 20.4 15.2 20.4C17.7 20.4 19.7 18.5 19.7 16.2V15.8H15.2'
							stroke='#34D399'
							strokeWidth='2.4'
							strokeLinecap='round'
							strokeLinejoin='round'
						/>
						{/* Golden Keystone Accent */}
						<path d='M23.8 7.8L26.2 10.2L23.8 12.6L21.4 10.2Z' fill='#E5A83B' />
					</svg>
				</div>
			</div>

			{/* Brand Wordmark */}
			<div className='mt-5 flex items-center gap-1.5 font-inter text-lg font-extrabold tracking-tight text-[#0B2B20] dark:text-white'>
				<span>Choose</span>
				<span className='text-[#1A533F] dark:text-[#34D399]'>Ghar</span>
			</div>

			{/* Micro-Progress Loading Pill */}
			<div className='mt-3.5 flex items-center gap-1.5'>
				<span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#059669] delay-0 dark:bg-[#34D399]' />
				<span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#E5A83B] [animation-delay:150ms]' />
				<span className='h-1.5 w-1.5 animate-bounce rounded-full bg-[#059669] [animation-delay:300ms] dark:bg-[#34D399]' />
			</div>
		</div>
	);
};

export default PreLoader;
