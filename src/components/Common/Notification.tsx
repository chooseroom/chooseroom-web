"use client";

import React from "react";
import Link from "next/link";

export interface NotificationCardProps {
	id?: string;
	title?: string;
	description?: string;
	timestamp?: string;
	type?: "info" | "success" | "warning" | "security";
	link?: string;
	category?: string;
	isRead?: boolean;
	onMarkRead?: (id: string) => void;
	onDismiss?: (id: string) => void;
}

export default function Notification({
	id = "1",
	title = "System Notification",
	description = "ChooseBed notification updates and alerts.",
	timestamp,
	type = "info",
	link = "#",
	isRead = false,
	onMarkRead,
	onDismiss,
}: NotificationCardProps) {
	const renderIcon = () => {
		if (type === "success") {
			return (
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400 sm:h-11 sm:w-11'>
					<svg
						className='h-5 w-5'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						strokeWidth={2}
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
						/>
					</svg>
				</div>
			);
		}
		if (type === "security") {
			return (
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/70 dark:text-amber-400 sm:h-11 sm:w-11'>
					<svg
						className='h-5 w-5'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						strokeWidth={2}
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
						/>
					</svg>
				</div>
			);
		}
		if (type === "warning") {
			return (
				<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/70 dark:text-rose-400 sm:h-11 sm:w-11'>
					<svg
						className='h-5 w-5'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						strokeWidth={2}
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
						/>
					</svg>
				</div>
			);
		}
		return (
			<div className='dark:text-primary-light flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 sm:h-11 sm:w-11'>
				<svg
					className='h-5 w-5'
					fill='none'
					viewBox='0 0 24 24'
					stroke='currentColor'
					strokeWidth={2}
				>
					<path
						strokeLinecap='round'
						strokeLinejoin='round'
						d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
					/>
				</svg>
			</div>
		);
	};

	const formatRelativeTime = (timeString?: string) => {
		if (!timeString) return "Recent";
		try {
			const diffMs = Date.now() - new Date(timeString).getTime();
			const diffSec = Math.floor(diffMs / 1000);
			if (diffSec < 60) return "Just now";
			const diffMin = Math.floor(diffSec / 60);
			if (diffMin < 60) return `${diffMin}m ago`;
			const diffHours = Math.floor(diffMin / 60);
			if (diffHours < 24) return `${diffHours}h ago`;
			const diffDays = Math.floor(diffHours / 24);
			if (diffDays === 1) return "Yesterday";
			if (diffDays < 7) return `${diffDays} days ago`;
			return new Date(timeString).toLocaleDateString("en-IN", {
				month: "short",
				day: "numeric",
			});
		} catch {
			return "Recent";
		}
	};

	return (
		<div
			className={`group relative mb-3.5 flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-all sm:p-5 ${
				!isRead
					? "border-primary/20 bg-white dark:border-primary/20 dark:bg-gray-dark"
					: "border-slate-100 bg-white/70 opacity-90 dark:border-slate-800 dark:bg-gray-dark/70"
			}`}
		>
			{/* Icon visible on ALL viewports */}
			{renderIcon()}

			{/* Notification details */}
			<div className='min-w-0 flex-1 pr-6'>
				<div className='flex flex-wrap items-center gap-2'>
					<h5 className='text-sm font-bold text-dark dark:text-white sm:text-base'>
						{title}
					</h5>
					{!isRead && (
						<span className='inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-primary/20'>
							New
						</span>
					)}
				</div>
				<p className='mt-1 text-xs leading-relaxed text-body dark:text-gray-4 sm:text-sm'>
					{description}
				</p>
				<div className='mt-2.5 flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500'>
					<span>{formatRelativeTime(timestamp)}</span>
					{link && link !== "#" && (
						<Link
							href={link}
							onClick={() => onMarkRead?.(id)}
							className='dark:text-primary-light font-semibold text-primary hover:underline'
						>
							View details →
						</Link>
					)}
				</div>
			</div>

			{/* Dismiss Button */}
			{onDismiss && (
				<button
					type='button'
					onClick={() => onDismiss(id)}
					title='Dismiss'
					className='absolute right-3 top-3 rounded-lg p-1 text-slate-400 opacity-60 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300'
				>
					<svg
						className='h-4 w-4'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M6 18L18 6M6 6l12 12'
						/>
					</svg>
				</button>
			)}
		</div>
	);
}
