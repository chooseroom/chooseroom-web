"use client";

/* eslint-disable @next/next/no-img-element */
import AccountMenu from "@/components/Common/AccountMenu";
import { adminMenuData, userMenuData } from "@/staticData/sidebarData";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface AccountProps {
	navbarOpen?: boolean;
	onClose?: () => void;
}

export default function Account({ onClose }: AccountProps) {
	const { data: session } = useSession();
	const pathname = usePathname();
	const [desktopDropdown, setDesktopDropdown] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const user = session?.user as any;
	const isAdmin = user?.role === "ADMIN";
	const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

	const hasCustomImage =
		user?.image &&
		!user.image.includes("profile-avatar.png") &&
		(user.image.startsWith("http") || user.image.startsWith("/"));

	const profilePic = hasCustomImage
		? user.image.startsWith("http")
			? user.image
			: `${process.env.NEXT_PUBLIC_IMAGE_URL || ""}/${user.image}`
		: null;

	const menuItems = isAdmin ? adminMenuData : userMenuData;

	// Close desktop dropdown on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setDesktopDropdown(false);
			}
		}

		if (desktopDropdown) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [desktopDropdown]);

	if (!session?.user) return null;

	return (
		<>
			{/* Desktop View (>= xl): Clean Pill Button with Floating Dropdown */}
			<div ref={dropdownRef} className='relative hidden xl:block'>
				<button
					type='button'
					onClick={() => setDesktopDropdown((prev) => !prev)}
					className='flex items-center gap-2.5 rounded-full border border-[#E8E3D8] bg-[#FDFBF7] py-1 pl-1.5 pr-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-white'
					aria-expanded={desktopDropdown}
				>
					{profilePic ? (
						<img
							src={profilePic}
							alt={user?.name || "profile"}
							className='size-7 rounded-full object-cover ring-2 ring-emerald-500/20'
						/>
					) : (
						<div className='flex size-7 items-center justify-center rounded-full bg-gradient-to-br from-[#1A382B] to-[#10B981] font-satoshi text-xs font-bold text-white shadow-sm ring-2 ring-emerald-500/20'>
							{initial}
						</div>
					)}

					<span className='max-w-[120px] truncate text-xs font-semibold'>
						{user?.name || "Account"}
					</span>

					{isAdmin && (
						<span className='font-mono rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'>
							ADMIN
						</span>
					)}

					<svg
						className={`size-3 text-slate-400 transition-transform duration-200 ${
							desktopDropdown ? "rotate-180" : ""
						}`}
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth='2'
							d='M19 9l-7 7-7-7'
						/>
					</svg>
				</button>

				{desktopDropdown && (
					<div className='absolute right-0 top-full z-[9999] mt-2 w-[280px] rounded-2xl border border-[#E8E3D8] bg-white py-2 shadow-2xl dark:border-[#1E382B] dark:bg-[#071711]'>
						<AccountMenu
							user={user}
							onClose={() => setDesktopDropdown(false)}
						/>
					</div>
				)}
			</div>

			{/* Mobile View (< xl): In-flow Card with Zero Horizontal Overflow */}
			<div className='block w-full xl:hidden'>
				<div className='overflow-hidden rounded-2xl border border-[#E8E3D8] bg-[#FDFBF7] p-3.5 shadow-sm dark:border-[#1E382B] dark:bg-[#0A1F17]'>
					{/* User Profile Header */}
					<div className='flex items-center gap-3 border-b border-[#E8E3D8] pb-3 dark:border-[#1E382B]'>
						{profilePic ? (
							<img
								src={profilePic}
								alt={user?.name || "profile"}
								className='size-10 shrink-0 rounded-full object-cover ring-2 ring-emerald-500/20'
							/>
						) : (
							<div className='flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A382B] to-[#10B981] font-satoshi text-sm font-bold text-white shadow-sm ring-2 ring-emerald-500/20'>
								{initial}
							</div>
						)}

						<div className='min-w-0 flex-1'>
							<div className='flex items-center gap-1.5'>
								<p className='truncate font-satoshi text-sm font-bold text-slate-900 dark:text-white'>
									{user?.name || "User"}
								</p>
								{isAdmin && (
									<span className='py-0.2 font-mono rounded bg-emerald-100 px-1.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'>
										ADMIN
									</span>
								)}
							</div>
							<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
								{user?.email}
							</p>
						</div>
					</div>

					{/* Navigation Links */}
					<ul className='space-y-1 pt-2.5'>
						{menuItems.map((item: any) => {
							const isActive = pathname === item.path;
							return (
								<li key={item.id}>
									<Link
										href={item.path}
										onClick={() => onClose?.()}
										className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
											isActive
												? "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
												: "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
										}`}
									>
										<span className='shrink-0 text-slate-500 dark:text-slate-400'>
											{item.icon}
										</span>
										<span>{item.title}</span>
									</Link>
								</li>
							);
						})}

						{/* Secure Sign Out */}
						<li className='border-t border-[#E8E3D8] pt-1.5 dark:border-[#1E382B]'>
							<button
								type='button'
								onClick={() => {
									onClose?.();
									signOut({ callbackUrl: "/auth/signin" });
								}}
								className='flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
							>
								<svg
									className='size-4 shrink-0'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
									/>
								</svg>
								<span>Sign Out</span>
							</button>
						</li>
					</ul>
				</div>
			</div>
		</>
	);
}
