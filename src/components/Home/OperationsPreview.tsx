"use client";

import React, { useState } from "react";

interface BedInfo {
	id: string;
	bedNumber: string;
	status: "occupied" | "available";
	residentName?: string;
	mobileNumber?: string;
	checkInDate?: string;
	monthlyRent?: string;
}

interface RoomInfo {
	roomNumber: string;
	coolingType: "AC" | "Non-AC";
	sharingType: "Single" | "Double" | "Triple";
	capacity: number;
	beds: BedInfo[];
}

const floorData: Record<number, RoomInfo[]> = {
	1: [
		{
			roomNumber: "101",
			coolingType: "AC",
			sharingType: "Double",
			capacity: 2,
			beds: [
				{
					id: "101-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Rahul Sharma",
					mobileNumber: "+91 98765 21043",
					checkInDate: "12 Aug 2026",
					monthlyRent: "₹8,500",
				},
				{
					id: "101-2",
					bedNumber: "Bed 2",
					status: "available",
				},
			],
		},
		{
			roomNumber: "102",
			coolingType: "Non-AC",
			sharingType: "Triple",
			capacity: 3,
			beds: [
				{
					id: "102-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Amit Kumar",
					mobileNumber: "+91 98450 87312",
					checkInDate: "01 Sep 2026",
					monthlyRent: "₹6,000",
				},
				{
					id: "102-2",
					bedNumber: "Bed 2",
					status: "occupied",
					residentName: "Vikram Trivedi",
					mobileNumber: "+91 99012 34567",
					checkInDate: "15 Jul 2026",
					monthlyRent: "₹6,000",
				},
				{
					id: "102-3",
					bedNumber: "Bed 3",
					status: "occupied",
					residentName: "Priya Verma",
					mobileNumber: "+91 97401 23456",
					checkInDate: "20 Jun 2026",
					monthlyRent: "₹6,000",
				},
			],
		},
		{
			roomNumber: "103",
			coolingType: "AC",
			sharingType: "Single",
			capacity: 1,
			beds: [
				{
					id: "103-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Siddharth Mehta",
					mobileNumber: "+91 98123 45678",
					checkInDate: "10 May 2026",
					monthlyRent: "₹12,000",
				},
			],
		},
		{
			roomNumber: "104",
			coolingType: "Non-AC",
			sharingType: "Double",
			capacity: 2,
			beds: [
				{
					id: "104-1",
					bedNumber: "Bed 1",
					status: "available",
				},
				{
					id: "104-2",
					bedNumber: "Bed 2",
					status: "available",
				},
			],
		},
	],
	2: [
		{
			roomNumber: "201",
			coolingType: "AC",
			sharingType: "Single",
			capacity: 1,
			beds: [
				{
					id: "201-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Karan Johar",
					mobileNumber: "+91 98234 56789",
					checkInDate: "05 Jul 2026",
					monthlyRent: "₹12,500",
				},
			],
		},
		{
			roomNumber: "202",
			coolingType: "Non-AC",
			sharingType: "Double",
			capacity: 2,
			beds: [
				{
					id: "202-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Nikhil Joshi",
					mobileNumber: "+91 97123 45670",
					checkInDate: "18 Aug 2026",
					monthlyRent: "₹6,500",
				},
				{
					id: "202-2",
					bedNumber: "Bed 2",
					status: "available",
				},
			],
		},
		{
			roomNumber: "203",
			coolingType: "AC",
			sharingType: "Triple",
			capacity: 3,
			beds: [
				{
					id: "203-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Rohan Nair",
					mobileNumber: "+91 96123 45678",
					checkInDate: "22 Sep 2026",
					monthlyRent: "₹7,500",
				},
				{
					id: "203-2",
					bedNumber: "Bed 2",
					status: "available",
				},
				{
					id: "203-3",
					bedNumber: "Bed 3",
					status: "occupied",
					residentName: "Sneha Patel",
					mobileNumber: "+91 99887 65432",
					checkInDate: "03 Aug 2026",
					monthlyRent: "₹7,500",
				},
			],
		},
		{
			roomNumber: "204",
			coolingType: "Non-AC",
			sharingType: "Double",
			capacity: 2,
			beds: [
				{
					id: "204-1",
					bedNumber: "Bed 1",
					status: "occupied",
					residentName: "Aditya Roy",
					mobileNumber: "+91 97766 55443",
					checkInDate: "14 Sep 2026",
					monthlyRent: "₹6,000",
				},
				{
					id: "204-2",
					bedNumber: "Bed 2",
					status: "occupied",
					residentName: "Manish Tiwari",
					mobileNumber: "+91 96655 44332",
					checkInDate: "28 Aug 2026",
					monthlyRent: "₹6,000",
				},
			],
		},
	],
};

const sampleResidentsList = [
	{
		id: "res-1",
		name: "Rahul Sharma",
		mobile: "+91 98765 21043",
		roomBed: "Room 101 • Bed 1",
		roomType: "Double Sharing (AC)",
		rent: "₹8,500",
		checkIn: "12 Aug 2026",
		status: "Staying Now",
	},
	{
		id: "res-2",
		name: "Amit Kumar",
		mobile: "+91 98450 87312",
		roomBed: "Room 102 • Bed 1",
		roomType: "Triple Sharing (Non-AC)",
		rent: "₹6,000",
		checkIn: "01 Sep 2026",
		status: "Staying Now",
	},
	{
		id: "res-3",
		name: "Vikram Trivedi",
		mobile: "+91 99012 34567",
		roomBed: "Room 102 • Bed 2",
		roomType: "Triple Sharing (Non-AC)",
		rent: "₹6,000",
		checkIn: "15 Jul 2026",
		status: "Staying Now",
	},
	{
		id: "res-4",
		name: "Priya Verma",
		mobile: "+91 97401 23456",
		roomBed: "Room 102 • Bed 3",
		roomType: "Triple Sharing (Non-AC)",
		rent: "₹6,000",
		checkIn: "20 Jun 2026",
		status: "Staying Now",
	},
	{
		id: "res-5",
		name: "Siddharth Mehta",
		mobile: "+91 98123 45678",
		roomBed: "Room 103 • Bed 1",
		roomType: "Single Sharing (AC)",
		rent: "₹12,000",
		checkIn: "10 May 2026",
		status: "Staying Now",
	},
	{
		id: "res-6",
		name: "Karan Johar",
		mobile: "+91 98234 56789",
		roomBed: "Room 201 • Bed 1",
		roomType: "Single Sharing (AC)",
		rent: "₹12,500",
		checkIn: "05 Jul 2026",
		status: "Staying Now",
	},
	{
		id: "res-7",
		name: "Rohan Nair",
		mobile: "+91 96123 45678",
		roomBed: "Room 203 • Bed 1",
		roomType: "Triple Sharing (AC)",
		rent: "₹7,500",
		checkIn: "22 Sep 2026",
		status: "Staying Now",
	},
];

export function OperationsPreview() {
	const [activeTab, setActiveTab] = useState<"layout" | "residents">("layout");
	const [activeFloor, setActiveFloor] = useState<number>(1);
	const [selectedBed, setSelectedBed] = useState<BedInfo | null>(
		floorData[1][0].beds[0]
	);

	const rooms = floorData[activeFloor] || [];

	return (
		<div className='relative w-full overflow-hidden rounded-2xl border border-[#E8E3D8] bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:p-6'>
			{/* Top Header: Property Info & Compact Summary Metrics */}
			<div className='flex flex-col justify-between gap-4 border-b border-[#F0EBE0] pb-5 dark:border-slate-800 lg:flex-row lg:items-center'>
				{/* Property Header */}
				<div className='flex items-center gap-2.5 sm:gap-3'>
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2B20] text-[#E5A83B] shadow-sm ring-1 ring-[#0B2B20]/15 dark:bg-[#133E2F] sm:h-11 sm:w-11'>
						<svg
							className='h-5 w-5'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth='2'
							aria-hidden='true'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
							/>
						</svg>
					</div>
					<div className='min-w-0 flex-1'>
						<div className='flex items-center justify-between gap-1.5 sm:justify-start sm:gap-2'>
							<h3 className='truncate font-inter text-sm font-bold text-[#0B2B20] dark:text-white sm:text-base md:text-lg'>
								Green Valley PG & Hostel
							</h3>
							<span className='shrink-0 select-none rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-800/80 dark:bg-emerald-950/70 dark:text-emerald-300 sm:text-[11px]'>
								Active
							</span>
						</div>
						<p className='truncate text-[11px] text-slate-500 dark:text-slate-400 sm:text-xs'>
							Main Branch • 2 Floors • 8 Rooms • 18 Beds
						</p>
					</div>
				</div>

				{/* Summary Metrics: Responsive 3-column grid on mobile, inline pills on desktop */}
				<div className='grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:items-center sm:gap-2.5'>
					<div className='flex flex-col items-center justify-center gap-0.5 rounded-lg border border-[#E8E3D8] bg-[#FAF8F5] px-2 py-1.5 text-center dark:border-slate-800 dark:bg-slate-800/60 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-left'>
						<span className='text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs'>
							Beds Filled:
						</span>
						<span className='text-xs font-bold text-[#0B2B20] dark:text-white sm:text-xs'>
							13
						</span>
					</div>

					<div className='flex flex-col items-center justify-center gap-0.5 rounded-lg border border-emerald-200/80 bg-emerald-50/70 px-2 py-1.5 text-center text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-left'>
						<span className='flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 sm:text-xs'>
							<span className='h-1.5 w-1.5 rounded-full bg-emerald-500' />
							Empty Beds:
						</span>
						<span className='text-xs font-bold text-emerald-800 dark:text-emerald-200 sm:text-xs'>
							5
						</span>
					</div>

					<div className='flex flex-col items-center justify-center gap-0.5 rounded-lg border border-[#E8E3D8] bg-[#FAF8F5] px-2 py-1.5 text-center dark:border-slate-800 dark:bg-slate-800/60 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-left'>
						<span className='text-[10px] font-medium text-slate-500 dark:text-slate-400 sm:text-xs'>
							Total Beds:
						</span>
						<span className='text-xs font-bold text-slate-700 dark:text-slate-300 sm:text-xs'>
							18
						</span>
					</div>
				</div>
			</div>

			{/* View Toggle Bar (Rooms & Beds vs All Residents) */}
			<div className='mt-4 flex flex-col gap-3 border-b border-[#F0EBE0] pb-3.5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between'>
				<div className='inline-flex w-full rounded-xl border border-[#E8E3D8] bg-[#FAF8F5] p-1 dark:border-slate-800 dark:bg-slate-800/70 sm:w-auto'>
					<button
						onClick={() => setActiveTab("layout")}
						className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all sm:flex-initial ${
							activeTab === "layout"
								? "bg-[#0B2B20] text-white shadow-sm dark:bg-[#133E2F]"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
						}`}
					>
						<svg
							className='h-3.5 w-3.5'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth='2'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M4 6h16M4 10h16M4 14h16M4 18h16'
							/>
						</svg>
						Rooms & Beds
					</button>
					<button
						onClick={() => setActiveTab("residents")}
						className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all sm:flex-initial ${
							activeTab === "residents"
								? "bg-[#0B2B20] text-white shadow-sm dark:bg-[#133E2F]"
								: "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
						}`}
					>
						<svg
							className='h-3.5 w-3.5'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth='2'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
							/>
						</svg>
						All Residents
					</button>
				</div>

				{activeTab === "layout" && (
					<div className='flex items-center gap-2'>
						<span className='text-xs font-semibold text-slate-500'>Floor:</span>
						<button
							onClick={() => setActiveFloor(1)}
							className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
								activeFloor === 1
									? "shadow-xs border border-[#0B2B20] bg-white font-bold text-[#0B2B20] dark:border-emerald-500 dark:bg-slate-800 dark:text-white"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
							}`}
						>
							Floor 1 (Ground)
						</button>
						<button
							onClick={() => setActiveFloor(2)}
							className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
								activeFloor === 2
									? "shadow-xs border border-[#0B2B20] bg-white font-bold text-[#0B2B20] dark:border-emerald-500 dark:bg-slate-800 dark:text-white"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
							}`}
						>
							Floor 2 (First)
						</button>
					</div>
				)}
			</div>

			{/* TAB 1: ROOMS & BEDS */}
			{activeTab === "layout" && (
				<div className='mt-5'>
					<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
						{rooms.map((room) => (
							<div
								key={room.roomNumber}
								className='hover:shadow-xs rounded-xl border border-[#E8E3D8] bg-[#FAF8F5]/80 p-3.5 transition-all hover:border-[#D5CEBF] dark:border-slate-800 dark:bg-slate-800/40'
							>
								{/* Room Header */}
								<div className='flex items-center justify-between border-b border-[#EFEAE1] pb-2 dark:border-slate-800'>
									<div>
										<span className='text-[10px] font-bold uppercase tracking-wider text-slate-500'>
											Room {room.roomNumber}
										</span>
										<h4 className='text-xs font-bold text-[#0B2B20] dark:text-white'>
											{room.sharingType} Sharing
										</h4>
									</div>
									<span
										className={`rounded border px-2 py-0.5 text-[10px] font-bold ${
											room.coolingType === "AC"
												? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
												: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
										}`}
									>
										{room.coolingType}
									</span>
								</div>

								{/* Bed Allocation Buttons */}
								<div className='mt-3 space-y-2'>
									{room.beds.map((bed) => {
										const isSelected = selectedBed?.id === bed.id;
										return (
											<button
												key={bed.id}
												onClick={() => setSelectedBed(bed)}
												className={`w-full rounded-lg border p-2.5 text-left transition-all ${
													isSelected
														? "shadow-xs border-[#0B2B20] bg-white ring-1 ring-[#0B2B20]/15 dark:border-emerald-500 dark:bg-slate-800"
														: "border-transparent bg-white/70 hover:border-[#E8E3D8] hover:bg-white dark:bg-slate-900/40 dark:hover:bg-slate-800"
												}`}
											>
												<div className='flex items-center justify-between'>
													<span className='text-xs font-bold text-slate-800 dark:text-slate-200'>
														{bed.bedNumber}
													</span>
													{bed.status === "available" ? (
														<span className='rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
															Available
														</span>
													) : (
														<span className='rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'>
															Occupied
														</span>
													)}
												</div>

												<div className='mt-1 truncate text-[11px] text-slate-600 dark:text-slate-400'>
													{bed.residentName || "Available for next tenant"}
												</div>
											</button>
										);
									})}
								</div>
							</div>
						))}
					</div>

					{/* Selected Bed / Resident Detail Drawer */}
					{selectedBed && (
						<div className='shadow-2xs mt-5 rounded-xl border border-[#E8E3D8] bg-[#FAF8F5] p-3.5 dark:border-slate-800 dark:bg-slate-800/60 sm:p-4'>
							<div className='flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between'>
								<div className='flex items-start gap-3'>
									{/* Resident / Bed Avatar */}
									<div className='shadow-xs relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2B20] text-white ring-1 ring-[#0B2B20]/15 dark:bg-[#133E2F]'>
										{selectedBed.status === "occupied" ? (
											<svg
												className='h-5 w-5 text-[#E5A83B]'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth='1.8'
												aria-hidden='true'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
												/>
											</svg>
										) : (
											<svg
												className='h-5 w-5 text-emerald-400'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth='2'
												aria-hidden='true'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													d='M12 4v16m8-8H4'
												/>
											</svg>
										)}
										{selectedBed.status === "occupied" && (
											<span className='absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900'>
												<svg
													className='h-2 w-2 text-white'
													fill='none'
													viewBox='0 0 24 24'
													stroke='currentColor'
													strokeWidth='3'
												>
													<path
														strokeLinecap='round'
														strokeLinejoin='round'
														d='M5 13l4 4L19 7'
													/>
												</svg>
											</span>
										)}
									</div>

									<div className='min-w-0 flex-1'>
										{/* Resident Name & Badges Row */}
										<div className='flex flex-wrap items-center gap-1.5'>
											<h5 className='text-sm font-bold text-slate-900 dark:text-white'>
												{selectedBed.residentName || "Empty Bed Available"}
											</h5>
											<span className='whitespace-nowrap rounded bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200'>
												Bed {selectedBed.id}
											</span>
											<span
												className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold ${
													selectedBed.status === "occupied"
														? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
														: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
												}`}
											>
												{selectedBed.status === "occupied"
													? "Occupied"
													: "Available"}
											</span>
										</div>

										{/* Details Row with Handcrafted Vector SVGs */}
										{selectedBed.residentName ? (
											<div className='mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-[11px] text-slate-600 dark:text-slate-300 sm:text-xs'>
												<span className='inline-flex items-center gap-1.5 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300'>
													<svg
														className='h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500'
														fill='none'
														viewBox='0 0 24 24'
														stroke='currentColor'
														strokeWidth='2'
														aria-hidden='true'
													>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
														/>
													</svg>
													{selectedBed.mobileNumber}
												</span>
												<span className='inline-flex items-center gap-1.5 whitespace-nowrap text-slate-600 dark:text-slate-400'>
													<svg
														className='h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500'
														fill='none'
														viewBox='0 0 24 24'
														stroke='currentColor'
														strokeWidth='2'
														aria-hidden='true'
													>
														<path
															strokeLinecap='round'
															strokeLinejoin='round'
															d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
														/>
													</svg>
													Joined: {selectedBed.checkInDate || "Active"}
												</span>
												<span className='inline-flex items-center gap-1.5 whitespace-nowrap font-bold text-[#0B2B20] dark:text-emerald-300'>
													<span className='inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'>
														₹
													</span>
													{selectedBed.monthlyRent || "₹6,000"}/month
												</span>
											</div>
										) : (
											<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
												Vacant bed. Ready for walk-in allotment.
											</p>
										)}
									</div>
								</div>

								{/* Allotment Status Pill */}
								<div className='flex shrink-0 items-center text-xs'>
									{selectedBed.status === "occupied" ? (
										<div className='shadow-2xs inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E8E3D8] bg-white px-3 py-1.5 text-center font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 sm:w-auto'>
											<svg
												className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth='2.5'
												aria-hidden='true'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													d='M5 13l4 4L19 7'
												/>
											</svg>
											<span>
												Allotted to {selectedBed.residentName?.split(" ")[0]}
											</span>
										</div>
									) : (
										<div className='inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-center font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 sm:w-auto'>
											<svg
												className='h-3.5 w-3.5 text-emerald-600'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
												strokeWidth='2'
												aria-hidden='true'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													d='M12 4v16m8-8H4'
												/>
											</svg>
											<span>Ready for Walk-in Allotment</span>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{/* TAB 2: ALL RESIDENTS DIRECTORY */}
			{activeTab === "residents" && (
				<div className='mt-5 overflow-x-auto'>
					<table className='w-full text-left text-xs text-slate-600 dark:text-slate-300'>
						<thead className='border-b border-[#E8E3D8] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/60'>
							<tr>
								<th className='px-4 py-3'>Resident Name</th>
								<th className='px-4 py-3'>Phone (Mobile)</th>
								<th className='px-4 py-3'>Room & Bed</th>
								<th className='px-4 py-3'>Sharing Type</th>
								<th className='px-4 py-3'>Monthly Rent</th>
								<th className='px-4 py-3'>Joining Date</th>
								<th className='px-4 py-3'>Status</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-[#F0EBE0] dark:divide-slate-800'>
							{sampleResidentsList.map((res) => (
								<tr
									key={res.id}
									className='transition-colors hover:bg-[#FAF8F5]/80 dark:hover:bg-slate-800/40'
								>
									<td className='px-4 py-3 font-semibold text-slate-900 dark:text-white'>
										{res.name}
									</td>
									<td className='font-mono px-4 py-3 text-[11px]'>
										{res.mobile}
									</td>
									<td className='px-4 py-3 font-medium text-[#0B2B20] dark:text-emerald-300'>
										{res.roomBed}
									</td>
									<td className='px-4 py-3'>{res.roomType}</td>
									<td className='font-mono px-4 py-3 font-semibold text-[#0B2B20] dark:text-slate-200'>
										{res.rent}
									</td>
									<td className='px-4 py-3'>{res.checkIn}</td>
									<td className='px-4 py-3'>
										<span className='rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'>
											{res.status}
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{/* Interactive Helper Footer */}
			<div className='mt-4 flex flex-col items-center justify-between gap-1.5 border-t border-[#F0EBE0] pt-3 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500 sm:flex-row sm:text-left'>
				<span className='flex items-center justify-center gap-1.5'>
					<svg
						className='h-3 w-3 shrink-0 text-[#E5A83B]'
						fill='currentColor'
						viewBox='0 0 24 24'
					>
						<path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' />
					</svg>
					Tap any bed or switch tabs above to test live interaction
				</span>
				<span className='hidden text-slate-400 dark:text-slate-500 sm:inline'>
					ChooseBed.com Interactive Preview
				</span>
			</div>
		</div>
	);
}
