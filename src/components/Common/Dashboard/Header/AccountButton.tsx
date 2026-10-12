"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import AccountMenu from "../../AccountMenu";

export default function AccountButton({ user }: any) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef<HTMLDivElement>(null);

	const hasCustomImage =
		user?.image &&
		!user.image.includes("profile-avatar.png") &&
		(user.image.startsWith("http") || user.image.startsWith("/"));

	const profilePic = hasCustomImage
		? user.image.startsWith("http")
			? user.image
			: `${process.env.NEXT_PUBLIC_IMAGE_URL || ""}/${user.image}`
		: null;

	const initial = (user?.name?.[0] || user?.email?.[0] || "U").toUpperCase();

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen]);

	return (
		<div ref={dropdownRef} className='relative'>
			<button
				type='button'
				onClick={() => setIsOpen((prev) => !prev)}
				className='flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-slate-100 focus:outline-none dark:hover:bg-white/5'
				aria-expanded={isOpen}
			>
				{profilePic ? (
					<img
						src={profilePic}
						alt={user?.name || "profile"}
						className='size-10 overflow-hidden rounded-full object-cover ring-2 ring-emerald-500/20'
					/>
				) : (
					<div className='flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1A382B] to-[#10B981] font-satoshi text-sm font-bold text-white shadow-sm ring-2 ring-emerald-500/20'>
						{initial}
					</div>
				)}

				<span className='hidden font-satoshi text-sm font-semibold capitalize text-dark dark:text-white sm:inline-block'>
					{user?.name || "User"}
				</span>

				<svg
					className={`text-slate-500 transition-transform duration-200 dark:text-slate-400 ${
						isOpen ? "rotate-180" : ""
					}`}
					width='16'
					height='16'
					viewBox='0 0 20 20'
					fill='none'
					xmlns='http://www.w3.org/2000/svg'
				>
					<path
						fillRule='evenodd'
						clipRule='evenodd'
						d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
						fill='currentColor'
					/>
				</svg>
			</button>

			{/* Dropdown Menu */}
			{isOpen && (
				<div className='absolute right-0 top-full z-[9999] mt-2 w-[280px] rounded-2xl border border-[#E8E3D8] bg-white pb-2 pt-2.5 shadow-2xl shadow-black/10 transition-all dark:border-[#1E382B] dark:bg-[#071711]'>
					<AccountMenu user={user} onClose={() => setIsOpen(false)} />
				</div>
			)}
		</div>
	);
}
