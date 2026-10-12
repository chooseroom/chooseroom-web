"use client";
import Header from "@/components/Common/Dashboard/Header";
import Sidebar from "@/components/Common/Dashboard/Sidebar";
import { sidebarData } from "@/staticData/sidebarData";
import { useState } from "react";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
	const [openSidebar, setOpenSidebar] = useState(false);

	return (
		<>
			<main className='min-h-screen bg-[#FBF9F5] dark:bg-[#0E1713]'>
				<aside
					className={`fixed left-0 top-0 z-[999] h-screen w-[290px] overflow-y-auto border-r border-[#E8E3D8] bg-white duration-300 dark:border-slate-800 dark:bg-[#071711] ${
						openSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
					}`}
				>
					<Sidebar sidebarData={sidebarData} />
				</aside>
				<div
					onClick={() => setOpenSidebar(false)}
					className={`fixed inset-0 z-[99] h-screen w-full bg-dark/80 lg:hidden ${
						openSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
					}`}
				></div>
				<section className='lg:ml-[290px]'>
					<Header openSidebar={openSidebar} setOpenSidebar={setOpenSidebar} />
					<div className='p-5 pt-12 md:p-10'>{children}</div>
				</section>
			</main>
		</>
	);
};

export default AdminLayout;
