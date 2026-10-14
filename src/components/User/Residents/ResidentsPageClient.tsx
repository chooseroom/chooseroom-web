"use client";

import { Badge, Button, Card, CardContent } from "@/components/Common/UI";
import { formatINR } from "@/libs/formatters";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Types matching Prisma Schema
export interface BedOption {
	id: string;
	bedNumber: number;
	status: string; // "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
}

export interface RoomOption {
	id: string;
	roomNumber: string;
	floor: string;
	sharing: string;
	acType: string;
	rentPerBed?: number | null;
	beds: BedOption[];
}

export interface PropertyOption {
	id: string;
	name: string;
	city: string;
	area?: string;
	rooms: RoomOption[];
}

export interface ResidentRecord {
	id: string;
	name: string;
	phone: string;
	email: string | null;
	guardianName: string | null;
	guardianPhone: string | null;
	checkInDate: string | Date;
	checkOutDate: string | Date | null;
	status: string; // "ACTIVE" | "CHECKED_OUT"
	monthlyRent: number;
	securityDeposit: number;
	notes: string | null;
	propertyId: string;
	roomId: string;
	bedId: string;
	property: {
		id: string;
		name: string;
		city: string;
		area?: string;
	};
	room: {
		id: string;
		roomNumber: string;
		floor: string;
		sharing: string;
		acType: string;
		rentPerBed?: number | null;
	};
	bed: {
		id: string;
		bedNumber: number;
		status: string;
	};
}

interface Props {
	properties: PropertyOption[];
	initialResidents: ResidentRecord[];
}

// ----------------------------------------------------------------------
// Reusable High-Z-Index Portal Modal Dialog (Highest Z-Index: z-[99999])
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
				className={`relative flex max-h-[90vh] w-full ${maxWidth} flex-col rounded-2xl border border-[#E8E3D8] bg-white shadow-2xl dark:border-[#1E382B] dark:bg-[#071711] sm:rounded-3xl`}
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

export default function ResidentsPageClient({
	properties,
	initialResidents,
}: Props) {
	const router = useRouter();
	const searchParams = useSearchParams();

	// Local mutable residents state
	const [residents, setResidents] =
		useState<ResidentRecord[]>(initialResidents);

	// Property state to track live bed availability updates
	const [propertyList, setPropertyList] =
		useState<PropertyOption[]>(properties);

	// Active property filter
	const [selectedPropertyId, setSelectedPropertyId] = useState<string>(
		properties[0]?.id || ""
	);

	// Search & Status filters
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<
		"ALL" | "ACTIVE" | "CHECKED_OUT"
	>("ACTIVE");

	// Modals state
	const [isAddModalOpen, setIsAddModalOpen] = useState(false);
	const [viewResident, setViewResident] = useState<ResidentRecord | null>(null);
	const [checkoutResident, setCheckoutResident] =
		useState<ResidentRecord | null>(null);
	const [editResident, setEditResident] = useState<ResidentRecord | null>(null);

	// Form states for Add Resident
	const [formPropertyId, setFormPropertyId] = useState<string>(
		selectedPropertyId || properties[0]?.id || ""
	);
	const [formRoomId, setFormRoomId] = useState<string>("");
	const [formBedId, setFormBedId] = useState<string>("");
	const [formName, setFormName] = useState("");
	const [formPhone, setFormPhone] = useState("");
	const [formEmail, setFormEmail] = useState("");
	const [formGuardianName, setFormGuardianName] = useState("");
	const [formGuardianPhone, setFormGuardianPhone] = useState("");
	const [formCheckInDate, setFormCheckInDate] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [formMonthlyRent, setFormMonthlyRent] = useState<string>("");
	const [formDeposit, setFormDeposit] = useState<string>("0");
	const [formNotes, setFormNotes] = useState("");
	const [formError, setFormError] = useState("");
	const [formSubmitting, setFormSubmitting] = useState(false);

	// Checkout form state
	const [checkoutDate, setCheckoutDate] = useState(
		new Date().toISOString().split("T")[0]
	);
	const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
	const [checkoutError, setCheckoutError] = useState("");

	// Edit form state
	const [editName, setEditName] = useState("");
	const [editPhone, setEditPhone] = useState("");
	const [editEmail, setEditEmail] = useState("");
	const [editGuardianName, setEditGuardianName] = useState("");
	const [editGuardianPhone, setEditGuardianPhone] = useState("");
	const [editMonthlyRent, setEditMonthlyRent] = useState("");
	const [editDeposit, setEditDeposit] = useState("");
	const [editNotes, setEditNotes] = useState("");
	const [editSubmitting, setEditSubmitting] = useState(false);
	const [editError, setEditError] = useState("");

	// Auto-open Add modal if ?action=add
	useEffect(() => {
		if (searchParams.get("action") === "add") {
			setIsAddModalOpen(true);
		}
	}, [searchParams]);

	// Current property context for Add form
	const selectedFormProperty = useMemo(() => {
		return propertyList.find((p) => p.id === formPropertyId) || propertyList[0];
	}, [propertyList, formPropertyId]);

	// Available rooms in the selected property
	const availableRoomsInProperty = useMemo(() => {
		if (!selectedFormProperty) return [];
		return selectedFormProperty.rooms;
	}, [selectedFormProperty]);

	// Selected room object
	const selectedRoom = useMemo(() => {
		return availableRoomsInProperty.find((r) => r.id === formRoomId);
	}, [availableRoomsInProperty, formRoomId]);

	// Available beds in the selected room
	const availableBedsInRoom = useMemo(() => {
		if (!selectedRoom) return [];
		return selectedRoom.beds.filter((b) => b.status === "AVAILABLE");
	}, [selectedRoom]);

	// When room selection changes, update default rent and pick first available bed
	const handleRoomChange = (roomId: string) => {
		setFormRoomId(roomId);
		const foundRoom = availableRoomsInProperty.find((r) => r.id === roomId);
		if (foundRoom) {
			const freeBeds = foundRoom.beds.filter((b) => b.status === "AVAILABLE");
			setFormBedId(freeBeds[0]?.id || "");
			if (foundRoom.rentPerBed) {
				setFormMonthlyRent(String(foundRoom.rentPerBed));
			}
		} else {
			setFormBedId("");
		}
	};

	// Reset Add Modal
	const openAddModal = () => {
		setFormPropertyId(selectedPropertyId || properties[0]?.id || "");
		const prop =
			properties.find((p) => p.id === selectedPropertyId) || properties[0];
		if (prop && prop.rooms.length > 0) {
			const firstRoom = prop.rooms[0];
			setFormRoomId(firstRoom.id);
			const freeBeds = firstRoom.beds.filter((b) => b.status === "AVAILABLE");
			setFormBedId(freeBeds[0]?.id || "");
			if (firstRoom.rentPerBed) {
				setFormMonthlyRent(String(firstRoom.rentPerBed));
			} else {
				setFormMonthlyRent("");
			}
		} else {
			setFormRoomId("");
			setFormBedId("");
			setFormMonthlyRent("");
		}
		setFormName("");
		setFormPhone("");
		setFormEmail("");
		setFormGuardianName("");
		setFormGuardianPhone("");
		setFormCheckInDate(new Date().toISOString().split("T")[0]);
		setFormDeposit("0");
		setFormNotes("");
		setFormError("");
		setIsAddModalOpen(true);
	};

	// Open Edit Modal
	const openEditModal = (resident: ResidentRecord) => {
		setEditResident(resident);
		setEditName(resident.name);
		setEditPhone(resident.phone);
		setEditEmail(resident.email || "");
		setEditGuardianName(resident.guardianName || "");
		setEditGuardianPhone(resident.guardianPhone || "");
		setEditMonthlyRent(String(resident.monthlyRent));
		setEditDeposit(String(resident.securityDeposit || 0));
		setEditNotes(resident.notes || "");
		setEditError("");
	};

	// Submit Add Resident Form
	const handleAddResidentSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setFormError("");

		if (!formName.trim() || formName.trim().length < 2) {
			setFormError("Full name must be at least 2 characters long.");
			return;
		}

		const cleanPhone = formPhone.replace(/\D/g, "");
		if (cleanPhone.length !== 10) {
			setFormError("Please enter a valid 10-digit Indian mobile number.");
			return;
		}

		if (!formPropertyId || !formRoomId || !formBedId) {
			setFormError("Please select an available room and bed.");
			return;
		}

		const rent = Number(formMonthlyRent);
		if (isNaN(rent) || rent < 0 || !Number.isInteger(rent)) {
			setFormError("Monthly rent must be a non-negative whole rupee amount.");
			return;
		}

		const deposit = Number(formDeposit || 0);
		if (isNaN(deposit) || deposit < 0 || !Number.isInteger(deposit)) {
			setFormError("Security deposit must be a valid whole rupee amount.");
			return;
		}

		setFormSubmitting(true);

		try {
			const res = await fetch("/api/user/residents", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: formName.trim(),
					phone: cleanPhone,
					email: formEmail.trim() || null,
					guardianName: formGuardianName.trim() || null,
					guardianPhone: formGuardianPhone.trim() || null,
					checkInDate: formCheckInDate,
					propertyId: formPropertyId,
					roomId: formRoomId,
					bedId: formBedId,
					monthlyRent: rent,
					securityDeposit: deposit,
					notes: formNotes.trim() || null,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				setFormError(data.message || "Failed to onboard resident.");
				setFormSubmitting(false);
				return;
			}

			// 1. Prepend resident to local state
			setResidents((prev) => [data, ...prev]);

			// 2. Mark the bed as OCCUPIED in local propertyList
			setPropertyList((prevProps) =>
				prevProps.map((p) => {
					if (p.id !== formPropertyId) return p;
					return {
						...p,
						rooms: p.rooms.map((r) => {
							if (r.id !== formRoomId) return r;
							return {
								...r,
								beds: r.beds.map((b) =>
									b.id === formBedId ? { ...b, status: "OCCUPIED" } : b
								),
							};
						}),
					};
				})
			);

			setIsAddModalOpen(false);
			router.refresh();
		} catch (err) {
			console.error("Add resident error:", err);
			setFormError("An unexpected error occurred. Please try again.");
		} finally {
			setFormSubmitting(false);
		}
	};

	// Submit Checkout
	const handleCheckoutSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!checkoutResident) return;
		setCheckoutError("");
		setCheckoutSubmitting(true);

		try {
			const res = await fetch(
				`/api/user/residents/${checkoutResident.id}/checkout`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ checkoutDate }),
				}
			);

			const data = await res.json();
			if (!res.ok) {
				setCheckoutError(data.message || "Checkout failed.");
				setCheckoutSubmitting(false);
				return;
			}

			// Update resident status locally
			setResidents((prev) =>
				prev.map((r) => {
					if (r.id === checkoutResident.id) {
						return {
							...r,
							status: "CHECKED_OUT",
							checkOutDate: checkoutDate,
						};
					}
					return r;
				})
			);

			// Release bed in local propertyList
			setPropertyList((prevProps) =>
				prevProps.map((p) => {
					if (p.id !== checkoutResident.propertyId) return p;
					return {
						...p,
						rooms: p.rooms.map((r) => {
							if (r.id !== checkoutResident.roomId) return r;
							return {
								...r,
								beds: r.beds.map((b) =>
									b.id === checkoutResident.bedId
										? { ...b, status: "AVAILABLE" }
										: b
								),
							};
						}),
					};
				})
			);

			setCheckoutResident(null);
			router.refresh();
		} catch (err) {
			console.error("Checkout error:", err);
			setCheckoutError("Failed to complete checkout. Please try again.");
		} finally {
			setCheckoutSubmitting(false);
		}
	};

	// Submit Edit Resident
	const handleEditSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!editResident) return;
		setEditError("");

		if (!editName.trim() || editName.trim().length < 2) {
			setEditError("Full name must be at least 2 characters long.");
			return;
		}

		const cleanPhone = editPhone.replace(/\D/g, "");
		if (cleanPhone.length !== 10) {
			setEditError("Please enter a valid 10-digit Indian mobile number.");
			return;
		}

		const rent = Number(editMonthlyRent);
		if (isNaN(rent) || rent < 0 || !Number.isInteger(rent)) {
			setEditError("Monthly rent must be a non-negative whole rupee amount.");
			return;
		}

		const deposit = Number(editDeposit || 0);
		if (isNaN(deposit) || deposit < 0 || !Number.isInteger(deposit)) {
			setEditError("Security deposit must be a valid whole rupee amount.");
			return;
		}

		setEditSubmitting(true);

		try {
			const res = await fetch(`/api/user/residents/${editResident.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: editName.trim(),
					phone: cleanPhone,
					email: editEmail.trim() || null,
					guardianName: editGuardianName.trim() || null,
					guardianPhone: editGuardianPhone.trim() || null,
					monthlyRent: rent,
					securityDeposit: deposit,
					notes: editNotes.trim() || null,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setEditError(data.message || "Failed to update resident details.");
				setEditSubmitting(false);
				return;
			}

			// Update locally
			setResidents((prev) =>
				prev.map((r) => (r.id === editResident.id ? { ...r, ...data } : r))
			);

			setEditResident(null);
			router.refresh();
		} catch (err) {
			console.error("Edit resident error:", err);
			setEditError("Failed to update resident. Please try again.");
		} finally {
			setEditSubmitting(false);
		}
	};

	// Filtered Residents Calculation
	const filteredResidents = useMemo(() => {
		return residents.filter((r) => {
			// Property filter
			if (selectedPropertyId && r.propertyId !== selectedPropertyId) {
				return false;
			}
			// Status filter
			if (statusFilter !== "ALL" && r.status !== statusFilter) {
				return false;
			}
			// Search query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const matchName = r.name.toLowerCase().includes(q);
				const matchPhone = r.phone.includes(q);
				const matchRoom = r.room.roomNumber.toLowerCase().includes(q);
				return matchName || matchPhone || matchRoom;
			}
			return true;
		});
	}, [residents, selectedPropertyId, statusFilter, searchQuery]);

	// Counts
	const activeCount = useMemo(
		() =>
			residents.filter(
				(r) =>
					(!selectedPropertyId || r.propertyId === selectedPropertyId) &&
					r.status === "ACTIVE"
			).length,
		[residents, selectedPropertyId]
	);

	const checkedOutCount = useMemo(
		() =>
			residents.filter(
				(r) =>
					(!selectedPropertyId || r.propertyId === selectedPropertyId) &&
					r.status === "CHECKED_OUT"
			).length,
		[residents, selectedPropertyId]
	);

	return (
		<div className='space-y-6 sm:space-y-8'>
			{/* Top Header & Property Switcher */}
			<div className='flex flex-col justify-between gap-4 border-b border-stroke pb-6 dark:border-stroke-dark sm:flex-row sm:items-center'>
				<div>
					<div className='flex flex-wrap items-center gap-2.5'>
						<h1 className='font-satoshi text-2xl font-bold tracking-tight text-dark dark:text-white sm:text-3xl'>
							Resident Management
						</h1>
						<Badge variant='success' size='sm'>
							{activeCount} Active
						</Badge>
						{checkedOutCount > 0 && (
							<Badge variant='neutral' size='sm'>
								{checkedOutCount} Past
							</Badge>
						)}
					</div>
					<p className='mt-1 text-xs text-body dark:text-gray-4 sm:text-sm'>
						Manage resident onboarding, room and bed assignments, and departure
						history.
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-3'>
					{/* Multi-Property Switcher if > 1 */}
					{properties.length > 1 && (
						<select
							value={selectedPropertyId}
							onChange={(e) => setSelectedPropertyId(e.target.value)}
							aria-label='Filter by property'
							className='rounded-xl border border-stroke bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
						>
							{properties.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name} ({p.city})
								</option>
							))}
						</select>
					)}

					<Button
						variant='primary'
						size='sm'
						onClick={openAddModal}
						className='shadow-sm'
					>
						+ Onboard Resident
					</Button>
				</div>
			</div>

			{/* Filter & Search Bar */}
			<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
				<CardContent className='p-4 sm:p-5'>
					<div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
						{/* Search Input */}
						<div className='relative flex-1'>
							<span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400'>
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
										d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
									/>
								</svg>
							</span>
							<input
								type='text'
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder='Search by resident name, mobile, or room number...'
								className='w-full rounded-xl border border-stroke bg-slate-50/60 py-2 pl-9.5 pr-4 text-xs text-slate-900 transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>

						{/* Status Filter Tabs */}
						<div className='flex items-center gap-1.5 rounded-xl border border-stroke bg-slate-50 p-1 dark:border-stroke-dark dark:bg-dark-2'>
							<button
								type='button'
								onClick={() => setStatusFilter("ACTIVE")}
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
									statusFilter === "ACTIVE"
										? "bg-white text-emerald-800 shadow-sm dark:bg-[#071711] dark:text-emerald-400"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
								}`}
							>
								Active ({activeCount})
							</button>
							<button
								type='button'
								onClick={() => setStatusFilter("CHECKED_OUT")}
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
									statusFilter === "CHECKED_OUT"
										? "bg-white text-emerald-800 shadow-sm dark:bg-[#071711] dark:text-emerald-400"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
								}`}
							>
								Past / Checked Out ({checkedOutCount})
							</button>
							<button
								type='button'
								onClick={() => setStatusFilter("ALL")}
								className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
									statusFilter === "ALL"
										? "bg-white text-emerald-800 shadow-sm dark:bg-[#071711] dark:text-emerald-400"
										: "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
								}`}
							>
								All ({residents.length})
							</button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Residents Content View: Responsive Desktop Table & Mobile Cards */}
			{filteredResidents.length === 0 ? (
				<Card className='border-[#E8E3D8] bg-white p-8 text-center shadow-sm dark:border-[#1E382B] dark:bg-[#071711] sm:p-12'>
					<div className='mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
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
								d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
							/>
						</svg>
					</div>
					<h3 className='mt-4 font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
						{searchQuery.trim()
							? "No matching residents found"
							: statusFilter === "CHECKED_OUT"
								? "No checked out residents yet"
								: "No residents checked in yet"}
					</h3>
					<p className='mx-auto mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
						{searchQuery.trim()
							? `No resident matched "${searchQuery}". Try searching by another keyword.`
							: "Onboard your first resident by selecting an available bed from your configured rooms."}
					</p>
					<div className='mt-5 flex justify-center gap-3'>
						{searchQuery.trim() ? (
							<Button
								variant='outline'
								size='sm'
								onClick={() => setSearchQuery("")}
							>
								Clear Search
							</Button>
						) : (
							<Button variant='primary' size='sm' onClick={openAddModal}>
								+ Onboard Resident
							</Button>
						)}
					</div>
				</Card>
			) : (
				<div className='space-y-4'>
					{/* Desktop Table View (Hidden on mobile) */}
					<div className='hidden rounded-2xl border border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711] md:block'>
						<div className='overflow-x-auto'>
							<table className='w-full min-w-[900px] text-left text-xs sm:text-sm'>
								<thead className='border-b border-stroke bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-stroke-dark dark:bg-dark-2 dark:text-slate-300'>
									<tr>
										<th className='whitespace-nowrap px-5 py-3.5'>
											Resident Name
										</th>
										<th className='whitespace-nowrap px-4 py-3.5'>Contact</th>
										<th className='whitespace-nowrap px-4 py-3.5'>Allotment</th>
										<th className='whitespace-nowrap px-4 py-3.5'>
											Check-In Date
										</th>
										<th className='whitespace-nowrap px-4 py-3.5'>
											Monthly Rent
										</th>
										<th className='whitespace-nowrap px-4 py-3.5'>Status</th>
										<th className='whitespace-nowrap px-5 py-3.5 text-right'>
											Actions
										</th>
									</tr>
								</thead>
								<tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
									{filteredResidents.map((r) => {
										const isActive = r.status === "ACTIVE";
										const checkInStr = new Date(
											r.checkInDate
										).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "short",
											year: "numeric",
										});
										let checkOutStr: string | null = null;
										if (r.checkOutDate) {
											checkOutStr = new Date(r.checkOutDate).toLocaleDateString(
												"en-IN",
												{
													day: "numeric",
													month: "short",
													year: "numeric",
												}
											);
										}

										return (
											<tr
												key={r.id}
												className='transition hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
											>
												{/* Name & Initial Avatar */}
												<td className='whitespace-nowrap px-5 py-4'>
													<div className='flex items-center gap-3'>
														<div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'>
															{r.name.charAt(0).toUpperCase()}
														</div>
														<div>
															<p className='font-semibold text-slate-900 dark:text-white'>
																{r.name}
															</p>
															{r.email && (
																<p className='text-[11px] text-slate-500 dark:text-slate-400'>
																	{r.email}
																</p>
															)}
														</div>
													</div>
												</td>

												{/* Contact */}
												<td className='whitespace-nowrap px-4 py-4'>
													<div className='space-y-0.5'>
														<p className='font-semibold text-slate-900 dark:text-white'>
															+91 {r.phone}
														</p>
														{r.guardianName ? (
															<p className='text-[11px] text-slate-500 dark:text-slate-400'>
																Guardian: {r.guardianName}
															</p>
														) : null}
													</div>
												</td>

												{/* Room & Bed Allotment */}
												<td className='whitespace-nowrap px-4 py-4'>
													<div className='space-y-0.5'>
														<span className='inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200'>
															Room {r.room.roomNumber} • Bed {r.bed.bedNumber}
														</span>
														<p className='text-[11px] text-slate-500 dark:text-slate-400'>
															{r.room.floor}
														</p>
													</div>
												</td>

												{/* Check-In / Check-Out Date */}
												<td className='whitespace-nowrap px-4 py-4'>
													<p className='font-medium text-slate-900 dark:text-white'>
														{checkInStr}
													</p>
													{checkOutStr ? (
														<p className='text-[11px] text-amber-700 dark:text-amber-400'>
															Vacated: {checkOutStr}
														</p>
													) : null}
												</td>

												{/* Monthly Rent */}
												<td className='whitespace-nowrap px-4 py-4'>
													<p className='font-semibold text-emerald-800 dark:text-emerald-400'>
														{formatINR(r.monthlyRent)}
														<span className='text-[11px] font-normal text-slate-500 dark:text-slate-400'>
															/mo
														</span>
													</p>
													{r.securityDeposit > 0 ? (
														<p className='text-[11px] text-slate-500 dark:text-slate-400'>
															Dep: {formatINR(r.securityDeposit)}
														</p>
													) : null}
												</td>

												{/* Status Badge */}
												<td className='whitespace-nowrap px-4 py-4'>
													{isActive ? (
														<span className='inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
															<span className='size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400' />
															Active
														</span>
													) : (
														<span className='inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
															<span className='size-1.5 rounded-full bg-slate-400' />
															Checked Out
														</span>
													)}
												</td>

												{/* Actions */}
												<td className='whitespace-nowrap px-5 py-4 text-right'>
													<div className='flex items-center justify-end gap-2'>
														<button
															type='button'
															onClick={() => setViewResident(r)}
															className='rounded-lg border border-stroke px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-stroke-dark dark:text-slate-300 dark:hover:bg-slate-800'
														>
															View
														</button>

														<button
															type='button'
															onClick={() => openEditModal(r)}
															className='rounded-lg border border-stroke px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-stroke-dark dark:text-slate-300 dark:hover:bg-slate-800'
														>
															Edit
														</button>

														{isActive && (
															<button
																type='button'
																onClick={() => {
																	setCheckoutResident(r);
																	setCheckoutDate(
																		new Date().toISOString().split("T")[0]
																	);
																	setCheckoutError("");
																}}
																className='rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60'
															>
																Vacate
															</button>
														)}
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{/* Mobile Card View (Visible on mobile screens) */}
					<div className='space-y-3.5 md:hidden'>
						{filteredResidents.map((r) => {
							const isActive = r.status === "ACTIVE";
							const checkInStr = new Date(r.checkInDate).toLocaleDateString(
								"en-IN",
								{ day: "numeric", month: "short", year: "numeric" }
							);

							return (
								<Card
									key={r.id}
									className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'
								>
									<CardContent className='p-4'>
										<div className='flex items-start justify-between gap-3'>
											<div className='flex items-center gap-2.5'>
												<div className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'>
													{r.name.charAt(0).toUpperCase()}
												</div>
												<div>
													<h4 className='font-satoshi text-sm font-bold text-slate-900 dark:text-white'>
														{r.name}
													</h4>
													<p className='text-xs text-slate-500 dark:text-slate-400'>
														+91 {r.phone}
													</p>
													{r.guardianName ? (
														<p className='text-[11px] text-slate-500 dark:text-slate-400'>
															Guardian: {r.guardianName}
														</p>
													) : null}
												</div>
											</div>

											{isActive ? (
												<span className='inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
													<span className='size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400' />
													Active
												</span>
											) : (
												<span className='inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
													<span className='size-1.5 rounded-full bg-slate-400' />
													Checked Out
												</span>
											)}
										</div>

										<div className='mt-3.5 grid grid-cols-2 gap-2 border-y border-slate-100 py-3 text-xs dark:border-slate-800'>
											<div>
												<p className='text-[11px] text-slate-500 dark:text-slate-400'>
													Allotted Bed
												</p>
												<p className='font-semibold text-slate-800 dark:text-slate-200'>
													Room {r.room.roomNumber} (Bed {r.bed.bedNumber})
												</p>
											</div>

											<div>
												<p className='text-[11px] text-slate-500 dark:text-slate-400'>
													Monthly Rent
												</p>
												<p className='font-semibold text-emerald-800 dark:text-emerald-400'>
													{formatINR(r.monthlyRent)}/mo
												</p>
											</div>

											<div>
												<p className='text-[11px] text-slate-500 dark:text-slate-400'>
													Check-In Date
												</p>
												<p className='font-medium text-slate-700 dark:text-slate-300'>
													{checkInStr}
												</p>
											</div>

											<div>
												<p className='text-[11px] text-slate-500 dark:text-slate-400'>
													Security Deposit
												</p>
												<p className='font-medium text-slate-700 dark:text-slate-300'>
													{formatINR(r.securityDeposit)}
												</p>
											</div>
										</div>

										<div className='mt-3 flex items-center justify-end gap-2'>
											<button
												type='button'
												onClick={() => setViewResident(r)}
												className='rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-stroke-dark dark:text-slate-300'
											>
												Details
											</button>
											<button
												type='button'
												onClick={() => openEditModal(r)}
												className='rounded-lg border border-stroke px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-stroke-dark dark:text-slate-300'
											>
												Edit
											</button>
											{isActive && (
												<button
													type='button'
													onClick={() => {
														setCheckoutResident(r);
														setCheckoutDate(
															new Date().toISOString().split("T")[0]
														);
														setCheckoutError("");
													}}
													className='rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300'
												>
													Vacate
												</button>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				</div>
			)}

			{/* ============================================================== */}
			{/* MODAL 1: ADD RESIDENT & ALLOCATE BED                            */}
			{/* ============================================================== */}
			<ModalDialog
				isOpen={isAddModalOpen}
				onClose={() => setIsAddModalOpen(false)}
				title='Onboard New Resident'
				subtitle='Collect resident contact details and assign an available bed.'
				maxWidth='max-w-xl'
				footer={
					<>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setIsAddModalOpen(false)}
							disabled={formSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant='primary'
							size='sm'
							onClick={handleAddResidentSubmit}
							disabled={
								formSubmitting ||
								availableBedsInRoom.length === 0 ||
								!formRoomId
							}
						>
							{formSubmitting ? "Allocating Bed..." : "Onboard Resident"}
						</Button>
					</>
				}
			>
				<form onSubmit={handleAddResidentSubmit} className='space-y-4'>
					{formError && (
						<div className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300'>
							{formError}
						</div>
					)}

					{/* 1. Property & Room Selection */}
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
						{/* Property Selection */}
						{properties.length > 1 && (
							<div className='sm:col-span-2'>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Property <span className='text-rose-500'>*</span>
								</label>
								<select
									value={formPropertyId}
									onChange={(e) => {
										const newPropId = e.target.value;
										setFormPropertyId(newPropId);
										const prop = propertyList.find((p) => p.id === newPropId);
										if (prop && prop.rooms.length > 0) {
											handleRoomChange(prop.rooms[0].id);
										} else {
											setFormRoomId("");
											setFormBedId("");
										}
									}}
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								>
									{properties.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name} ({p.city})
										</option>
									))}
								</select>
							</div>
						)}

						{/* Room Selection */}
						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Select Room <span className='text-rose-500'>*</span>
							</label>
							{availableRoomsInProperty.length === 0 ? (
								<p className='text-xs text-slate-500'>
									No rooms configured yet.{" "}
									<Link
										href='/user/rooms?action=add'
										className='text-emerald-700 underline'
									>
										Add room first
									</Link>
								</p>
							) : (
								<select
									value={formRoomId}
									onChange={(e) => handleRoomChange(e.target.value)}
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								>
									{availableRoomsInProperty.map((r) => {
										const free = r.beds.filter(
											(b) => b.status === "AVAILABLE"
										).length;
										return (
											<option key={r.id} value={r.id}>
												Room {r.roomNumber} ({r.floor} • {free} bed
												{free === 1 ? "" : "s"} free)
											</option>
										);
									})}
								</select>
							)}
						</div>

						{/* Bed Selection */}
						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Select Available Bed <span className='text-rose-500'>*</span>
							</label>
							{availableBedsInRoom.length === 0 ? (
								<div className='rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300'>
									All beds are occupied in this room.
								</div>
							) : (
								<select
									value={formBedId}
									onChange={(e) => setFormBedId(e.target.value)}
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								>
									{availableBedsInRoom.map((b) => (
										<option key={b.id} value={b.id}>
											Bed {b.bedNumber} (Available)
										</option>
									))}
								</select>
							)}
						</div>
					</div>

					{/* 2. Resident Identity & Contact */}
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Full Name <span className='text-rose-500'>*</span>
							</label>
							<input
								type='text'
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								placeholder='e.g. Rahul Sharma'
								required
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Mobile Number <span className='text-rose-500'>*</span>
							</label>
							<div className='relative'>
								<span className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400'>
									+91
								</span>
								<input
									type='tel'
									value={formPhone}
									onChange={(e) =>
										setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
									}
									placeholder='9876543210'
									required
									maxLength={10}
									className='w-full rounded-xl border border-stroke bg-white py-2 pl-10 pr-3 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>
						</div>
					</div>

					{/* Optional Email */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
							Email Address{" "}
							<span className='text-[10px] font-normal text-slate-400'>
								(Optional)
							</span>
						</label>
						<input
							type='email'
							value={formEmail}
							onChange={(e) => setFormEmail(e.target.value)}
							placeholder='e.g. rahul@example.com'
							className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
						/>
					</div>

					{/* Guardian Details */}
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Guardian Name{" "}
								<span className='text-[10px] font-normal text-slate-400'>
									(Optional)
								</span>
							</label>
							<input
								type='text'
								value={formGuardianName}
								onChange={(e) => setFormGuardianName(e.target.value)}
								placeholder='e.g. Suresh Sharma (Father)'
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Guardian / Emergency Phone{" "}
								<span className='text-[10px] font-normal text-slate-400'>
									(Optional)
								</span>
							</label>
							<input
								type='tel'
								value={formGuardianPhone}
								onChange={(e) =>
									setFormGuardianPhone(
										e.target.value.replace(/\D/g, "").slice(0, 10)
									)
								}
								placeholder='10-digit number'
								maxLength={10}
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>
					</div>

					{/* 3. Financial Agreement & Check-In Date */}
					<div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Check-In Date <span className='text-rose-500'>*</span>
							</label>
							<input
								type='date'
								value={formCheckInDate}
								onChange={(e) => setFormCheckInDate(e.target.value)}
								required
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Monthly Rent (₹) <span className='text-rose-500'>*</span>
							</label>
							<input
								type='number'
								value={formMonthlyRent}
								onChange={(e) => setFormMonthlyRent(e.target.value)}
								placeholder='e.g. 7500'
								min={0}
								required
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Security Deposit (₹)
							</label>
							<input
								type='number'
								value={formDeposit}
								onChange={(e) => setFormDeposit(e.target.value)}
								placeholder='e.g. 5000'
								min={0}
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>
					</div>

					{/* Notes */}
					<div>
						<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
							Internal Notes{" "}
							<span className='text-[10px] font-normal text-slate-400'>
								(Optional)
							</span>
						</label>
						<textarea
							value={formNotes}
							onChange={(e) => setFormNotes(e.target.value)}
							rows={2}
							placeholder='e.g. Works at Infopark, night shifts, vegetarian.'
							className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
						/>
					</div>
				</form>
			</ModalDialog>

			{/* ============================================================== */}
			{/* MODAL 2: VIEW RESIDENT DETAILS                                  */}
			{/* ============================================================== */}
			<ModalDialog
				isOpen={!!viewResident}
				onClose={() => setViewResident(null)}
				title='Resident Details'
				subtitle='Detailed resident profile, allotment history and contact information.'
				maxWidth='max-w-lg'
				footer={
					<Button
						variant='outline'
						size='sm'
						onClick={() => setViewResident(null)}
					>
						Close
					</Button>
				}
			>
				{viewResident && (
					<div className='space-y-4 text-xs sm:text-sm'>
						{/* Top Banner */}
						<div className='flex items-center gap-3.5 rounded-2xl bg-slate-50 p-4 dark:bg-dark-2'>
							<div className='flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-bold text-white'>
								{viewResident.name.charAt(0).toUpperCase()}
							</div>
							<div>
								<div className='flex items-center gap-2'>
									<h3 className='font-satoshi text-base font-bold text-slate-900 dark:text-white'>
										{viewResident.name}
									</h3>
									{viewResident.status === "ACTIVE" ? (
										<Badge variant='success' size='sm'>
											Active
										</Badge>
									) : (
										<Badge variant='neutral' size='sm'>
											Checked Out
										</Badge>
									)}
								</div>
								<p className='text-xs text-slate-500 dark:text-slate-400'>
									+91 {viewResident.phone}
								</p>
							</div>
						</div>

						{/* Grid Data */}
						<div className='grid grid-cols-2 gap-3 rounded-2xl border border-stroke p-4 dark:border-stroke-dark'>
							<div>
								<span className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>
									Property
								</span>
								<p className='font-semibold text-slate-900 dark:text-white'>
									{viewResident.property.name}
								</p>
							</div>

							<div>
								<span className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>
									Room & Bed
								</span>
								<p className='font-semibold text-slate-900 dark:text-white'>
									Room {viewResident.room.roomNumber} • Bed{" "}
									{viewResident.bed.bedNumber}
								</p>
								<p className='text-[11px] text-slate-500 dark:text-slate-400'>
									{viewResident.room.floor} •{" "}
									{viewResident.room.acType === "AC" ? "AC" : "Non-AC"}
								</p>
							</div>

							<div>
								<span className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>
									Check-In Date
								</span>
								<p className='font-semibold text-slate-900 dark:text-white'>
									{new Date(viewResident.checkInDate).toLocaleDateString(
										"en-IN",
										{ day: "numeric", month: "short", year: "numeric" }
									)}
								</p>
							</div>

							{viewResident.checkOutDate && (
								<div>
									<span className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>
										Check-Out Date
									</span>
									<p className='font-semibold text-amber-700 dark:text-amber-400'>
										{new Date(viewResident.checkOutDate).toLocaleDateString(
											"en-IN",
											{ day: "numeric", month: "short", year: "numeric" }
										)}
									</p>
								</div>
							)}

							<div>
								<span className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>
									Monthly Rent
								</span>
								<p className='font-semibold text-emerald-800 dark:text-emerald-400'>
									{formatINR(viewResident.monthlyRent)}/month
								</p>
							</div>

							<div>
								<span className='text-[11px] font-medium text-slate-500 dark:text-slate-400'>
									Security Deposit
								</span>
								<p className='font-semibold text-slate-900 dark:text-white'>
									{formatINR(viewResident.securityDeposit)}
								</p>
							</div>
						</div>

						{/* Guardian & Emergency Info */}
						{(viewResident.guardianName || viewResident.guardianPhone) && (
							<div className='rounded-2xl border border-stroke bg-slate-50/60 p-4 dark:border-stroke-dark dark:bg-dark-2/60'>
								<h4 className='font-satoshi text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
									Guardian / Emergency Contact
								</h4>
								<div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
									<div>
										<span className='block text-[11px] font-medium text-slate-500 dark:text-slate-400'>
											Guardian Name
										</span>
										<p className='mt-0.5 font-semibold text-slate-900 dark:text-white'>
											{viewResident.guardianName || "Not provided"}
										</p>
									</div>

									{viewResident.guardianPhone ? (
										<div>
											<span className='block text-[11px] font-medium text-slate-500 dark:text-slate-400'>
												Emergency Contact
											</span>
											<p className='mt-0.5 font-semibold text-slate-900 dark:text-white'>
												<a
													href={`tel:${viewResident.guardianPhone}`}
													className='text-emerald-700 hover:underline dark:text-emerald-400'
												>
													+91 {viewResident.guardianPhone}
												</a>
											</p>
										</div>
									) : null}
								</div>
							</div>
						)}

						{/* Notes */}
						{viewResident.notes && (
							<div className='rounded-2xl border border-stroke p-4 dark:border-stroke-dark'>
								<h4 className='font-satoshi text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
									Internal Notes
								</h4>
								<p className='mt-1 text-slate-600 dark:text-slate-400'>
									{viewResident.notes}
								</p>
							</div>
						)}
					</div>
				)}
			</ModalDialog>

			{/* ============================================================== */}
			{/* MODAL 3: CHECKOUT / VACATE CONFIRMATION                         */}
			{/* ============================================================== */}
			<ModalDialog
				isOpen={!!checkoutResident}
				onClose={() => setCheckoutResident(null)}
				title='Confirm Resident Checkout'
				subtitle='This will mark the resident as checked out and release the bed back to Available.'
				maxWidth='max-w-md'
				footer={
					<>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setCheckoutResident(null)}
							disabled={checkoutSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant='danger'
							size='sm'
							onClick={handleCheckoutSubmit}
							disabled={checkoutSubmitting}
						>
							{checkoutSubmitting ? "Processing..." : "Confirm Checkout"}
						</Button>
					</>
				}
			>
				{checkoutResident && (
					<form onSubmit={handleCheckoutSubmit} className='space-y-4'>
						{checkoutError && (
							<div className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300'>
								{checkoutError}
							</div>
						)}

						<div className='rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30'>
							<p className='text-xs text-amber-950 dark:text-amber-200'>
								You are checking out <strong>{checkoutResident.name}</strong>{" "}
								from{" "}
								<strong>
									Room {checkoutResident.room.roomNumber} (Bed{" "}
									{checkoutResident.bed.bedNumber})
								</strong>
								.
							</p>
							<p className='mt-1 text-[11px] text-amber-800 dark:text-amber-300'>
								The bed will immediately become AVAILABLE for new allocations.
								Past history and payment records are preserved.
							</p>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Checkout Date <span className='text-rose-500'>*</span>
							</label>
							<input
								type='date'
								value={checkoutDate}
								onChange={(e) => setCheckoutDate(e.target.value)}
								required
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>
					</form>
				)}
			</ModalDialog>

			{/* ============================================================== */}
			{/* MODAL 4: EDIT RESIDENT DETAILS                                  */}
			{/* ============================================================== */}
			<ModalDialog
				isOpen={!!editResident}
				onClose={() => setEditResident(null)}
				title='Edit Resident Profile'
				subtitle='Update contact information, emergency numbers, and financial agreement.'
				maxWidth='max-w-lg'
				footer={
					<>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setEditResident(null)}
							disabled={editSubmitting}
						>
							Cancel
						</Button>
						<Button
							variant='primary'
							size='sm'
							onClick={handleEditSubmit}
							disabled={editSubmitting}
						>
							{editSubmitting ? "Saving..." : "Save Changes"}
						</Button>
					</>
				}
			>
				{editResident && (
					<form onSubmit={handleEditSubmit} className='space-y-4'>
						{editError && (
							<div className='rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/50 dark:text-rose-300'>
								{editError}
							</div>
						)}

						<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<div>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Full Name <span className='text-rose-500'>*</span>
								</label>
								<input
									type='text'
									value={editName}
									onChange={(e) => setEditName(e.target.value)}
									required
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>

							<div>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Mobile Number <span className='text-rose-500'>*</span>
								</label>
								<input
									type='tel'
									value={editPhone}
									onChange={(e) =>
										setEditPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
									}
									maxLength={10}
									required
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Email Address
							</label>
							<input
								type='email'
								value={editEmail}
								onChange={(e) => setEditEmail(e.target.value)}
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>

						<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<div>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Guardian Name
								</label>
								<input
									type='text'
									value={editGuardianName}
									onChange={(e) => setEditGuardianName(e.target.value)}
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>

							<div>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Guardian Phone
								</label>
								<input
									type='tel'
									value={editGuardianPhone}
									onChange={(e) =>
										setEditGuardianPhone(
											e.target.value.replace(/\D/g, "").slice(0, 10)
										)
									}
									maxLength={10}
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>
						</div>

						<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
							<div>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Monthly Rent (₹) <span className='text-rose-500'>*</span>
								</label>
								<input
									type='number'
									value={editMonthlyRent}
									onChange={(e) => setEditMonthlyRent(e.target.value)}
									min={0}
									required
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>

							<div>
								<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
									Security Deposit (₹)
								</label>
								<input
									type='number'
									value={editDeposit}
									onChange={(e) => setEditDeposit(e.target.value)}
									min={0}
									className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
								/>
							</div>
						</div>

						<div>
							<label className='mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300'>
								Internal Notes
							</label>
							<textarea
								value={editNotes}
								onChange={(e) => setEditNotes(e.target.value)}
								rows={2}
								className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs text-slate-900 transition focus:border-emerald-600 focus:outline-none dark:border-stroke-dark dark:bg-dark-2 dark:text-white sm:text-sm'
							/>
						</div>
					</form>
				)}
			</ModalDialog>
		</div>
	);
}
