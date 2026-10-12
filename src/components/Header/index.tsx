"use client";
import { BrandLogo } from "@/components/Common/BrandLogo";
import { onScroll } from "@/libs/scrollActive";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import GlobalSearchModal from "../GlobalSearch";
import Account from "./Account";
import Dropdown from "./Dropdown";
import ThemeSwitcher from "./ThemeSwitcher";
import { menuData } from "./menuData";

const Header = () => {
	const t = useTranslations("header");
	const [stickyMenu, setStickyMenu] = useState(false);
	const [searchModalOpen, setSearchModalOpen] = useState(false);
	const { data: session } = useSession();

	const pathUrl = usePathname();

	const handleStickyMenu = () => {
		if (window.scrollY > 0) {
			setStickyMenu(true);
		} else {
			setStickyMenu(false);
		}
	};

	// Navbar toggle
	const [navbarOpen, setNavbarOpen] = useState(false);
	const navbarToggleHandler = () => {
		setNavbarOpen((prev) => !prev);
	};

	// Auto-close on route change
	useEffect(() => {
		setNavbarOpen(false);
	}, [pathUrl]);

	// Auto-close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setNavbarOpen(false);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	useEffect(() => {
		if (window.location.pathname === "/") {
			window.addEventListener("scroll", onScroll);
		}

		return () => {
			window.removeEventListener("scroll", onScroll);
		};
	}, []);

	useEffect(() => {
		window.addEventListener("scroll", handleStickyMenu);
		return () => window.removeEventListener("scroll", handleStickyMenu);
	}, []);

	return (
		<>
			<header
				className={`fixed left-0 top-0 z-999 w-full transition-all duration-300 ease-in-out ${
					stickyMenu
						? "border-b border-[#E8E3D8] bg-[#FBF9F5]/95 py-3.5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-[#0E1713]/95 xl:py-2"
						: "bg-transparent py-6 xl:py-4"
				}`}
			>
				<div className='relative mx-auto max-w-[1170px] items-center justify-between px-4 sm:px-8 xl:flex xl:px-0'>
					<div className='flex w-full shrink-0 items-center justify-between xl:w-auto'>
						<BrandLogo className='py-2' />

						{/* Hamburger Toggle Button */}
						<button
							onClick={navbarToggleHandler}
							aria-label='Toggle navigation menu'
							className='flex size-10 items-center justify-center rounded-xl border border-[#E8E3D8] bg-white p-2 text-slate-800 shadow-sm transition hover:border-emerald-600 dark:border-[#1E382B] dark:bg-[#071711] dark:text-white xl:hidden'
						>
							<span className='relative block size-5 cursor-pointer'>
								<span className='du-block absolute right-0 size-full'>
									<span
										className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-current delay-[0] duration-200 ease-in-out ${
											!navbarOpen && "!w-full delay-300"
										}`}
									></span>
									<span
										className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-current delay-150 duration-200 ease-in-out ${
											!navbarOpen && "delay-400 !w-full"
										}`}
									></span>
									<span
										className={`relative left-0 top-0 my-1 block h-0.5 w-0 rounded-sm bg-current delay-200 duration-200 ease-in-out ${
											!navbarOpen && "!w-full delay-500"
										}`}
									></span>
								</span>
								<span className='du-block absolute right-0 size-full rotate-45'>
									<span
										className={`absolute left-2.5 top-0 block h-full w-0.5 rounded-sm bg-current delay-300 duration-200 ease-in-out ${
											!navbarOpen && "!h-0 delay-[0]"
										}`}
									></span>
									<span
										className={`delay-400 absolute left-0 top-2.5 block h-0.5 w-full rounded-sm bg-current duration-200 ease-in-out ${
											!navbarOpen && "dealy-200 !h-0"
										}`}
									></span>
								</span>
							</span>
						</button>
					</div>

					{/* Navigation Drawer Container */}
					<div
						className={`invisible h-0 w-full items-center justify-between xl:visible xl:flex xl:h-auto ${
							navbarOpen &&
							"!visible relative mt-3 !h-auto max-h-[calc(100vh-100px)] overflow-y-auto overflow-x-hidden rounded-2xl border border-[#E8E3D8] bg-white p-5 shadow-2xl dark:border-[#1E382B] dark:bg-[#071711]"
						}`}
					>
						<nav className='lg:mx-auto'>
							<ul className='flex flex-col gap-3 xl:flex-row xl:items-center xl:gap-2.5'>
								{menuData?.map((item, key) =>
									!item?.path && item?.submenu ? (
										<Dropdown
											stickyMenu={stickyMenu}
											item={item}
											key={key}
											setNavbarOpen={setNavbarOpen}
										/>
									) : (
										<li
											key={key}
											className={`${
												item?.submenu ? "group relative" : "nav__menu"
											} ${stickyMenu ? "xl:py-4" : "xl:py-6"}`}
										>
											<Link
												onClick={() => setNavbarOpen(false)}
												href={
													item?.path
														? item?.path.includes("#") && !item?.newTab
															? `/${item?.path}`
															: item?.path
														: ""
												}
												target={item?.newTab ? "_blank" : ""}
												rel={item?.newTab ? "noopener noreferrer" : ""}
												className={`flex truncate rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
													pathUrl === item?.path
														? "bg-[#059669]/10 font-semibold text-[#059669] dark:bg-emerald-500/15 dark:text-[#34D399]"
														: "hover:bg-[#059669]/8 text-[#2D3732] hover:text-[#059669] dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
												} ${item?.path?.startsWith("#") ? "menu-scroll" : ""}`}
											>
												{t(item?.titleKey)}
											</Link>
										</li>
									)
								)}
							</ul>
						</nav>

						{/* Right Actions / Account & Theme */}
						<div className='mt-5 flex flex-col gap-3 border-t border-[#E8E3D8] pt-4 dark:border-[#1E382B] xl:mt-0 xl:flex-row xl:items-center xl:gap-4 xl:border-0 xl:pt-0'>
							{/* Search & Theme Controls */}
							<div className='flex items-center justify-between xl:justify-start'>
								<span className='text-xs font-semibold text-slate-500 dark:text-slate-400 xl:hidden'>
									Appearance
								</span>

								<div className='flex items-center gap-2'>
									<button
										onClick={() => setSearchModalOpen(true)}
										aria-label='Search'
										className='text-waterloo hidden size-[38px] items-center justify-center rounded-full transition hover:bg-slate-100 dark:hover:bg-white/5 sm:flex'
									>
										<svg
											width='18'
											height='18'
											viewBox='0 0 18 18'
											fill='currentColor'
										>
											<path
												d='M16.9347 15.3963L12.4816 11.7799C14.3168 9.26991 14.1279 5.68042 11.8338 3.41337C10.6194 2.19889 9.00003 1.52417 7.27276 1.52417C5.54549 1.52417 3.92617 2.19889 2.71168 3.41337C0.201738 5.92332 0.201738 10.0256 2.71168 12.5355C3.92617 13.75 5.54549 14.4247 7.27276 14.4247C8.91907 14.4247 10.4574 13.804 11.6719 12.6975L16.179 16.3409C16.287 16.4219 16.4219 16.4759 16.5569 16.4759C16.7458 16.4759 16.9077 16.3949 17.0157 16.26C17.2316 15.9901 17.2046 15.6122 16.9347 15.3963ZM7.27276 13.2102C5.86935 13.2102 4.5739 12.6705 3.57532 11.6719C1.52418 9.62076 1.52418 6.30116 3.57532 4.27701C4.5739 3.27843 5.86935 2.73866 7.27276 2.73866C8.67617 2.73866 9.97162 3.27843 10.9702 4.27701C13.0213 6.32815 13.0213 9.64775 10.9702 11.6719C9.99861 12.6705 8.67617 13.2102 7.27276 13.2102Z'
												fill='currentColor'
											/>
										</svg>
									</button>

									<ThemeSwitcher />
								</div>
							</div>

							{session?.user ? (
								<Account
									navbarOpen={navbarOpen}
									onClose={() => setNavbarOpen(false)}
								/>
							) : (
								<div className='flex flex-col gap-2 pt-2 xl:flex-row xl:items-center xl:pt-0'>
									<Link
										onClick={() => setNavbarOpen(false)}
										href='/auth/signin'
										className='rounded-xl border border-[#E8E3D8] px-4 py-2.5 text-center text-sm font-semibold text-[#0B2B20] transition-colors hover:text-[#059669] dark:border-[#1E382B] dark:text-slate-200 dark:hover:text-white xl:border-0'
									>
										Sign In
									</Link>

									<Link
										onClick={() => setNavbarOpen(false)}
										href='/auth/signup'
										className='rounded-xl bg-[#0B2B20] px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#133E2F] dark:bg-white dark:text-[#0B2B20] dark:hover:bg-slate-100'
									>
										Register Your PG
									</Link>
								</div>
							)}
						</div>
					</div>
				</div>
			</header>

			<GlobalSearchModal
				searchModalOpen={searchModalOpen}
				setSearchModalOpen={setSearchModalOpen}
			/>
		</>
	);
};

export default Header;
