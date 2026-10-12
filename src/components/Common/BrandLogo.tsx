"use client";

import Link from "next/link";
import React from "react";

export interface BrandLogoProps {
	className?: string;
	href?: string;
	compact?: boolean;
	variant?: "default" | "symbol" | "full";
	themeMode?: "auto" | "light" | "dark" | "monochrome";
	size?: "sm" | "md" | "lg";
	showSubtitle?: boolean;
	hideSubtitleOnMobile?: boolean;
}

/**
 * Choose Ghar — Premium Brand Symbol
 * Concept B: "CG Geometric Monogram Sanctuary"
 * An interconnected architectural glyph merging 'C' (Choose / Shelter) and 'G' (Ghar / Doorway)
 * with a golden hearth keystone (#E5A83B) at its apex.
 */
export function BrandSymbol({
	size = "md",
	themeMode = "auto",
	className = "",
}: {
	size?: "sm" | "md" | "lg";
	themeMode?: "auto" | "light" | "dark" | "monochrome";
	className?: string;
}) {
	const sizeMap = {
		sm: "h-8 w-8 rounded-lg",
		md: "h-9.5 w-9.5 rounded-xl",
		lg: "h-11 w-11 rounded-2xl",
	};

	const isForcedDark = themeMode === "dark";
	const isForcedLight = themeMode === "light";
	const isMonochrome = themeMode === "monochrome";

	return (
		<div
			className={`shadow-xs relative flex shrink-0 items-center justify-center transition-all ${
				sizeMap[size]
			} ${
				isMonochrome
					? "bg-slate-900 text-white"
					: isForcedDark
						? "bg-[#133E2F] ring-1 ring-[#25634B]/60"
						: isForcedLight
							? "bg-[#0B2B20] ring-1 ring-[#0B2B20]/15"
							: "bg-[#0B2B20] ring-1 ring-[#0B2B20]/15 dark:bg-[#133E2F] dark:ring-[#25634B]/60"
			} ${className}`}
		>
			<svg
				className='h-[62%] w-[62%]'
				viewBox='0 0 32 32'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'
				aria-hidden='true'
			>
				{/* Outer 'C' Ribbon (Shelter, Horizon & Community) */}
				<path
					d='M22.8 10.4C21 8.2 18.2 7 15.2 7C9.9 7 5.6 11 5.6 16.2C5.6 21.4 9.9 25.4 15.2 25.4C19.4 25.4 23 22.8 24.2 19'
					stroke='#FFFFFF'
					strokeWidth='2.8'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>

				{/* Inner 'G' Architectural Flow (Doorway, Floorplan & Threshold) */}
				<path
					d='M15.2 12C12.7 12 10.7 13.9 10.7 16.2C10.7 18.5 12.7 20.4 15.2 20.4C17.7 20.4 19.7 18.5 19.7 16.2V15.8H15.2'
					stroke={isMonochrome ? "#FFFFFF" : "#34D399"}
					strokeWidth='2.4'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>

				{/* Golden Keystone / Hearth Diamond Accent */}
				<path
					d='M23.8 7.8L26.2 10.2L23.8 12.6L21.4 10.2Z'
					fill={isMonochrome ? "#FFFFFF" : "#E5A83B"}
				/>
			</svg>
		</div>
	);
}

export function BrandLogo({
	className = "",
	href = "/",
	variant = "default",
	themeMode = "auto",
	size = "md",
	showSubtitle = false,
}: BrandLogoProps) {
	const isSymbolOnly = variant === "symbol";
	const isForcedDark = themeMode === "dark";

	const textSizeMap = {
		sm: "text-base",
		md: "text-lg sm:text-[19px]",
		lg: "text-xl sm:text-2xl",
	};

	return (
		<Link
			href={href}
			className={`inline-flex items-center gap-2.5 transition-opacity hover:opacity-95 ${className}`}
			aria-label='Choose Ghar'
		>
			<BrandSymbol size={size} themeMode={themeMode} />

			{!isSymbolOnly && (
				<div className='flex items-center'>
					{/* Brand Wordmark */}
					<span
						className={`font-inter font-extrabold leading-none tracking-tight ${
							textSizeMap[size]
						} ${
							isForcedDark ? "text-white" : "text-[#0B2B20] dark:text-white"
						}`}
					>
						<span>Choose</span>{" "}
						<span
							className={
								isForcedDark
									? "text-[#34D399]"
									: "text-[#1A533F] dark:text-[#34D399]"
							}
						>
							Ghar
						</span>
					</span>

					{/* Optional Tagline / Subtitle */}
					{showSubtitle && (
						<span
							className={`ml-2 text-[9px] font-semibold uppercase tracking-[0.14em] ${
								isForcedDark
									? "text-[#A7F3D0]"
									: "text-[#059669] dark:text-[#34D399]"
							}`}
						>
							PG &amp; Hostel
						</span>
					)}
				</div>
			)}
		</Link>
	);
}
