"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import NotificationItem from "./NotificationItem";
import { SystemNotification } from "@/app/api/notifications/route";

export default function Notifications({ role }: { role?: string }) {
	const [isOpen, setIsOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
	const [notifications, setNotifications] = useState<SystemNotification[]>([]);
	const [readIds, setReadIds] = useState<string[]>([]);
	const [dismissedIds, setDismissedIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);

	const dropdownRef = useRef<HTMLDivElement | null>(null);

	// Safe storage key based on role
	const storagePrefix = `cg_notifs_${role?.toLowerCase() || "user"}`;

	// Load stored state from localStorage
	useEffect(() => {
		try {
			const savedRead = localStorage.getItem(`${storagePrefix}_read`);
			const savedDismissed = localStorage.getItem(`${storagePrefix}_dismissed`);
			if (savedRead) setReadIds(JSON.parse(savedRead));
			if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed));
		} catch {
			// localStorage unavailable or restricted
		}
	}, [storagePrefix]);

	// Fetch notifications from API
	const fetchNotifications = useCallback(async () => {
		try {
			setLoading(true);
			const res = await axios.get("/api/notifications");
			if (res.data?.notifications) {
				setNotifications(res.data.notifications);
			}
		} catch (err) {
			console.error("Failed to load notifications:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchNotifications();
	}, [fetchNotifications]);

	// Toggle dropdown
	const handleToggle = () => {
		setIsOpen((prev) => !prev);
		if (!isOpen) {
			// Re-fetch on open for freshness
			fetchNotifications();
		}
	};

	// Mark all as read
	const handleMarkAllRead = () => {
		const allIds = notifications.map((n) => n.id);
		const updated = Array.from(new Set([...readIds, ...allIds]));
		setReadIds(updated);
		try {
			localStorage.setItem(`${storagePrefix}_read`, JSON.stringify(updated));
		} catch {
			// silent fallback
		}
	};

	// Mark single notification as read
	const handleMarkRead = (id: string) => {
		if (!readIds.includes(id)) {
			const updated = [...readIds, id];
			setReadIds(updated);
			try {
				localStorage.setItem(`${storagePrefix}_read`, JSON.stringify(updated));
			} catch {
				// silent fallback
			}
		}
		setIsOpen(false);
	};

	// Dismiss single notification
	const handleDismiss = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		e.preventDefault();
		const updated = [...dismissedIds, id];
		setDismissedIds(updated);
		try {
			localStorage.setItem(
				`${storagePrefix}_dismissed`,
				JSON.stringify(updated)
			);
		} catch {
			// silent fallback
		}
	};

	// Click outside & Escape key listeners
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				setIsOpen(false);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			document.addEventListener("keydown", handleKeyDown);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen]);

	// Active filtered notifications
	const visibleNotifications = notifications.filter(
		(n) => !dismissedIds.includes(n.id)
	);
	const unreadNotifications = visibleNotifications.filter(
		(n) => !readIds.includes(n.id)
	);
	const unreadCount = unreadNotifications.length;

	const displayedList =
		activeTab === "unread" ? unreadNotifications : visibleNotifications;

	const targetNotificationsUrl =
		role?.toLowerCase() === "admin"
			? "/admin/notifications"
			: "/user/notifications";

	return (
		<div className='relative' ref={dropdownRef}>
			{/* Bell Button - Visible on all devices (mobile, tablet, desktop) */}
			<button
				type='button'
				aria-label={`Notifications, ${unreadCount} unread`}
				aria-expanded={isOpen}
				onClick={handleToggle}
				className='relative flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-full border border-stroke bg-gray-2 text-dark transition-colors duration-200 hover:bg-gray-3 hover:text-primary dark:border-stroke-dark dark:bg-gray-dark dark:text-white dark:hover:bg-slate-800 dark:hover:text-primary sm:h-10 sm:w-10'
			>
				{/* Unread Badge Counter */}
				{unreadCount > 0 && (
					<span className='absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-dark'>
						{unreadCount > 9 ? "9+" : unreadCount}
					</span>
				)}

				{/* Bell SVG */}
				<svg
					width='19'
					height='19'
					viewBox='0 0 20 20'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'
					className='transition-transform duration-200 group-hover:scale-110'
				>
					<path
						fillRule='evenodd'
						clipRule='evenodd'
						d='M9.99999 1.04167C6.43315 1.04167 3.54166 3.93317 3.54166 7.50001V8.08676C3.54166 8.66753 3.36975 9.2353 3.0476 9.71853L2.09043 11.1543C0.979516 12.8207 1.82761 15.0857 3.75977 15.6126C4.38944 15.7843 5.02444 15.9296 5.66311 16.0484L5.66469 16.0527C6.30552 17.7626 8.01828 18.9583 9.99994 18.9583C11.9816 18.9583 13.6944 17.7626 14.3352 16.0527L14.3368 16.0484C14.9755 15.9296 15.6105 15.7844 16.2402 15.6126C18.1724 15.0857 19.0205 12.8207 17.9096 11.1543L16.9524 9.71853C16.6302 9.2353 16.4583 8.66753 16.4583 8.08676V7.50001C16.4583 3.93317 13.5668 1.04167 9.99999 1.04167ZM12.8137 16.2808C10.9445 16.5041 9.05533 16.5041 7.1862 16.2808C7.77866 17.1321 8.80914 17.7083 9.99994 17.7083C11.1907 17.7083 12.2212 17.1321 12.8137 16.2808ZM4.79166 7.50001C4.79166 4.62352 7.12351 2.29167 9.99999 2.29167C12.8765 2.29167 15.2083 4.62352 15.2083 7.50001V8.08676C15.2083 8.91431 15.4533 9.72334 15.9123 10.4119L16.8695 11.8477C17.5071 12.8041 17.0203 14.1042 15.9113 14.4067C12.0411 15.4622 7.95887 15.4622 4.08866 14.4067C2.97964 14.1042 2.49285 12.8041 3.13049 11.8477L4.08766 10.4119C4.5467 9.72334 4.79166 8.91431 4.79166 8.08676V7.50001Z'
						fill='currentColor'
					/>
				</svg>
			</button>

			{/* Dropdown Popup - Completely Responsive on Mobile, Tablet & Desktop */}
			{isOpen && (
				<div
					role='region'
					aria-label='Notifications list'
					className='absolute right-0 top-full z-99999 mt-2.5 w-[calc(100vw-1.5rem)] max-w-[380px] origin-top-right rounded-xl border border-slate-200/90 bg-white shadow-xl dark:border-slate-800 dark:bg-gray-dark dark:shadow-2xl sm:w-[400px]'
				>
					{/* Dropdown Top Bar */}
					<div className='flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800'>
						<div className='flex items-center gap-2'>
							<h3 className='font-satoshi text-sm font-bold text-slate-900 dark:text-white sm:text-base'>
								Notifications
							</h3>
							{unreadCount > 0 && (
								<span className='rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary dark:bg-primary/20'>
									{unreadCount} new
								</span>
							)}
						</div>

						{unreadCount > 0 && (
							<button
								type='button'
								onClick={handleMarkAllRead}
								className='dark:text-primary-light text-xs font-medium text-primary transition hover:underline'
							>
								Mark all read
							</button>
						)}
					</div>

					{/* Tab Filters */}
					<div className='flex border-b border-slate-100 px-3 pt-2 dark:border-slate-800'>
						<button
							type='button'
							onClick={() => setActiveTab("all")}
							className={`relative px-3 pb-2 text-xs font-semibold transition ${
								activeTab === "all"
									? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
									: "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
							}`}
						>
							All ({visibleNotifications.length})
						</button>
						<button
							type='button'
							onClick={() => setActiveTab("unread")}
							className={`relative px-3 pb-2 text-xs font-semibold transition ${
								activeTab === "unread"
									? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
									: "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
							}`}
						>
							Unread ({unreadCount})
						</button>
					</div>

					{/* Scrollable Notification List */}
					<div className='scrollbar-thin max-h-[340px] overflow-y-auto p-2 sm:max-h-[380px]'>
						{loading && notifications.length === 0 ? (
							<div className='flex items-center justify-center py-8 text-xs text-slate-400'>
								<div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
								Loading updates...
							</div>
						) : displayedList.length === 0 ? (
							<div className='py-8 text-center'>
								<div className='mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'>
									<svg
										className='h-5 w-5'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth={1.5}
											d='M5 13l4 4L19 7'
										/>
									</svg>
								</div>
								<p className='text-xs font-semibold text-slate-700 dark:text-slate-300'>
									All caught up!
								</p>
								<p className='mt-0.5 text-[11px] text-slate-400'>
									{activeTab === "unread"
										? "No unread notifications right now."
										: "No notifications found."}
								</p>
							</div>
						) : (
							<div className='space-y-1'>
								{displayedList.map((item) => (
									<NotificationItem
										key={item.id}
										notification={item}
										isRead={readIds.includes(item.id)}
										onItemClick={() => handleMarkRead(item.id)}
										onDismiss={(e) => handleDismiss(e, item.id)}
									/>
								))}
							</div>
						)}
					</div>

					{/* Footer Link */}
					<div className='border-t border-slate-100 p-2.5 dark:border-slate-800'>
						<Link
							href={targetNotificationsUrl}
							onClick={() => setIsOpen(false)}
							className='flex w-full items-center justify-center rounded-lg bg-slate-50 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-primary dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800 sm:text-[13px]'
						>
							See All Notifications
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
