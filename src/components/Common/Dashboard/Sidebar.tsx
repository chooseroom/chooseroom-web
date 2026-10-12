"use client";

import { BrandLogo } from "@/components/Common/BrandLogo";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({
	sidebarOthersData,
	sidebarData,
	sidebarRef,
}: any) {
	const pathname = usePathname();
	const t = useTranslations("sidebar");

	return (
		<>
			<div
				ref={sidebarRef}
				className='flex min-h-full flex-col justify-between px-6 py-8'
			>
				<div>
					<div className='mb-8'>
						<BrandLogo
							href={pathname.startsWith("/admin") ? "/admin" : "/user"}
						/>
					</div>
					<div className='mb-6'>
						<p className='mb-4 font-satoshi text-sm font-medium uppercase text-body dark:text-gray-6'>
							{t("main_menu")}
						</p>
						<ul className='space-y-2'>
							{sidebarData &&
								sidebarData?.map((item: any, key: number) => (
									<li key={key}>
										{item?.comingSoon ? (
											<div
												className='flex w-full cursor-not-allowed select-none items-center gap-3 rounded-lg px-3.5 py-3 font-satoshi font-medium text-slate-400 dark:text-slate-500'
												title={`${item?.title || "This module"} is in active development (${item.comingSoon})`}
											>
												<span className='h-[24px] w-[24px] opacity-60'>
													{item?.icon}
												</span>
												<span className='flex-1 truncate'>
													{item?.title ||
														(item?.titleKey ? t(item?.titleKey) : "")}
												</span>
												<span className='ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
													{typeof item.comingSoon === "string"
														? item.comingSoon
														: "Planned"}
												</span>
											</div>
										) : (
											<Link
												href={item?.path}
												className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 font-satoshi font-medium duration-300 ${
													pathname === `${item.path}`
														? "bg-primary bg-opacity-10 text-primary dark:bg-white dark:bg-opacity-10 dark:text-white"
														: "text-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary dark:text-gray-5 dark:hover:bg-white dark:hover:bg-opacity-10 dark:hover:text-white"
												}`}
											>
												<span className='h-[24px] w-[24px]'>{item?.icon}</span>
												<span className='flex-1 truncate'>
													{item?.title ||
														(item?.titleKey ? t(item?.titleKey) : "")}
												</span>
											</Link>
										)}
									</li>
								))}
						</ul>
					</div>
					{sidebarOthersData && (
						<div>
							<p className='mb-4 font-satoshi text-sm font-medium uppercase text-body dark:text-gray-6'>
								{t("others")}
							</p>
							<ul className='space-y-2'>
								{sidebarOthersData?.map((item: any) => (
									<li key={item?.id}>
										<Link
											href={`${item?.path}`}
											className={`flex w-full items-center gap-3 rounded-lg px-3.5 py-3 font-satoshi font-medium duration-300 ${
												pathname === `${item.path}`
													? "bg-primary bg-opacity-10 text-primary dark:bg-white dark:bg-opacity-10 dark:text-white"
													: "text-dark hover:bg-primary hover:bg-opacity-10 hover:text-primary dark:text-gray-5 dark:hover:bg-white dark:hover:bg-opacity-10 dark:hover:text-white"
											}`}
										>
											<span>{item?.icon}</span>
											{t(item?.titleKey)}
										</Link>
									</li>
								))}
							</ul>
						</div>
					)}
				</div>

				{/* Bottom Logout Button */}
				<div className='mt-8 border-t border-[#E8E3D8] pt-4 dark:border-[#1E382B]'>
					<button
						type='button'
						onClick={() => signOut({ callbackUrl: "/auth/signin" })}
						className='group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 font-satoshi font-medium text-slate-600 transition-colors duration-200 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
					>
						<span className='flex h-[24px] w-[24px] items-center justify-center text-slate-500 transition-colors group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-400'>
							<svg
								width='20'
								height='20'
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
						<span className='truncate font-medium'>Log Out</span>
					</button>
				</div>
			</div>
		</>
	);
}
