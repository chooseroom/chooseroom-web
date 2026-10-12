"use client";

/* eslint-disable @next/next/no-img-element */
import { adminMenuData, userMenuData } from "@/staticData/sidebarData";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AccountMenuProps {
	user: any;
	onClose?: () => void;
}

const AccountMenu = ({ user, onClose }: AccountMenuProps) => {
	const pathname = usePathname();
	const isAdmin = user?.role === "ADMIN";
	const sidebarData = isAdmin ? adminMenuData : userMenuData;

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
	const t = useTranslations("header.account_menu");

	return (
		<div className='w-full'>
			{/* User Header */}
			<div className='flex items-center gap-x-3 border-b border-[#E8E3D8] px-4 pb-3.5 dark:border-[#1E382B]'>
				{profilePic ? (
					<img
						src={profilePic}
						alt={user?.name || "profile"}
						className='size-11 shrink-0 rounded-full object-cover ring-2 ring-emerald-500/20'
					/>
				) : (
					<div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1A382B] to-[#10B981] font-satoshi text-base font-bold text-white shadow-sm ring-2 ring-emerald-500/20'>
						{initial}
					</div>
				)}

				<div className='min-w-0 flex-1'>
					<div className='flex items-center gap-2'>
						<p className='truncate font-satoshi text-sm font-bold text-dark dark:text-white'>
							{user?.name || "User"}
						</p>
						{isAdmin && (
							<span className='inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'>
								ADMIN
							</span>
						)}
					</div>
					<p className='truncate text-xs text-body dark:text-gray-4'>
						{user?.email}
					</p>
				</div>
			</div>

			{/* Navigation Links */}
			<div className='py-2'>
				<ul className='space-y-0.5 px-2'>
					{sidebarData?.map((item: any) => {
						const isActive = pathname === item.path;
						return (
							<li key={item?.id}>
								<Link
									href={item.path}
									onClick={() => onClose?.()}
									className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
										isActive
											? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
											: "text-slate-700 hover:bg-slate-100 hover:text-dark dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
									}`}
								>
									<span
										className={
											isActive
												? "text-emerald-700 dark:text-emerald-400"
												: "text-slate-500 dark:text-slate-400"
										}
									>
										{item?.icon}
									</span>
									<span>{item.titleKey ? t(item.titleKey) : item.title}</span>
								</Link>
							</li>
						);
					})}

					{/* Logout Button */}
					<li className='mt-1.5 border-t border-[#E8E3D8] pt-1.5 dark:border-[#1E382B]'>
						<button
							type='button'
							className='w-full'
							onClick={() => {
								onClose?.();
								signOut({ callbackUrl: "/auth/signin" });
							}}
						>
							<span className='flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'>
								<span className='text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400'>
									<svg
										width='18'
										height='18'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2'
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
										<polyline points='16 17 21 12 16 7' />
										<line x1='21' y1='12' x2='9' y2='12' />
									</svg>
								</span>
								<span>{t("logOut") || "Logout"}</span>
							</span>
						</button>
					</li>
				</ul>
			</div>
		</div>
	);
};

export default AccountMenu;
