"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Notification from "./Notification";
import { SystemNotification } from "@/app/api/notifications/route";

interface NotificationsViewProps {
	role?: string;
}

export default function NotificationsView({ role }: NotificationsViewProps) {
	const [notifications, setNotifications] = useState<SystemNotification[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeFilter, setActiveFilter] = useState<
		"all" | "unread" | "property" | "system"
	>("all");
	const [readIds, setReadIds] = useState<string[]>([]);
	const [dismissedIds, setDismissedIds] = useState<string[]>([]);
	const [searchQuery, setSearchQuery] = useState("");

	const storagePrefix = `cg_notifs_${role?.toLowerCase() || "user"}`;

	// Load stored read and dismissed states
	useEffect(() => {
		try {
			const savedRead = localStorage.getItem(`${storagePrefix}_read`);
			const savedDismissed = localStorage.getItem(`${storagePrefix}_dismissed`);
			if (savedRead) setReadIds(JSON.parse(savedRead));
			if (savedDismissed) setDismissedIds(JSON.parse(savedDismissed));
		} catch {
			// fallback
		}
	}, [storagePrefix]);

	// Fetch notifications
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

	// Actions
	const handleMarkAllRead = () => {
		const allIds = notifications.map((n) => n.id);
		const updated = Array.from(new Set([...readIds, ...allIds]));
		setReadIds(updated);
		try {
			localStorage.setItem(`${storagePrefix}_read`, JSON.stringify(updated));
		} catch {
			// fallback
		}
	};

	const handleMarkSingleRead = (id: string) => {
		if (!readIds.includes(id)) {
			const updated = [...readIds, id];
			setReadIds(updated);
			try {
				localStorage.setItem(`${storagePrefix}_read`, JSON.stringify(updated));
			} catch {
				// fallback
			}
		}
	};

	const handleDismissSingle = (id: string) => {
		const updated = [...dismissedIds, id];
		setDismissedIds(updated);
		try {
			localStorage.setItem(
				`${storagePrefix}_dismissed`,
				JSON.stringify(updated)
			);
		} catch {
			// fallback
		}
	};

	const handleClearAll = () => {
		const allIds = notifications.map((n) => n.id);
		const updated = Array.from(new Set([...dismissedIds, ...allIds]));
		setDismissedIds(updated);
		try {
			localStorage.setItem(
				`${storagePrefix}_dismissed`,
				JSON.stringify(updated)
			);
		} catch {
			// fallback
		}
	};

	// Filters
	const visibleNotifications = notifications.filter(
		(n) => !dismissedIds.includes(n.id)
	);

	const unreadCount = visibleNotifications.filter(
		(n) => !readIds.includes(n.id)
	).length;

	const filteredList = visibleNotifications.filter((n) => {
		// Category / Read Filter
		if (activeFilter === "unread" && readIds.includes(n.id)) return false;
		if (activeFilter === "property" && n.category !== "property") return false;
		if (
			activeFilter === "system" &&
			n.category !== "system" &&
			n.category !== "security"
		)
			return false;

		// Search Query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			return (
				n.title.toLowerCase().includes(query) ||
				n.description.toLowerCase().includes(query)
			);
		}

		return true;
	});

	return (
		<div className='space-y-6'>
			{/* Controls and Stats Bar */}
			<div className='flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-gray-dark sm:flex-row sm:items-center sm:justify-between sm:p-5'>
				{/* Search input */}
				<div className='relative w-full sm:max-w-xs'>
					<input
						type='text'
						placeholder='Search notifications...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-primary focus:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-white dark:placeholder-slate-500 sm:text-sm'
					/>
					<svg
						className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
						/>
					</svg>
				</div>

				{/* Action Buttons */}
				<div className='flex items-center gap-2.5 sm:gap-3'>
					{unreadCount > 0 && (
						<button
							type='button'
							onClick={handleMarkAllRead}
							className='flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
						>
							<svg
								className='h-3.5 w-3.5 text-primary'
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
							Mark all read
						</button>
					)}

					{visibleNotifications.length > 0 && (
						<button
							type='button'
							onClick={handleClearAll}
							className='flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
						>
							Clear all
						</button>
					)}
				</div>
			</div>

			{/* Filter Tabs */}
			<div className='flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800'>
				<button
					type='button'
					onClick={() => setActiveFilter("all")}
					className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
						activeFilter === "all"
							? "bg-primary text-white shadow-sm"
							: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					}`}
				>
					All ({visibleNotifications.length})
				</button>
				<button
					type='button'
					onClick={() => setActiveFilter("unread")}
					className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
						activeFilter === "unread"
							? "bg-primary text-white shadow-sm"
							: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					}`}
				>
					Unread ({unreadCount})
				</button>
				<button
					type='button'
					onClick={() => setActiveFilter("property")}
					className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
						activeFilter === "property"
							? "bg-primary text-white shadow-sm"
							: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					}`}
				>
					Properties
				</button>
				<button
					type='button'
					onClick={() => setActiveFilter("system")}
					className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
						activeFilter === "system"
							? "bg-primary text-white shadow-sm"
							: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
					}`}
				>
					System & Security
				</button>
			</div>

			{/* Notification List */}
			{loading ? (
				<div className='flex items-center justify-center rounded-xl border border-slate-200 bg-white py-16 text-xs text-slate-400 dark:border-slate-800 dark:bg-gray-dark'>
					<div className='mr-2.5 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent' />
					Loading notifications...
				</div>
			) : filteredList.length === 0 ? (
				<div className='rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-12 text-center dark:border-slate-700 dark:bg-slate-800/40'>
					<div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'>
						<svg
							className='h-6 w-6'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth={1.5}
								d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
							/>
						</svg>
					</div>
					<h4 className='text-sm font-bold text-slate-800 dark:text-white'>
						No notifications to show
					</h4>
					<p className='mt-1 text-xs text-slate-400'>
						{searchQuery
							? "No notifications matched your search term."
							: activeFilter === "unread"
								? "All notifications have been marked as read."
								: "You're all caught up with everything!"}
					</p>
				</div>
			) : (
				<div className='space-y-3'>
					{filteredList.map((item) => (
						<Notification
							key={item.id}
							id={item.id}
							title={item.title}
							description={item.description}
							timestamp={item.timestamp}
							type={item.type}
							link={item.link}
							category={item.category}
							isRead={readIds.includes(item.id)}
							onMarkRead={handleMarkSingleRead}
							onDismiss={handleDismissSingle}
						/>
					))}
				</div>
			)}
		</div>
	);
}
