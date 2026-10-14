"use client";

import { Badge, Button, Card, CardContent } from "@/components/Common/UI";
import { formatINR } from "@/libs/formatters";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Types matching Prisma schema
export interface BedRecord {
	id: string;
	bedNumber: number;
	status: string; // "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
}

export interface RoomRecord {
	id: string;
	roomNumber: string;
	floor: string;
	sharing: string; // "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR"
	acType: string; // "AC" | "NON_AC"
	rentPerBed: number | null;
	notes: string | null;
	propertyId: string;
	beds: BedRecord[];
}

export interface PropertyWithRooms {
	id: string;
	name: string;
	city: string;
	area: string;
	type: string;
	gender: string;
	rooms: RoomRecord[];
}

interface Props {
	properties: PropertyWithRooms[];
}

const SHARING_CONFIG: Record<
	string,
	{ label: string; beds: number; badgeColor: string }
> = {
	SINGLE: {
		label: "Single Sharing",
		beds: 1,
		badgeColor:
			"bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-900",
	},
	DOUBLE: {
		label: "Double Sharing",
		beds: 2,
		badgeColor:
			"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900",
	},
	TRIPLE: {
		label: "Triple Sharing",
		beds: 3,
		badgeColor:
			"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
	},
	FOUR: {
		label: "Four Sharing",
		beds: 4,
		badgeColor:
			"bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-900",
	},
};

const COMMON_FLOORS = [
	"Ground Floor",
	"1st Floor",
	"2nd Floor",
	"3rd Floor",
	"4th Floor",
	"5th Floor",
	"Basement",
	"Terrace",
];

// ----------------------------------------------------------------------
// Reusable Portal Modal Dialog Component (Highest Z-Index, Full Backdrop)
// ----------------------------------------------------------------------
interface ModalDialogProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	maxWidth?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
}

function ModalDialog({
	isOpen,
	onClose,
	title,
	subtitle,
	maxWidth = "max-w-lg",
	children,
	footer,
}: ModalDialogProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = originalOverflow;
		};
	}, [isOpen, onClose]);

	if (!mounted || !isOpen) return null;

	return createPortal(
		<div
			className='fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-slate-950/75 p-3 backdrop-blur-sm sm:p-4'
			onClick={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
			role='dialog'
			aria-modal='true'
		>
			<div
				className={`relative flex max-h-[85vh] w-full ${maxWidth} flex-col rounded-2xl border border-[#E8E3D8] bg-white shadow-2xl dark:border-[#1E382B] dark:bg-[#071711] sm:rounded-3xl`}
			>
				{/* Fixed Modal Header */}
				<div className='flex shrink-0 items-center justify-between border-b border-stroke px-5 py-4 dark:border-stroke-dark sm:px-6'>
					<div>
						<h2 className='font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
							{title}
						</h2>
						{subtitle && (
							<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
								{subtitle}
							</p>
						)}
					</div>
					<button
						type='button'
						onClick={onClose}
						className='flex size-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
						aria-label='Close modal'
					>
						✕
					</button>
				</div>

				{/* Scrollable Form Body */}
				<div className='flex-1 overflow-y-auto px-5 py-4 sm:px-6'>
					{children}
				</div>

				{/* Fixed Modal Footer */}
				{footer && (
					<div className='flex shrink-0 items-center justify-end gap-3 border-t border-stroke bg-slate-50/70 px-5 py-3.5 dark:border-stroke-dark dark:bg-dark-2 sm:px-6'>
						{footer}
					</div>
				)}
			</div>
		</div>,
		document.body
	);
}

export default function RoomsPageClient({
	properties: initialProperties,
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Local state so UI updates immediately after CRUD actions
	const [properties, setProperties] =
		useState<PropertyWithRooms[]>(initialProperties);

	// Active selected property
	const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
		properties[0]?.id || ""
	);

	const activeProperty = useMemo(() => {
		return properties.find((p) => p.id === selectedPropertyId) || properties[0];
	}, [properties, selectedPropertyId]);

	// Filter & Search states
	const [searchQuery, setSearchQuery] = useState("");
	const [floorFilter, setFloorFilter] = useState("ALL");
	const [sharingFilter, setSharingFilter] = useState("ALL");
	const [acFilter, setAcFilter] = useState("ALL");
	const [availabilityFilter, setAvailabilityFilter] = useState("ALL");

	// Modals
	const [isAddModalOpen, setIsAddModalOpen] = useState(
		searchParams.get("action") === "add"
	);
	const [editingRoom, setEditingRoom] = useState<RoomRecord | null>(null);
	const [deletingRoom, setDeletingRoom] = useState<RoomRecord | null>(null);

	// Notification banner state
	const [feedback, setFeedback] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);

	// Dynamic floor list from current rooms
	const availableFloors = useMemo(() => {
		if (!activeProperty) return [];
		const unique = Array.from(
			new Set(activeProperty.rooms.map((r) => r.floor.trim()))
		);
		return unique.sort();
	}, [activeProperty]);

	// Filtered rooms
	const filteredRooms = useMemo(() => {
		if (!activeProperty) return [];
		return activeProperty.rooms.filter((room) => {
			// Search by room number
			if (
				searchQuery.trim() &&
				!room.roomNumber
					.toLowerCase()
					.includes(searchQuery.trim().toLowerCase())
			) {
				return false;
			}
			// Floor filter
			if (floorFilter !== "ALL" && room.floor !== floorFilter) {
				return false;
			}
			// Sharing filter
			if (sharingFilter !== "ALL" && room.sharing !== sharingFilter) {
				return false;
			}
			// AC filter
			if (acFilter !== "ALL" && room.acType !== acFilter) {
				return false;
			}
			// Availability filter
			if (availabilityFilter === "AVAILABLE") {
				const hasAvailableBed = room.beds.some((b) => b.status === "AVAILABLE");
				if (!hasAvailableBed) return false;
			} else if (availabilityFilter === "OCCUPIED") {
				const allOccupied = room.beds.every((b) => b.status === "OCCUPIED");
				if (!allOccupied) return false;
			}
			return true;
		});
	}, [
		activeProperty,
		searchQuery,
		floorFilter,
		sharingFilter,
		acFilter,
		availabilityFilter,
	]);

	// Inventory totals for active property
	const stats = useMemo(() => {
		if (!activeProperty) {
			return {
				totalRooms: 0,
				totalBeds: 0,
				availableBeds: 0,
				occupiedBeds: 0,
				occupancy: 0,
			};
		}
		const totalRooms = activeProperty.rooms.length;
		const totalBeds = activeProperty.rooms.reduce(
			(sum, r) => sum + r.beds.length,
			0
		);
		const occupiedBeds = activeProperty.rooms.reduce(
			(sum, r) => sum + r.beds.filter((b) => b.status === "OCCUPIED").length,
			0
		);
		const availableBeds = totalBeds - occupiedBeds;
		const occupancy =
			totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
		return { totalRooms, totalBeds, availableBeds, occupiedBeds, occupancy };
	}, [activeProperty]);

	// Handler: Add room successfully
	const handleRoomCreated = (newRoom: RoomRecord) => {
		setProperties((prev) =>
			prev.map((p) => {
				if (p.id === newRoom.propertyId) {
					const updatedRooms = [...p.rooms, newRoom].sort((a, b) => {
						if (a.floor === b.floor) {
							return a.roomNumber.localeCompare(b.roomNumber, undefined, {
								numeric: true,
							});
						}
						return a.floor.localeCompare(b.floor);
					});
					return { ...p, rooms: updatedRooms };
				}
				return p;
			})
		);
		setIsAddModalOpen(false);
		setFeedback({
			type: "success",
			message: `Room ${newRoom.roomNumber} (${newRoom.beds.length} beds) created successfully.`,
		});
		router.refresh();
	};

	// Handler: Edit room successfully
	const handleRoomUpdated = (updatedRoom: RoomRecord) => {
		setProperties((prev) =>
			prev.map((p) => {
				if (p.id === updatedRoom.propertyId) {
					return {
						...p,
						rooms: p.rooms.map((r) =>
							r.id === updatedRoom.id ? updatedRoom : r
						),
					};
				}
				return p;
			})
		);
		setEditingRoom(null);
		setFeedback({
			type: "success",
			message: `Room ${updatedRoom.roomNumber} updated successfully.`,
		});
		router.refresh();
	};

	// Handler: Delete room successfully
	const handleRoomDeleted = (deletedRoomId: string, roomNumber: string) => {
		setProperties((prev) =>
			prev.map((p) => {
				return {
					...p,
					rooms: p.rooms.filter((r) => r.id !== deletedRoomId),
				};
			})
		);
		setDeletingRoom(null);
		setFeedback({
			type: "success",
			message: `Room ${roomNumber} deleted successfully.`,
		});
		router.refresh();
	};

	// If owner has zero properties, render helpful empty state
	if (properties.length === 0) {
		return (
			<div className='flex min-h-[50vh] flex-col items-center justify-center p-6 text-center'>
				<div className='flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'>
					<svg
						className='size-7'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth='2'
							d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
						/>
					</svg>
				</div>
				<h2 className='mt-4 font-satoshi text-xl font-bold text-slate-900 dark:text-white'>
					No PG/Hostel Property Found
				</h2>
				<p className='mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400'>
					Please register your PG/Hostel property first before adding room
					layouts and bed inventories.
				</p>
				<div className='mt-6'>
					<Link href='/user/setup'>
						<Button variant='primary'>Complete Property Setup</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='space-y-6 sm:space-y-8'>
			{/* Top Header: Title, Description, Property Switcher, Add Room CTA */}
			<div className='flex flex-col justify-between gap-4 border-b border-stroke pb-6 dark:border-stroke-dark sm:flex-row sm:items-center'>
				<div>
					<div className='flex flex-wrap items-center gap-2.5'>
						<h1 className='font-satoshi text-2xl font-bold tracking-tight text-dark dark:text-white sm:text-3xl'>
							Rooms & Beds
						</h1>
						<Badge variant='success' size='sm'>
							Live Inventory
						</Badge>
					</div>
					<p className='mt-1 text-xs text-body dark:text-gray-4 sm:text-sm'>
						Floor-wise room layouts, AC/Non-AC sharing capacities, and bed
						vacancy tracking.
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-3'>
					{/* Property Selector (if owner manages > 1 property) */}
					{properties.length > 1 && (
						<div className='flex items-center gap-2'>
							<label
								htmlFor='property-select'
								className='text-xs font-semibold text-slate-600 dark:text-slate-300'
							>
								Property:
							</label>
							<select
								id='property-select'
								value={selectedPropertyId}
								onChange={(e) => setSelectedPropertyId(e.target.value)}
								className='rounded-xl border border-stroke bg-white px-3 py-2 text-xs font-medium text-dark shadow-sm transition focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
							>
								{properties.map((p) => (
									<option key={p.id} value={p.id}>
										{p.name} ({p.city})
									</option>
								))}
							</select>
						</div>
					)}

					<Button
						variant='primary'
						size='sm'
						onClick={() => setIsAddModalOpen(true)}
						className='flex w-full items-center justify-center gap-2 shadow-sm sm:w-auto'
					>
						<svg
							className='size-4'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
							strokeWidth='2.5'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M12 4v16m8-8H4'
							/>
						</svg>
						<span>Add Room</span>
					</Button>
				</div>
			</div>

			{/* Inline Notification Banner */}
			{feedback && (
				<div
					className={`flex items-center justify-between rounded-xl border p-4 text-xs font-medium sm:text-sm ${
						feedback.type === "success"
							? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"
							: "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
					}`}
				>
					<div className='flex items-center gap-2.5'>
						<span className='bg-current/10 flex size-5 shrink-0 items-center justify-center rounded-full font-bold'>
							{feedback.type === "success" ? "✓" : "!"}
						</span>
						<span>{feedback.message}</span>
					</div>
					<button
						type='button'
						onClick={() => setFeedback(null)}
						className='ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
						aria-label='Dismiss notification'
					>
						✕
					</button>
				</div>
			)}

			{/* Operational Metrics Cards */}
			<div className='grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5'>
				{/* Total Rooms */}
				<Card>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Total Rooms
							</span>
							<span className='rounded-lg bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400'>
								<svg
									className='size-4'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
									/>
								</svg>
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-1.5'>
							<span className='font-satoshi text-xl font-bold text-dark dark:text-white sm:text-2xl'>
								{stats.totalRooms}
							</span>
							<span className='text-[11px] text-body dark:text-gray-4'>
								rooms
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Total Beds */}
				<Card>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Total Beds
							</span>
							<span className='rounded-lg bg-blue-500/10 p-1.5 text-blue-700 dark:text-blue-400'>
								<svg
									className='size-4'
									fill='none'
									viewBox='0 0 24 24'
									stroke='currentColor'
								>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth='2'
										d='M4 6h16M4 10h16M4 14h16M4 18h16'
									/>
								</svg>
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-1.5'>
							<span className='font-satoshi text-xl font-bold text-dark dark:text-white sm:text-2xl'>
								{stats.totalBeds}
							</span>
							<span className='text-[11px] text-body dark:text-gray-4'>
								capacity
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Available Beds */}
				<Card>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Available Beds
							</span>
							<span className='rounded-lg bg-emerald-500/10 p-1.5 text-emerald-700 dark:text-emerald-400'>
								<span className='inline-block size-2 rounded-full bg-emerald-500'></span>
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-1.5'>
							<span className='font-satoshi text-xl font-bold text-emerald-700 dark:text-emerald-400 sm:text-2xl'>
								{stats.availableBeds}
							</span>
							<span className='text-[11px] text-emerald-800 dark:text-emerald-300'>
								vacant
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Occupied Beds */}
				<Card>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Occupied Beds
							</span>
							<span className='rounded-lg bg-amber-500/10 p-1.5 text-amber-700 dark:text-amber-400'>
								<span className='inline-block size-2 rounded-full bg-amber-500'></span>
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-1.5'>
							<span className='font-satoshi text-xl font-bold text-amber-700 dark:text-amber-400 sm:text-2xl'>
								{stats.occupiedBeds}
							</span>
							<span className='text-[11px] text-amber-800 dark:text-amber-300'>
								filled
							</span>
						</div>
					</CardContent>
				</Card>

				{/* Occupancy Rate */}
				<Card className='col-span-2 lg:col-span-1'>
					<CardContent className='p-3.5 sm:p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Occupancy Rate
							</span>
							<span className='rounded-lg bg-purple-500/10 p-1.5 text-xs font-bold text-purple-700 dark:text-purple-400'>
								%
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-1.5'>
							<span className='font-satoshi text-xl font-bold text-dark dark:text-white sm:text-2xl'>
								{stats.totalBeds > 0 ? `${stats.occupancy}%` : "0%"}
							</span>
							<span className='text-[11px] text-body dark:text-gray-4'>
								{stats.totalBeds === 0 ? "No beds yet" : "utilization"}
							</span>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters & Search Toolbar */}
			<div className='rounded-2xl border border-stroke bg-white p-3.5 shadow-sm dark:border-stroke-dark dark:bg-dark-2 sm:p-4'>
				<div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5'>
					{/* Search by room number */}
					<div className='relative lg:col-span-1'>
						<input
							type='text'
							placeholder='Search room number...'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-transparent py-2.5 pl-9 pr-3 text-xs font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:text-white'
						/>
						<svg
							className='absolute left-3 top-3 size-4 text-slate-400'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
							/>
						</svg>
					</div>

					{/* Floor Filter */}
					<div>
						<select
							value={floorFilter}
							onChange={(e) => setFloorFilter(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-transparent px-3 py-2.5 text-xs font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						>
							<option value='ALL'>All Floors ({availableFloors.length})</option>
							{availableFloors.map((floor) => (
								<option key={floor} value={floor}>
									{floor}
								</option>
							))}
						</select>
					</div>

					{/* Sharing Filter */}
					<div>
						<select
							value={sharingFilter}
							onChange={(e) => setSharingFilter(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-transparent px-3 py-2.5 text-xs font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						>
							<option value='ALL'>All Sharing Types</option>
							<option value='SINGLE'>Single Sharing (1 Bed)</option>
							<option value='DOUBLE'>Double Sharing (2 Beds)</option>
							<option value='TRIPLE'>Triple Sharing (3 Beds)</option>
							<option value='FOUR'>Four Sharing (4 Beds)</option>
						</select>
					</div>

					{/* AC Filter */}
					<div>
						<select
							value={acFilter}
							onChange={(e) => setAcFilter(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-transparent px-3 py-2.5 text-xs font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						>
							<option value='ALL'>AC & Non-AC</option>
							<option value='AC'>AC Only</option>
							<option value='NON_AC'>Non-AC Only</option>
						</select>
					</div>

					{/* Availability Filter */}
					<div>
						<select
							value={availabilityFilter}
							onChange={(e) => setAvailabilityFilter(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-transparent px-3 py-2.5 text-xs font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						>
							<option value='ALL'>All Availability</option>
							<option value='AVAILABLE'>Has Available Beds</option>
							<option value='OCCUPIED'>Fully Occupied</option>
						</select>
					</div>
				</div>

				{/* Active filters summary & reset */}
				{(searchQuery ||
					floorFilter !== "ALL" ||
					sharingFilter !== "ALL" ||
					acFilter !== "ALL" ||
					availabilityFilter !== "ALL") && (
					<div className='mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stroke pt-2.5 dark:border-stroke-dark'>
						<span className='text-xs text-slate-500 dark:text-slate-400'>
							Showing {filteredRooms.length} of {activeProperty?.rooms.length}{" "}
							rooms
						</span>
						<button
							type='button'
							onClick={() => {
								setSearchQuery("");
								setFloorFilter("ALL");
								setSharingFilter("ALL");
								setAcFilter("ALL");
								setAvailabilityFilter("ALL");
							}}
							className='text-xs font-semibold text-emerald-800 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300'
						>
							Reset All Filters
						</button>
					</div>
				)}
			</div>

			{/* Room Inventory Grid */}
			{activeProperty.rooms.length === 0 ? (
				/* Empty state when NO rooms exist in property */
				<div className='rounded-3xl border border-dashed border-[#D4CEBF] bg-[#FBF9F5] p-8 text-center dark:border-[#244234] dark:bg-[#071711] sm:p-12'>
					<div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
						<svg
							className='size-7'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
							/>
						</svg>
					</div>
					<h3 className='mt-4 font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:text-xl'>
						No Rooms Configured for {activeProperty.name}
					</h3>
					<p className='mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm'>
						Start organizing your PG/Hostel by creating rooms, assigning floors,
						and configuring Single, Double, Triple or Four Sharing bed
						inventory.
					</p>
					<div className='mt-6'>
						<Button
							variant='primary'
							onClick={() => setIsAddModalOpen(true)}
							className='shadow-sm'
						>
							+ Add Your First Room
						</Button>
					</div>
				</div>
			) : filteredRooms.length === 0 ? (
				/* Empty state when filters return 0 results */
				<div className='rounded-2xl border border-stroke bg-white p-8 text-center dark:border-stroke-dark dark:bg-dark-2'>
					<p className='font-satoshi text-base font-bold text-slate-800 dark:text-slate-200'>
						No rooms match your filter criteria
					</p>
					<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
						Try adjusting your search terms or clearing floor and sharing
						filters.
					</p>
					<div className='mt-4'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => {
								setSearchQuery("");
								setFloorFilter("ALL");
								setSharingFilter("ALL");
								setAcFilter("ALL");
								setAvailabilityFilter("ALL");
							}}
						>
							Clear Filters
						</Button>
					</div>
				</div>
			) : (
				/* Grid of Rooms */
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
					{filteredRooms.map((room) => {
						const sharingMeta =
							SHARING_CONFIG[room.sharing] || SHARING_CONFIG.SINGLE;
						const vacantCount = room.beds.filter(
							(b) => b.status === "AVAILABLE"
						).length;
						const isFullyOccupied = vacantCount === 0;

						return (
							<Card
								key={room.id}
								className='group flex flex-col justify-between border-[#E8E3D8] bg-white transition hover:border-[#10B981]/50 hover:shadow-md dark:border-[#1E382B] dark:bg-[#071711]'
							>
								<CardContent className='p-4 sm:p-5'>
									{/* Room Header: Room Number, Floor, Badges */}
									<div className='flex flex-wrap items-start justify-between gap-2'>
										<div>
											<div className='flex items-baseline gap-2'>
												<h3 className='font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
													Room {room.roomNumber}
												</h3>
												<span className='rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
													{room.floor}
												</span>
											</div>
											<div className='mt-2 flex flex-wrap items-center gap-1.5'>
												{/* Sharing badge */}
												<span
													className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${sharingMeta.badgeColor}`}
												>
													{sharingMeta.label}
												</span>

												{/* AC/Non-AC badge */}
												<span
													className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
														room.acType === "AC"
															? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300"
															: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
													}`}
												>
													{room.acType === "AC" ? (
														<>
															<span className='size-1.5 rounded-full bg-sky-500'></span>
															AC
														</>
													) : (
														"Non-AC"
													)}
												</span>

												{/* Occupancy badge */}
												<span
													className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
														isFullyOccupied
															? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
															: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300"
													}`}
												>
													{vacantCount} / {room.beds.length} Available
												</span>
											</div>
										</div>

										{/* Rent indicator */}
										<div className='text-right'>
											<span className='text-[10px] uppercase text-slate-400'>
												Rent / Bed
											</span>
											<p className='font-satoshi text-sm font-bold text-emerald-800 dark:text-emerald-400'>
												{room.rentPerBed !== null &&
												room.rentPerBed !== undefined
													? `${formatINR(room.rentPerBed)}`
													: "Not set"}
											</p>
										</div>
									</div>

									{/* Bed Inventory Visual Pills */}
									<div className='mt-4 border-t border-slate-100 pt-3 dark:border-slate-800/80'>
										<span className='text-[10px] font-semibold uppercase tracking-wider text-slate-400'>
											Beds Inventory ({room.beds.length})
										</span>
										<div className='mt-2 grid grid-cols-2 gap-2'>
											{room.beds.map((bed) => {
												const isAvail = bed.status === "AVAILABLE";
												const isOcc = bed.status === "OCCUPIED";
												return (
													<div
														key={bed.id}
														className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs ${
															isAvail
																? "border-emerald-200 bg-emerald-50/60 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
																: isOcc
																	? "border-amber-200 bg-amber-50/60 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200"
																	: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
														}`}
													>
														<span className='font-medium'>
															Bed {bed.bedNumber}
														</span>
														<span className='flex items-center gap-1 text-[10px] font-semibold'>
															<span
																className={`size-1.5 rounded-full ${
																	isAvail
																		? "bg-emerald-600"
																		: isOcc
																			? "bg-amber-600"
																			: "bg-slate-500"
																}`}
															/>
															<span className='xs:inline hidden'>
																{isAvail
																	? "Available"
																	: isOcc
																		? "Occupied"
																		: "Maint"}
															</span>
														</span>
													</div>
												);
											})}
										</div>
									</div>

									{/* Optional notes */}
									{room.notes && (
										<div className='mt-3 flex items-start gap-1.5 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600 dark:bg-slate-900/60 dark:text-slate-400'>
											<svg
												className='mt-0.5 size-3.5 shrink-0 text-slate-400'
												fill='none'
												viewBox='0 0 24 24'
												stroke='currentColor'
											>
												<path
													strokeLinecap='round'
													strokeLinejoin='round'
													strokeWidth='2'
													d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
												/>
											</svg>
											<p className='line-clamp-2'>{room.notes}</p>
										</div>
									)}

									{/* Action Footer: Edit & Delete */}
									<div className='mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80'>
										<button
											type='button'
											onClick={() => setEditingRoom(room)}
											className='rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
										>
											Edit Room
										</button>
										<button
											type='button'
											onClick={() => setDeletingRoom(room)}
											className='rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40'
										>
											Delete
										</button>
									</div>
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{/* ============================================================ */}
			{/* ADD ROOM MODAL */}
			{/* ============================================================ */}
			{isAddModalOpen && (
				<AddRoomModal
					propertyId={activeProperty.id}
					propertyName={activeProperty.name}
					properties={properties}
					onClose={() => setIsAddModalOpen(false)}
					onSuccess={handleRoomCreated}
				/>
			)}

			{/* ============================================================ */}
			{/* EDIT ROOM MODAL */}
			{/* ============================================================ */}
			{editingRoom && (
				<EditRoomModal
					room={editingRoom}
					onClose={() => setEditingRoom(null)}
					onSuccess={handleRoomUpdated}
				/>
			)}

			{/* ============================================================ */}
			{/* DELETE CONFIRMATION MODAL */}
			{/* ============================================================ */}
			{deletingRoom && (
				<DeleteRoomModal
					room={deletingRoom}
					onClose={() => setDeletingRoom(null)}
					onSuccess={() =>
						handleRoomDeleted(deletingRoom.id, deletingRoom.roomNumber)
					}
				/>
			)}
		</div>
	);
}

// ----------------------------------------------------------------------
// Add Room Modal Component
// ----------------------------------------------------------------------
interface AddRoomModalProps {
	propertyId: string;
	propertyName: string;
	properties: PropertyWithRooms[];
	onClose: () => void;
	onSuccess: (room: RoomRecord) => void;
}

function AddRoomModal({
	propertyId: initialPropertyId,
	propertyName,
	properties,
	onClose,
	onSuccess,
}: AddRoomModalProps) {
	const [propertyId, setPropertyId] = useState(initialPropertyId);
	const [roomNumber, setRoomNumber] = useState("");
	const [floor, setFloor] = useState("1st Floor");
	const [customFloor, setCustomFloor] = useState("");
	const [sharing, setSharing] = useState<
		"SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR"
	>("DOUBLE");
	const [acType, setAcType] = useState<"AC" | "NON_AC">("AC");
	const [rentPerBed, setRentPerBed] = useState("");
	const [notes, setNotes] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const bedCount = SHARING_CONFIG[sharing].beds;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		const finalFloor = floor === "CUSTOM" ? customFloor.trim() : floor;
		if (!finalFloor) {
			setError("Please specify a floor.");
			return;
		}

		if (!roomNumber.trim()) {
			setError("Room number is required (e.g. 101, G-01).");
			return;
		}

		let parsedRent: number | null = null;
		if (rentPerBed.trim()) {
			const n = parseInt(rentPerBed.trim(), 10);
			if (isNaN(n) || n < 0) {
				setError("Rent must be a valid non-negative number in Rupees.");
				return;
			}
			if (n > 200000) {
				setError("Rent cannot exceed ₹2,00,000 per bed.");
				return;
			}
			parsedRent = n;
		}

		try {
			setIsSubmitting(true);
			const res = await fetch("/api/user/rooms", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					propertyId,
					roomNumber: roomNumber.trim(),
					floor: finalFloor,
					sharing,
					acType,
					rentPerBed: parsedRent,
					notes: notes.trim() || null,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to create room.");
				setIsSubmitting(false);
				return;
			}

			onSuccess(data.room);
		} catch (err: any) {
			setError(
				err?.message || "An unexpected error occurred. Please try again."
			);
			setIsSubmitting(false);
		}
	};

	return (
		<ModalDialog
			isOpen={true}
			onClose={onClose}
			title='Add New Room'
			subtitle={`Configuring inventory for ${propertyName}`}
			footer={
				<>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type='submit'
						form='add-room-form'
						variant='primary'
						size='sm'
						disabled={isSubmitting}
						className='min-w-[130px]'
					>
						{isSubmitting ? "Creating..." : `Create Room (${bedCount} Beds)`}
					</Button>
				</>
			}
		>
			<form
				id='add-room-form'
				onSubmit={handleSubmit}
				className='space-y-4 text-xs'
			>
				{/* Error Alert */}
				{error && (
					<div className='flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'>
						<svg
							className='mt-0.5 size-4 shrink-0 text-rose-600'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
							/>
						</svg>
						<span>{error}</span>
					</div>
				)}

				{/* Property selection if > 1 */}
				{properties.length > 1 && (
					<div>
						<label className='font-semibold text-slate-700 dark:text-slate-300'>
							Target Property *
						</label>
						<select
							value={propertyId}
							onChange={(e) => setPropertyId(e.target.value)}
							className='mt-1 w-full rounded-xl border border-stroke bg-white px-3 py-2.5 font-medium text-dark outline-none focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						>
							{properties.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name} ({p.city})
								</option>
							))}
						</select>
					</div>
				)}

				{/* Room Number & Floor in 2 cols */}
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<div>
						<label className='font-semibold text-slate-700 dark:text-slate-300'>
							Room Number / Name *
						</label>
						<input
							type='text'
							required
							placeholder='e.g. 101, G-01, A-12'
							value={roomNumber}
							onChange={(e) => setRoomNumber(e.target.value)}
							className='mt-1 w-full rounded-xl border border-stroke bg-white px-3 py-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						/>
					</div>

					<div>
						<label className='font-semibold text-slate-700 dark:text-slate-300'>
							Floor Designation *
						</label>
						<select
							value={floor}
							onChange={(e) => setFloor(e.target.value)}
							className='mt-1 w-full rounded-xl border border-stroke bg-white px-3 py-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						>
							{COMMON_FLOORS.map((f) => (
								<option key={f} value={f}>
									{f}
								</option>
							))}
							<option value='CUSTOM'>+ Other / Custom Floor</option>
						</select>
					</div>
				</div>

				{/* Custom floor text input if selected */}
				{floor === "CUSTOM" && (
					<div>
						<label className='font-semibold text-slate-700 dark:text-slate-300'>
							Custom Floor Name *
						</label>
						<input
							type='text'
							required
							placeholder='e.g. 6th Floor Penthouse, Annex 1'
							value={customFloor}
							onChange={(e) => setCustomFloor(e.target.value)}
							className='mt-1 w-full rounded-xl border border-stroke bg-white px-3 py-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						/>
					</div>
				)}

				{/* Sharing Type Cards */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Sharing Type & Bed Inventory *
					</label>
					<p className='text-[11px] text-slate-500 dark:text-slate-400'>
						Actual individual bed records will be automatically provisioned.
					</p>
					<div className='mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4'>
						{(
							[
								{ key: "SINGLE", label: "Single", beds: "1 Bed" },
								{ key: "DOUBLE", label: "Double", beds: "2 Beds" },
								{ key: "TRIPLE", label: "Triple", beds: "3 Beds" },
								{ key: "FOUR", label: "Four", beds: "4 Beds" },
							] as const
						).map((item) => (
							<button
								key={item.key}
								type='button'
								onClick={() => setSharing(item.key)}
								className={`flex flex-col items-center rounded-xl border p-2.5 text-center transition ${
									sharing === item.key
										? "border-[#10B981] bg-[#10B981]/10 text-emerald-950 dark:bg-emerald-950/60 dark:text-emerald-200"
										: "border-stroke bg-white text-slate-700 hover:border-slate-300 dark:border-stroke-dark dark:bg-dark-2 dark:text-slate-300"
								}`}
							>
								<span className='font-bold'>{item.label}</span>
								<span className='text-[10px] text-slate-500 dark:text-slate-400'>
									{item.beds}
								</span>
							</button>
						))}
					</div>
				</div>

				{/* AC or Non-AC Toggle */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Cooling Specification *
					</label>
					<div className='mt-1.5 grid grid-cols-2 gap-2'>
						<button
							type='button'
							onClick={() => setAcType("AC")}
							className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition ${
								acType === "AC"
									? "border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
									: "border-stroke bg-white text-slate-700 hover:border-slate-300 dark:border-stroke-dark dark:bg-dark-2 dark:text-slate-300"
							}`}
						>
							<svg
								className='size-3.5 text-sky-600 dark:text-sky-400'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M12 3v18m0-18l3 3m-3-3l-3 3m3 15l3-3m-3 3l-3-3M3 12h18m-18 0l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3'
								/>
							</svg>
							<span>AC Room</span>
						</button>
						<button
							type='button'
							onClick={() => setAcType("NON_AC")}
							className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition ${
								acType === "NON_AC"
									? "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
									: "border-stroke bg-white text-slate-700 hover:border-slate-300 dark:border-stroke-dark dark:bg-dark-2 dark:text-slate-300"
							}`}
						>
							<svg
								className='size-3.5 text-slate-500 dark:text-slate-400'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
								/>
							</svg>
							<span>Non-AC Room</span>
						</button>
					</div>
				</div>

				{/* Monthly Rent per Bed (Optional) */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Monthly Rent Per Bed (₹ INR) — Optional
					</label>
					<div className='relative mt-1'>
						<span className='absolute left-3 top-2.5 text-xs font-bold text-slate-400'>
							₹
						</span>
						<input
							type='number'
							min='0'
							max='200000'
							step='1'
							placeholder='e.g. 7500'
							value={rentPerBed}
							onChange={(e) => setRentPerBed(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-white py-2.5 pl-8 pr-3 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						/>
					</div>
					<p className='mt-1 text-[11px] text-slate-400'>
						Indian Rupee standard (can also be updated later per room).
					</p>
				</div>

				{/* Optional Notes */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Room Notes / Amenities (Optional)
					</label>
					<textarea
						rows={2}
						maxLength={500}
						placeholder='e.g. Corner room with balcony, attached washroom, geyser installed.'
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						className='mt-1 w-full rounded-xl border border-stroke bg-white p-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
					/>
				</div>

				{/* Preview Notice */}
				<div className='flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-[11px] text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'>
					<svg
						className='mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
						strokeWidth='2'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							d='M5 13l4 4L19 7'
						/>
					</svg>
					<span>
						Creating this room will generate{" "}
						<strong>{bedCount} individual bed records</strong> (Bed 1
						{bedCount > 1 ? ` to Bed ${bedCount}` : ""}), each initialized with
						status <strong>AVAILABLE</strong>.
					</span>
				</div>
			</form>
		</ModalDialog>
	);
}

// ----------------------------------------------------------------------
// Edit Room Modal Component
// ----------------------------------------------------------------------
interface EditRoomModalProps {
	room: RoomRecord;
	onClose: () => void;
	onSuccess: (room: RoomRecord) => void;
}

function EditRoomModal({ room, onClose, onSuccess }: EditRoomModalProps) {
	const [roomNumber, setRoomNumber] = useState(room.roomNumber);
	const [floor, setFloor] = useState(room.floor);
	const [acType, setAcType] = useState<"AC" | "NON_AC">(
		room.acType as "AC" | "NON_AC"
	);
	const [rentPerBed, setRentPerBed] = useState(
		room.rentPerBed !== null && room.rentPerBed !== undefined
			? String(room.rentPerBed)
			: ""
	);
	const [notes, setNotes] = useState(room.notes || "");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!roomNumber.trim()) {
			setError("Room number is required.");
			return;
		}

		if (!floor.trim()) {
			setError("Floor designation is required.");
			return;
		}

		let parsedRent: number | null = null;
		if (rentPerBed.trim()) {
			const n = parseInt(rentPerBed.trim(), 10);
			if (isNaN(n) || n < 0) {
				setError("Rent must be a valid non-negative number in Rupees.");
				return;
			}
			if (n > 200000) {
				setError("Rent cannot exceed ₹2,00,000 per bed.");
				return;
			}
			parsedRent = n;
		}

		try {
			setIsSubmitting(true);
			const res = await fetch(`/api/user/rooms/${room.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					roomNumber: roomNumber.trim(),
					floor: floor.trim(),
					acType,
					rentPerBed: parsedRent,
					notes: notes.trim() || null,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to update room.");
				setIsSubmitting(false);
				return;
			}

			onSuccess(data.room);
		} catch (err: any) {
			setError(
				err?.message || "An unexpected error occurred. Please try again."
			);
			setIsSubmitting(false);
		}
	};

	return (
		<ModalDialog
			isOpen={true}
			onClose={onClose}
			title={`Edit Room ${room.roomNumber}`}
			subtitle='Update floor, room number, AC specification or rent'
			footer={
				<>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type='submit'
						form='edit-room-form'
						variant='primary'
						size='sm'
						disabled={isSubmitting}
						className='min-w-[120px]'
					>
						{isSubmitting ? "Saving..." : "Save Changes"}
					</Button>
				</>
			}
		>
			<form
				id='edit-room-form'
				onSubmit={handleSubmit}
				className='space-y-4 text-xs'
			>
				{/* Error Alert */}
				{error && (
					<div className='flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200'>
						<svg
							className='mt-0.5 size-4 shrink-0 text-rose-600'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
							/>
						</svg>
						<span>{error}</span>
					</div>
				)}

				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
					<div>
						<label className='font-semibold text-slate-700 dark:text-slate-300'>
							Room Number *
						</label>
						<input
							type='text'
							required
							value={roomNumber}
							onChange={(e) => setRoomNumber(e.target.value)}
							className='mt-1 w-full rounded-xl border border-stroke bg-white px-3 py-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						/>
					</div>

					<div>
						<label className='font-semibold text-slate-700 dark:text-slate-300'>
							Floor Designation *
						</label>
						<input
							type='text'
							required
							value={floor}
							onChange={(e) => setFloor(e.target.value)}
							className='mt-1 w-full rounded-xl border border-stroke bg-white px-3 py-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						/>
					</div>
				</div>

				{/* Sharing notice: read-only */}
				<div className='rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60'>
					<div className='flex items-center justify-between'>
						<span className='font-semibold text-slate-700 dark:text-slate-300'>
							Sharing Configuration:
						</span>
						<span className='font-bold text-slate-900 dark:text-white'>
							{SHARING_CONFIG[room.sharing]?.label || room.sharing} (
							{room.beds.length} Beds)
						</span>
					</div>
					<p className='mt-1 text-[11px] text-slate-500 dark:text-slate-400'>
						Sharing capacity is fixed to preserve individual bed records and
						avoid orphaned allocations.
					</p>
				</div>

				{/* AC or Non-AC Toggle */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Cooling Specification *
					</label>
					<div className='mt-1.5 grid grid-cols-2 gap-2'>
						<button
							type='button'
							onClick={() => setAcType("AC")}
							className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition ${
								acType === "AC"
									? "border-sky-400 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200"
									: "border-stroke bg-white text-slate-700 hover:border-slate-300 dark:border-stroke-dark dark:bg-dark-2 dark:text-slate-300"
							}`}
						>
							<svg
								className='size-3.5 text-sky-600 dark:text-sky-400'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M12 3v18m0-18l3 3m-3-3l-3 3m3 15l3-3m-3 3l-3-3M3 12h18m-18 0l3-3m-3 3l3 3m15-3l-3-3m3 3l-3 3'
								/>
							</svg>
							<span>AC Room</span>
						</button>
						<button
							type='button'
							onClick={() => setAcType("NON_AC")}
							className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 font-bold transition ${
								acType === "NON_AC"
									? "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
									: "border-stroke bg-white text-slate-700 hover:border-slate-300 dark:border-stroke-dark dark:bg-dark-2 dark:text-slate-300"
							}`}
						>
							<svg
								className='size-3.5 text-slate-500 dark:text-slate-400'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='2'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
								/>
							</svg>
							<span>Non-AC Room</span>
						</button>
					</div>
				</div>

				{/* Rent per Bed */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Monthly Rent Per Bed (₹ INR)
					</label>
					<div className='relative mt-1'>
						<span className='absolute left-3 top-2.5 text-xs font-bold text-slate-400'>
							₹
						</span>
						<input
							type='number'
							min='0'
							max='200000'
							step='1'
							placeholder='Leave empty if unassigned'
							value={rentPerBed}
							onChange={(e) => setRentPerBed(e.target.value)}
							className='w-full rounded-xl border border-stroke bg-white py-2.5 pl-8 pr-3 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
						/>
					</div>
				</div>

				{/* Notes */}
				<div>
					<label className='font-semibold text-slate-700 dark:text-slate-300'>
						Room Notes / Amenities
					</label>
					<textarea
						rows={2}
						maxLength={500}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
						className='mt-1 w-full rounded-xl border border-stroke bg-white p-2.5 font-medium text-dark outline-none transition focus:border-primary dark:border-stroke-dark dark:bg-dark-2 dark:text-white'
					/>
				</div>
			</form>
		</ModalDialog>
	);
}

// ----------------------------------------------------------------------
// Delete Room Modal Component
// ----------------------------------------------------------------------
interface DeleteRoomModalProps {
	room: RoomRecord;
	onClose: () => void;
	onSuccess: () => void;
}

function DeleteRoomModal({ room, onClose, onSuccess }: DeleteRoomModalProps) {
	const [isDeleting, setIsDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const nonAvailableBeds = room.beds.filter(
		(b: { status: string }) => b.status !== "AVAILABLE"
	);
	const canDelete = nonAvailableBeds.length === 0;

	const handleDelete = async () => {
		setError(null);
		try {
			setIsDeleting(true);
			const res = await fetch(`/api/user/rooms/${room.id}`, {
				method: "DELETE",
			});

			const data = await res.json();
			if (!res.ok) {
				setError(data.message || "Failed to delete room.");
				setIsDeleting(false);
				return;
			}

			onSuccess();
		} catch (err: any) {
			setError(
				err?.message || "An unexpected error occurred. Please try again."
			);
			setIsDeleting(false);
		}
	};

	return (
		<ModalDialog
			isOpen={true}
			onClose={onClose}
			title={`Delete Room ${room.roomNumber}?`}
			maxWidth='max-w-md'
			footer={
				<>
					<Button
						type='button'
						variant='outline'
						size='sm'
						onClick={onClose}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						type='button'
						variant='primary'
						size='sm'
						onClick={handleDelete}
						disabled={!canDelete || isDeleting}
						className='bg-rose-600 hover:bg-rose-700'
					>
						{isDeleting ? "Deleting..." : "Confirm Delete"}
					</Button>
				</>
			}
		>
			<div className='space-y-3 text-xs'>
				<div className='flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'>
					<svg
						className='size-6'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth='2'
							d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
						/>
					</svg>
				</div>

				<p className='text-xs leading-relaxed text-slate-600 dark:text-slate-400'>
					Are you sure you want to delete Room {room.roomNumber} ({room.floor})?
					This will permanently remove this room and its {room.beds.length}{" "}
					associated bed record(s).
				</p>

				{!canDelete && (
					<div className='flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200'>
						<svg
							className='mt-0.5 size-4 shrink-0 text-amber-600'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
							/>
						</svg>
						<span>
							Cannot delete this room: {nonAvailableBeds.length} bed(s) are
							currently occupied or under maintenance. Please vacate the beds
							first.
						</span>
					</div>
				)}

				{error && (
					<div className='flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200'>
						<svg
							className='mt-0.5 size-4 shrink-0 text-rose-600'
							fill='none'
							viewBox='0 0 24 24'
							stroke='currentColor'
						>
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								strokeWidth='2'
								d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
							/>
						</svg>
						<span>{error}</span>
					</div>
				)}
			</div>
		</ModalDialog>
	);
}
