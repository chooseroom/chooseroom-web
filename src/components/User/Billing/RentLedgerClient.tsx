"use client";

import { Badge, Button, Card, CardContent } from "@/components/Common/UI";
import { formatINR, formatIndianMobile } from "@/libs/formatters";
import {
	formatBillingPeriod,
	getBillingPeriodString,
	RentStatus,
} from "@/libs/rentLedger";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

export interface PropertyItem {
	id: string;
	name: string;
	city: string;
	area?: string;
	type?: string;
	gender?: string;
}

export interface PaymentItem {
	id: string;
	amount: number;
	paymentDate: string | Date;
	paymentMode: string;
	referenceNumber: string | null;
	receiptNumber: string;
	notes: string | null;
	createdAt: string | Date;
	recordedBy?: {
		id: string;
		name: string | null;
		email: string | null;
	};
}

export interface RentChargeItem {
	id: string;
	residentId: string;
	propertyId: string;
	billingPeriod: string;
	amount: number;
	dueDate: string | Date;
	notes: string | null;
	createdAt: string | Date;
	resident: {
		id: string;
		name: string;
		phone: string;
		guardianName: string | null;
		guardianPhone: string | null;
		monthlyRent: number;
		securityDeposit: number;
		status: string;
		checkInDate: string | Date;
		checkOutDate: string | Date | null;
		room: {
			id: string;
			roomNumber: string;
			floor: string;
			sharing: string;
			acType: string;
		} | null;
		bed: {
			id: string;
			bedNumber: number;
		} | null;
	};
	property: {
		id: string;
		name: string;
		type: string;
		gender: string;
		city: string;
		area: string;
		address: string;
	};
	payments: PaymentItem[];
	summary: {
		totalAmount: number;
		totalPaid: number;
		remainingBalance: number;
		status: RentStatus;
		isFullyPaid: boolean;
		isPartiallyPaid: boolean;
		isOverdue: boolean;
	};
}

interface RentLedgerClientProps {
	properties: PropertyItem[];
	currentBillingPeriod: string;
	currentUser: {
		id: string;
		name: string;
		email: string;
	};
}

export default function RentLedgerClient({
	properties,
	currentBillingPeriod: initialPeriod,
	currentUser,
}: RentLedgerClientProps) {
	// State for filters
	const [selectedPropertyId, setSelectedPropertyId] = useState<string>("ALL");
	const [billingPeriod, setBillingPeriod] = useState<string>(initialPeriod);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [activeTab, setActiveTab] = useState<
		"ALL" | "PENDING" | "PARTIALLY_PAID" | "PAID" | "OVERDUE"
	>("ALL");

	// Ledger data state
	const [charges, setCharges] = useState<RentChargeItem[]>([]);
	const [stats, setStats] = useState({
		totalCharges: 0,
		totalBilled: 0,
		totalCollected: 0,
		totalOutstanding: 0,
		totalOverdue: 0,
		counts: {
			all: 0,
			pending: 0,
			partiallyPaid: 0,
			paid: 0,
			overdue: 0,
		},
	});
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [errorBanner, setErrorBanner] = useState<string | null>(null);
	const [successBanner, setSuccessBanner] = useState<string | null>(null);

	// Modal States
	const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
	const [generatePropertyId, setGeneratePropertyId] = useState<string>("ALL");
	const [generateDueDay, setGenerateDueDay] = useState<number>(5);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generateMessage, setGenerateMessage] = useState<string | null>(null);

	// Record Payment Modal State
	const [selectedChargeForPayment, setSelectedChargeForPayment] =
		useState<RentChargeItem | null>(null);
	const [paymentAmount, setPaymentAmount] = useState<string>("");
	const [paymentMode, setPaymentMode] = useState<
		"CASH" | "UPI" | "BANK_TRANSFER"
	>("UPI");
	const [paymentDate, setPaymentDate] = useState<string>(
		new Date().toISOString().split("T")[0]
	);
	const [referenceNumber, setReferenceNumber] = useState<string>("");
	const [paymentNotes, setPaymentNotes] = useState<string>("");
	const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
	const [paymentModalError, setPaymentModalError] = useState<string | null>(
		null
	);

	// Receipt View / Print Modal State
	const [activeReceipt, setActiveReceipt] = useState<{
		payment: PaymentItem;
		charge: RentChargeItem;
	} | null>(null);

	// Payment History Modal State
	const [historyCharge, setHistoryCharge] = useState<RentChargeItem | null>(
		null
	);
	const [isVoidingId, setIsVoidingId] = useState<string | null>(null);

	// Fetch dues on mount or when period / property changes
	const fetchDues = useCallback(
		async (period = billingPeriod, propId = selectedPropertyId) => {
			setIsLoading(true);
			setErrorBanner(null);
			try {
				const params = new URLSearchParams();
				if (period && period !== "ALL") params.append("billingPeriod", period);
				if (propId && propId !== "ALL") params.append("propertyId", propId);

				const res = await fetch(`/api/user/rent/dues?${params.toString()}`);
				const data = await res.json();
				if (!res.ok) {
					setErrorBanner(data.message || "Failed to load rent ledger data.");
				} else {
					setCharges(data.charges || []);
					setStats(
						data.stats || {
							totalCharges: 0,
							totalBilled: 0,
							totalCollected: 0,
							totalOutstanding: 0,
							totalOverdue: 0,
							counts: {
								all: 0,
								pending: 0,
								partiallyPaid: 0,
								paid: 0,
								overdue: 0,
							},
						}
					);
				}
			} catch (err: any) {
				setErrorBanner(err.message || "Network error loading ledger.");
			} finally {
				setIsLoading(false);
			}
		},
		[billingPeriod, selectedPropertyId]
	);

	useEffect(() => {
		fetchDues();
	}, [fetchDues]);

	// Period navigation helper
	const changePeriodBy = (monthsDelta: number) => {
		const [yearStr, monthStr] = billingPeriod.split("-");
		let year = parseInt(yearStr, 10);
		let month = parseInt(monthStr, 10) + monthsDelta;
		if (month > 12) {
			year += Math.floor((month - 1) / 12);
			month = ((month - 1) % 12) + 1;
		} else if (month < 1) {
			year += Math.floor((month - 12) / 12);
			month = 12 + (month % 12 || 0);
		}
		const newPeriod = `${year}-${String(month).padStart(2, "0")}`;
		setBillingPeriod(newPeriod);
	};

	// Generate Rent Handler
	const handleGenerateRent = async () => {
		setIsGenerating(true);
		setGenerateMessage(null);
		try {
			const res = await fetch("/api/user/rent/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					billingPeriod,
					propertyId: generatePropertyId,
					dueDay: generateDueDay,
				}),
			});
			const data = await res.json();
			if (!res.ok) {
				setGenerateMessage(`Error: ${data.message}`);
			} else {
				setSuccessBanner(data.message);
				setIsGenerateModalOpen(false);
				fetchDues(billingPeriod, selectedPropertyId);
			}
		} catch (err: any) {
			setGenerateMessage(`Error: ${err.message}`);
		} finally {
			setIsGenerating(false);
		}
	};

	// Open Payment Modal
	const openRecordPaymentModal = (charge: RentChargeItem) => {
		setSelectedChargeForPayment(charge);
		setPaymentAmount(String(charge.summary.remainingBalance));
		setPaymentMode("UPI");
		setPaymentDate(new Date().toISOString().split("T")[0]);
		setReferenceNumber("");
		setPaymentNotes("");
		setPaymentModalError(null);
	};

	// Submit Payment Handler
	const handleSubmitPayment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedChargeForPayment) return;

		const amt = Number(paymentAmount);
		if (isNaN(amt) || amt <= 0 || !Number.isInteger(amt)) {
			setPaymentModalError(
				"Please enter a valid whole rupee amount greater than 0."
			);
			return;
		}

		if (amt > selectedChargeForPayment.summary.remainingBalance) {
			setPaymentModalError(
				`Payment amount cannot exceed remaining balance of ₹${selectedChargeForPayment.summary.remainingBalance.toLocaleString(
					"en-IN"
				)}.`
			);
			return;
		}

		setIsSubmittingPayment(true);
		setPaymentModalError(null);

		try {
			const res = await fetch("/api/user/rent/payments", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					rentChargeId: selectedChargeForPayment.id,
					amount: amt,
					paymentMode,
					paymentDate,
					referenceNumber: referenceNumber.trim() || undefined,
					notes: paymentNotes.trim() || undefined,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				setPaymentModalError(data.message || "Failed to record payment.");
				setIsSubmittingPayment(false);
				return;
			}

			// Success! Open receipt modal immediately
			const updatedCharge: RentChargeItem = {
				...selectedChargeForPayment,
				payments: [data.payment, ...selectedChargeForPayment.payments],
				summary: data.summary,
			};

			setSelectedChargeForPayment(null);
			setIsSubmittingPayment(false);
			setSuccessBanner(data.message);

			// Automatically show the receipt for this newly recorded payment
			setActiveReceipt({
				payment: data.payment,
				charge: updatedCharge,
			});

			// Refresh dues in background
			fetchDues(billingPeriod, selectedPropertyId);
		} catch (err: any) {
			setPaymentModalError(err.message || "Error submitting payment.");
			setIsSubmittingPayment(false);
		}
	};

	// Handle Payment Void/Reversal
	const handleVoidPayment = async (paymentId: string) => {
		if (
			!confirm(
				"Are you sure you want to void this payment? This will restore the resident's outstanding balance while maintaining an audit trail."
			)
		) {
			return;
		}

		setIsVoidingId(paymentId);
		try {
			const res = await fetch(`/api/user/rent/payments/${paymentId}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason: "Owner voided entry" }),
			});
			const data = await res.json();
			if (!res.ok) {
				alert(data.message || "Failed to void payment");
			} else {
				setSuccessBanner(data.message);
				if (historyCharge) {
					// update history modal view
					const updatedPayments = historyCharge.payments.map((p) =>
						p.id === paymentId
							? { ...p, amount: 0, notes: data.payment.notes }
							: p
					);
					setHistoryCharge({
						...historyCharge,
						payments: updatedPayments,
						summary: data.summary,
					});
				}
				fetchDues(billingPeriod, selectedPropertyId);
			}
		} catch (err: any) {
			alert(err.message || "Error voiding payment");
		} finally {
			setIsVoidingId(null);
		}
	};

	// Filtered charges for the current table view
	const filteredCharges = useMemo(() => {
		return charges.filter((c) => {
			// Tab Filter
			if (activeTab === "PENDING" && c.summary.status !== "PENDING")
				return false;
			if (activeTab === "PARTIALLY_PAID" && !c.summary.isPartiallyPaid)
				return false;
			if (activeTab === "PAID" && c.summary.status !== "PAID") return false;
			if (activeTab === "OVERDUE" && !c.summary.isOverdue) return false;

			// Search Query
			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase().trim();
				const nameMatch = c.resident?.name?.toLowerCase().includes(q);
				const phoneMatch = c.resident?.phone?.includes(q);
				const roomMatch = c.resident?.room?.roomNumber
					?.toLowerCase()
					.includes(q);
				const bedMatch = String(c.resident?.bed?.bedNumber || "").includes(q);
				if (!nameMatch && !phoneMatch && !roomMatch && !bedMatch) return false;
			}

			return true;
		});
	}, [charges, activeTab, searchQuery]);

	// Render Status Badge
	const renderStatusBadge = (charge: RentChargeItem) => {
		const { status, isOverdue } = charge.summary;
		if (status === "PAID") {
			return (
				<span className='inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
					<span className='size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400'></span>
					Paid
				</span>
			);
		}
		if (isOverdue) {
			return (
				<span className='inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300'>
					<span className='size-1.5 rounded-full bg-rose-600 dark:bg-rose-400'></span>
					Overdue
				</span>
			);
		}
		if (status === "PARTIALLY_PAID") {
			return (
				<span className='inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'>
					<span className='size-1.5 rounded-full bg-blue-600 dark:bg-blue-400'></span>
					Partially Paid
				</span>
			);
		}
		return (
			<span className='inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'>
				<span className='size-1.5 rounded-full bg-amber-600 dark:bg-amber-400'></span>
				Pending
			</span>
		);
	};

	return (
		<div className='space-y-6 sm:space-y-8'>
			{/* Top Header & Quick Actions */}
			<div className='flex flex-col justify-between gap-4 border-b border-stroke pb-6 dark:border-stroke-dark sm:flex-row sm:items-center'>
				<div>
					<div className='flex flex-wrap items-center gap-2.5'>
						<h1 className='font-satoshi text-2xl font-bold tracking-tight text-dark dark:text-white sm:text-3xl'>
							Rent & Dues Ledger
						</h1>
						<Badge variant='success' size='sm'>
							Phase F Live
						</Badge>
					</div>
					<p className='mt-1 text-xs text-body dark:text-gray-4 sm:text-sm'>
						Monthly billing obligations, cash/UPI collection recording, and
						verified digital rent receipts.
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-3'>
					<Button
						variant='primary'
						size='sm'
						onClick={() => {
							setGeneratePropertyId(selectedPropertyId);
							setIsGenerateModalOpen(true);
						}}
					>
						+ Generate Monthly Rent
					</Button>
				</div>
			</div>

			{/* Success / Error Banners */}
			{successBanner && (
				<div className='flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-xs font-medium text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 sm:text-sm'>
					<div className='flex items-center gap-2'>
						<span className='flex size-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white'>
							✓
						</span>
						<span>{successBanner}</span>
					</div>
					<button
						onClick={() => setSuccessBanner(null)}
						className='text-emerald-700 hover:text-emerald-900 dark:text-emerald-400'
					>
						✕
					</button>
				</div>
			)}

			{errorBanner && (
				<div className='flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-900 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200 sm:text-sm'>
					<div className='flex items-center gap-2'>
						<span className='flex size-5 items-center justify-center rounded-full bg-rose-600 text-xs font-bold text-white'>
							!
						</span>
						<span>{errorBanner}</span>
					</div>
					<button
						onClick={() => setErrorBanner(null)}
						className='text-rose-700 hover:text-rose-900 dark:text-rose-400'
					>
						✕
					</button>
				</div>
			)}

			{/* Billing Controls: Month Selector & Property Filter */}
			<div className='grid grid-cols-1 gap-4 rounded-2xl border border-stroke bg-white p-4 shadow-sm dark:border-stroke-dark dark:bg-[#071711] sm:grid-cols-12 sm:items-center'>
				{/* Month / Billing Period Selector */}
				<div className='flex items-center gap-2 sm:col-span-6 lg:col-span-5'>
					<button
						onClick={() => changePeriodBy(-1)}
						title='Previous Month'
						className='flex size-9 items-center justify-center rounded-xl border border-stroke bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-stroke-dark dark:bg-slate-800 dark:text-slate-200'
					>
						‹
					</button>

					<div className='flex-1 text-center sm:text-left'>
						<span className='block text-[10px] font-semibold uppercase tracking-wider text-slate-400'>
							Billing Period
						</span>
						<span className='font-satoshi text-base font-bold text-dark dark:text-white sm:text-lg'>
							{formatBillingPeriod(billingPeriod)}
						</span>
					</div>

					<button
						onClick={() => changePeriodBy(1)}
						title='Next Month'
						className='flex size-9 items-center justify-center rounded-xl border border-stroke bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-stroke-dark dark:bg-slate-800 dark:text-slate-200'
					>
						›
					</button>

					{billingPeriod !== getBillingPeriodString() && (
						<button
							onClick={() => setBillingPeriod(getBillingPeriodString())}
							className='rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
						>
							Current Month
						</button>
					)}
				</div>

				{/* Property Filter Dropdown */}
				<div className='sm:col-span-6 lg:col-span-4'>
					<label
						htmlFor='property-select'
						className='mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400'
					>
						Filter Property
					</label>
					<select
						id='property-select'
						value={selectedPropertyId}
						onChange={(e) => setSelectedPropertyId(e.target.value)}
						className='w-full rounded-xl border border-stroke bg-white px-3 py-2 text-xs font-medium text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
					>
						<option value='ALL'>All Properties ({properties.length})</option>
						{properties.map((p) => (
							<option key={p.id} value={p.id}>
								{p.name} ({p.city})
							</option>
						))}
					</select>
				</div>

				{/* Search Field */}
				<div className='sm:col-span-12 lg:col-span-3'>
					<label
						htmlFor='resident-search'
						className='mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-400'
					>
						Search Resident / Room
					</label>
					<div className='relative'>
						<input
							id='resident-search'
							type='text'
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder='Name, phone, room...'
							className='w-full rounded-xl border border-stroke bg-white py-2 pl-8 pr-3 text-xs text-dark placeholder-slate-400 focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
						/>
						<svg
							className='absolute left-2.5 top-2.5 size-3.5 text-slate-400'
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
				</div>
			</div>

			{/* KPI Summary Cards */}
			<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
				{/* Total Billed */}
				<Card>
					<CardContent className='p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Total Rent Billed
							</span>
							<span className='rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
								₹
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-2'>
							<span className='font-satoshi text-2xl font-bold text-dark dark:text-white'>
								{formatINR(stats.totalBilled)}
							</span>
						</div>
						<p className='mt-1 text-xs text-body dark:text-gray-4'>
							{stats.totalCharges} charge(s) in{" "}
							{formatBillingPeriod(billingPeriod)}
						</p>
					</CardContent>
				</Card>

				{/* Total Collected */}
				<Card>
					<CardContent className='p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Rent Collected
							</span>
							<span className='rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'>
								✓
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-2'>
							<span className='font-satoshi text-2xl font-bold text-emerald-700 dark:text-emerald-400'>
								{formatINR(stats.totalCollected)}
							</span>
						</div>
						<p className='mt-1 text-xs text-body dark:text-gray-4'>
							{stats.totalBilled > 0
								? `${Math.round((stats.totalCollected / stats.totalBilled) * 100)}% realization rate`
								: "0% collected"}
						</p>
					</CardContent>
				</Card>

				{/* Outstanding Dues */}
				<Card>
					<CardContent className='p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Outstanding Balance
							</span>
							<span className='rounded-full bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-950 dark:text-blue-400'>
								⏳
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-2'>
							<span className='font-satoshi text-2xl font-bold text-dark dark:text-white'>
								{formatINR(stats.totalOutstanding)}
							</span>
						</div>
						<p className='mt-1 text-xs text-body dark:text-gray-4'>
							{stats.counts.pending +
								stats.counts.partiallyPaid +
								stats.counts.overdue}{" "}
							pending / partial bills
						</p>
					</CardContent>
				</Card>

				{/* Overdue Balance */}
				<Card>
					<CardContent className='p-5'>
						<div className='flex items-center justify-between'>
							<span className='text-xs font-medium text-body dark:text-gray-4'>
								Overdue Dues
							</span>
							<span className='rounded-full bg-rose-500/10 p-2 text-rose-600 dark:bg-rose-950 dark:text-rose-400'>
								⚠️
							</span>
						</div>
						<div className='mt-2 flex items-baseline gap-2'>
							<span
								className={`font-satoshi text-2xl font-bold ${
									stats.totalOverdue > 0
										? "text-rose-600 dark:text-rose-400"
										: "text-dark dark:text-white"
								}`}
							>
								{formatINR(stats.totalOverdue)}
							</span>
						</div>
						<p className='mt-1 text-xs text-body dark:text-gray-4'>
							{stats.counts.overdue} overdue resident obligation(s)
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Filter Tabs */}
			<div className='flex flex-wrap items-center gap-2 border-b border-stroke pb-3 dark:border-stroke-dark'>
				{[
					{ key: "ALL", label: "All Bills", count: stats.counts.all },
					{ key: "PENDING", label: "Pending", count: stats.counts.pending },
					{
						key: "PARTIALLY_PAID",
						label: "Partially Paid",
						count: stats.counts.partiallyPaid,
					},
					{ key: "PAID", label: "Settled / Paid", count: stats.counts.paid },
					{ key: "OVERDUE", label: "Overdue", count: stats.counts.overdue },
				].map((tab) => (
					<button
						key={tab.key}
						onClick={() => setActiveTab(tab.key as any)}
						className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
							activeTab === tab.key
								? "bg-[#1A382B] text-white shadow-sm dark:bg-emerald-600"
								: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
						}`}
					>
						<span>{tab.label}</span>
						<span
							className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
								activeTab === tab.key
									? "bg-white/20 text-white"
									: "bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-300"
							}`}
						>
							{tab.count}
						</span>
					</button>
				))}
			</div>

			{/* Rent Charges Ledger Table */}
			<div className='rounded-2xl border border-stroke bg-white shadow-sm dark:border-stroke-dark dark:bg-[#071711]'>
				{isLoading ? (
					<div className='p-12 text-center'>
						<div className='mx-auto size-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent'></div>
						<p className='mt-3 text-xs text-slate-500 dark:text-slate-400'>
							Loading rent ledger records...
						</p>
					</div>
				) : filteredCharges.length === 0 ? (
					<div className='p-12 text-center'>
						<div className='mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'>
							₹
						</div>
						<h3 className='mt-3 font-satoshi text-base font-bold text-dark dark:text-white'>
							No Rent Charges Found
						</h3>
						<p className='mx-auto mt-1 max-w-md text-xs text-body dark:text-gray-4'>
							{charges.length === 0
								? `No monthly rent charges have been generated for ${formatBillingPeriod(billingPeriod)} yet. Click "+ Generate Monthly Rent" to generate charges for active residents.`
								: `No records match the current filter "${activeTab}".`}
						</p>
						{charges.length === 0 && (
							<div className='mt-4'>
								<Button
									variant='primary'
									size='sm'
									onClick={() => {
										setGeneratePropertyId(selectedPropertyId);
										setIsGenerateModalOpen(true);
									}}
								>
									+ Generate Monthly Rent for{" "}
									{formatBillingPeriod(billingPeriod)}
								</Button>
							</div>
						)}
					</div>
				) : (
					<div className='overflow-x-auto'>
						<table className='w-full text-left text-xs'>
							<thead className='border-b border-stroke bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-slate-400'>
								<tr>
									<th className='whitespace-nowrap px-4 py-3.5'>
										Resident / Bed
									</th>
									<th className='whitespace-nowrap px-4 py-3.5'>Property</th>
									<th className='whitespace-nowrap px-4 py-3.5'>
										Billing Period
									</th>
									<th className='whitespace-nowrap px-4 py-3.5 text-right'>
										Total Rent
									</th>
									<th className='whitespace-nowrap px-4 py-3.5 text-right'>
										Paid So Far
									</th>
									<th className='whitespace-nowrap px-4 py-3.5 text-right'>
										Remaining Due
									</th>
									<th className='whitespace-nowrap px-4 py-3.5 text-center'>
										Status
									</th>
									<th className='whitespace-nowrap px-4 py-3.5 text-right'>
										Actions
									</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-stroke dark:divide-stroke-dark'>
								{filteredCharges.map((charge) => {
									const isSettled = charge.summary.isFullyPaid;
									const dueDateStr = new Date(
										charge.dueDate
									).toLocaleDateString("en-IN", {
										day: "numeric",
										month: "short",
										year: "numeric",
									});

									return (
										<tr
											key={charge.id}
											className='hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
										>
											{/* Resident & Room */}
											<td className='whitespace-nowrap px-4 py-3.5'>
												<div className='font-bold text-dark dark:text-white'>
													{charge.resident?.name || "Resident"}
												</div>
												<div className='text-[11px] text-body dark:text-gray-4'>
													📞 {formatIndianMobile(charge.resident?.phone)}
												</div>
												<div className='mt-0.5 text-[10px] text-slate-500 dark:text-slate-400'>
													Room {charge.resident?.room?.roomNumber || "N/A"} •
													Bed {charge.resident?.bed?.bedNumber || "N/A"}
												</div>
											</td>

											{/* Property */}
											<td className='whitespace-nowrap px-4 py-3.5'>
												<div className='font-medium text-dark dark:text-white'>
													{charge.property.name}
												</div>
												<div className='text-[11px] text-slate-500 dark:text-slate-400'>
													{charge.property.city}
												</div>
											</td>

											{/* Billing Period & Due Date */}
											<td className='whitespace-nowrap px-4 py-3.5'>
												<div className='font-medium text-dark dark:text-white'>
													{formatBillingPeriod(charge.billingPeriod)}
												</div>
												<div className='text-[11px] text-slate-500 dark:text-slate-400'>
													Due: {dueDateStr}
												</div>
											</td>

											{/* Charge Amount */}
											<td className='whitespace-nowrap px-4 py-3.5 text-right font-medium text-dark dark:text-white'>
												{formatINR(charge.amount)}
											</td>

											{/* Paid So Far */}
											<td className='whitespace-nowrap px-4 py-3.5 text-right font-medium text-emerald-700 dark:text-emerald-400'>
												{formatINR(charge.summary.totalPaid)}
											</td>

											{/* Remaining Due */}
											<td className='whitespace-nowrap px-4 py-3.5 text-right font-bold'>
												<span
													className={
														charge.summary.remainingBalance > 0
															? "text-rose-600 dark:text-rose-400"
															: "text-slate-400"
													}
												>
													{formatINR(charge.summary.remainingBalance)}
												</span>
											</td>

											{/* Status */}
											<td className='whitespace-nowrap px-4 py-3.5 text-center'>
												{renderStatusBadge(charge)}
											</td>

											{/* Actions */}
											<td className='whitespace-nowrap px-4 py-3.5 text-right'>
												<div className='flex items-center justify-end gap-2'>
													{!isSettled && (
														<button
															onClick={() => openRecordPaymentModal(charge)}
															className='rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700'
														>
															Record Payment
														</button>
													)}

													{charge.payments && charge.payments.length > 0 && (
														<button
															onClick={() => setHistoryCharge(charge)}
															className='rounded-lg border border-stroke bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-stroke-dark dark:bg-slate-800 dark:text-slate-300'
															title='View Payment History & Receipts'
														>
															Receipts ({charge.payments.length})
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
				)}
			</div>

			{/* ================= MODAL: GENERATE MONTHLY RENT ================= */}
			{isGenerateModalOpen &&
				createPortal(
					<div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
						<div className='w-full max-w-lg rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-stroke-dark dark:bg-[#071711] sm:p-7'>
							<div className='flex items-start justify-between'>
								<div>
									<h3 className='font-satoshi text-lg font-bold text-dark dark:text-white'>
										Generate Monthly Rent Charges
									</h3>
									<p className='mt-1 text-xs text-body dark:text-gray-4'>
										Safely create rent obligations for active residents for{" "}
										<span className='font-semibold text-emerald-800 dark:text-emerald-400'>
											{formatBillingPeriod(billingPeriod)}
										</span>
										.
									</p>
								</div>
								<button
									onClick={() => setIsGenerateModalOpen(false)}
									className='text-slate-400 hover:text-slate-600'
								>
									✕
								</button>
							</div>

							{generateMessage && (
								<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200'>
									{generateMessage}
								</div>
							)}

							<div className='mt-5 space-y-4 text-xs'>
								<div>
									<label className='mb-1 block font-semibold text-dark dark:text-white'>
										Target Property
									</label>
									<select
										value={generatePropertyId}
										onChange={(e) => setGeneratePropertyId(e.target.value)}
										className='w-full rounded-xl border border-stroke bg-white p-2.5 text-xs text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
									>
										<option value='ALL'>All Registered Properties</option>
										{properties.map((p) => (
											<option key={p.id} value={p.id}>
												{p.name} ({p.city})
											</option>
										))}
									</select>
								</div>

								<div>
									<label className='mb-1 block font-semibold text-dark dark:text-white'>
										Monthly Rent Due Day (1st - 28th)
									</label>
									<input
										type='number'
										min={1}
										max={28}
										value={generateDueDay}
										onChange={(e) => setGenerateDueDay(Number(e.target.value))}
										className='w-full rounded-xl border border-stroke bg-white p-2.5 text-xs text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
									/>
									<p className='mt-1 text-[11px] text-slate-500 dark:text-slate-400'>
										Default is the 5th of the month.
									</p>
								</div>

								<div className='rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'>
									<div className='font-bold'>
										🛡️ Idempotent Duplicate Protection:
									</div>
									<p className='mt-1 text-[11px] leading-relaxed'>
										ChooseBed strictly prevents duplicate rent charges. If any
										resident already has a charge generated for{" "}
										{formatBillingPeriod(billingPeriod)}, their record is safely
										skipped.
									</p>
								</div>
							</div>

							<div className='mt-6 flex items-center justify-end gap-3'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setIsGenerateModalOpen(false)}
									disabled={isGenerating}
								>
									Cancel
								</Button>
								<Button
									variant='primary'
									size='sm'
									onClick={handleGenerateRent}
									disabled={isGenerating}
								>
									{isGenerating ? "Generating..." : "Generate Charges"}
								</Button>
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* ================= MODAL: RECORD PAYMENT ================= */}
			{selectedChargeForPayment &&
				createPortal(
					<div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
						<div className='w-full max-w-lg rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-stroke-dark dark:bg-[#071711] sm:p-7'>
							<div className='flex items-start justify-between'>
								<div>
									<h3 className='font-satoshi text-lg font-bold text-dark dark:text-white'>
										Record Rent Payment
									</h3>
									<p className='mt-0.5 text-xs text-body dark:text-gray-4'>
										{selectedChargeForPayment.resident?.name} • Room{" "}
										{selectedChargeForPayment.resident?.room?.roomNumber} •{" "}
										{formatBillingPeriod(
											selectedChargeForPayment.billingPeriod
										)}
									</p>
								</div>
								<button
									onClick={() => setSelectedChargeForPayment(null)}
									className='text-slate-400 hover:text-slate-600'
								>
									✕
								</button>
							</div>

							{paymentModalError && (
								<div className='mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200'>
									{paymentModalError}
								</div>
							)}

							{/* Summary Ledger Card */}
							<div className='mt-4 grid grid-cols-3 gap-2 rounded-xl border border-stroke bg-slate-50 p-3 text-center text-xs dark:border-stroke-dark dark:bg-[#0A1F17]'>
								<div>
									<span className='block text-[10px] uppercase text-slate-400'>
										Total Rent
									</span>
									<span className='font-bold text-dark dark:text-white'>
										{formatINR(selectedChargeForPayment.amount)}
									</span>
								</div>
								<div>
									<span className='block text-[10px] uppercase text-slate-400'>
										Already Paid
									</span>
									<span className='font-bold text-emerald-700 dark:text-emerald-400'>
										{formatINR(selectedChargeForPayment.summary.totalPaid)}
									</span>
								</div>
								<div>
									<span className='block text-[10px] uppercase text-slate-400'>
										Balance Due
									</span>
									<span className='font-bold text-rose-600 dark:text-rose-400'>
										{formatINR(
											selectedChargeForPayment.summary.remainingBalance
										)}
									</span>
								</div>
							</div>

							<form
								onSubmit={handleSubmitPayment}
								className='mt-4 space-y-4 text-xs'
							>
								<div>
									<div className='flex items-center justify-between'>
										<label className='font-semibold text-dark dark:text-white'>
											Amount Received (₹ INR) *
										</label>
										<div className='flex gap-1.5'>
											<button
												type='button'
												onClick={() =>
													setPaymentAmount(
														String(
															selectedChargeForPayment.summary.remainingBalance
														)
													)
												}
												className='rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
											>
												Full (₹
												{selectedChargeForPayment.summary.remainingBalance})
											</button>
											{selectedChargeForPayment.summary.remainingBalance >
												1000 && (
												<button
													type='button'
													onClick={() =>
														setPaymentAmount(
															String(
																Math.round(
																	selectedChargeForPayment.summary
																		.remainingBalance / 2
																)
															)
														)
													}
													className='rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300'
												>
													50%
												</button>
											)}
										</div>
									</div>
									<input
										type='number'
										required
										min={1}
										max={selectedChargeForPayment.summary.remainingBalance}
										value={paymentAmount}
										onChange={(e) => setPaymentAmount(e.target.value)}
										className='mt-1 w-full rounded-xl border border-stroke bg-white p-2.5 text-base font-bold text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
									/>
								</div>

								{/* Payment Mode Selector */}
								<div>
									<label className='mb-1 block font-semibold text-dark dark:text-white'>
										Payment Mode *
									</label>
									<div className='grid grid-cols-3 gap-2'>
										{[
											{ id: "UPI", label: "UPI", icon: "📱" },
											{ id: "CASH", label: "Cash", icon: "💵" },
											{
												id: "BANK_TRANSFER",
												label: "Bank Transfer",
												icon: "🏦",
											},
										].map((mode) => (
											<button
												key={mode.id}
												type='button'
												onClick={() => setPaymentMode(mode.id as any)}
												className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition ${
													paymentMode === mode.id
														? "border-emerald-600 bg-emerald-50/60 font-bold text-emerald-900 dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-200"
														: "border-stroke bg-white text-slate-600 hover:bg-slate-50 dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-slate-300"
												}`}
											>
												<span className='text-sm'>{mode.icon}</span>
												<span className='mt-1 text-[11px]'>{mode.label}</span>
											</button>
										))}
									</div>
								</div>

								{/* Payment Date & Reference */}
								<div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
									<div>
										<label className='mb-1 block font-semibold text-dark dark:text-white'>
											Payment Date *
										</label>
										<input
											type='date'
											required
											value={paymentDate}
											onChange={(e) => setPaymentDate(e.target.value)}
											className='w-full rounded-xl border border-stroke bg-white p-2.5 text-xs text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
										/>
									</div>

									<div>
										<label className='mb-1 block font-semibold text-dark dark:text-white'>
											Transaction / Ref #{" "}
											{paymentMode !== "CASH" && "(Optional)"}
										</label>
										<input
											type='text'
											placeholder={
												paymentMode === "UPI"
													? "e.g. UPI Ref / UTR"
													: paymentMode === "BANK_TRANSFER"
														? "e.g. IMPS / NEFT ref"
														: "Cash receipt note"
											}
											value={referenceNumber}
											onChange={(e) => setReferenceNumber(e.target.value)}
											className='w-full rounded-xl border border-stroke bg-white p-2.5 text-xs text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
										/>
									</div>
								</div>

								<div>
									<label className='mb-1 block font-semibold text-dark dark:text-white'>
										Notes (Optional)
									</label>
									<textarea
										rows={2}
										placeholder='Internal notes or remarks...'
										value={paymentNotes}
										onChange={(e) => setPaymentNotes(e.target.value)}
										className='w-full rounded-xl border border-stroke bg-white p-2.5 text-xs text-dark focus:border-primary focus:outline-none dark:border-stroke-dark dark:bg-[#0A1F17] dark:text-white'
									/>
								</div>

								<div className='mt-5 flex items-center justify-end gap-3'>
									<Button
										type='button'
										variant='outline'
										size='sm'
										onClick={() => setSelectedChargeForPayment(null)}
										disabled={isSubmittingPayment}
									>
										Cancel
									</Button>
									<Button
										type='submit'
										variant='primary'
										size='sm'
										disabled={isSubmittingPayment}
									>
										{isSubmittingPayment
											? "Recording..."
											: "Record Payment & Issue Receipt"}
									</Button>
								</div>
							</form>
						</div>
					</div>,
					document.body
				)}

			{/* ================= MODAL: PRINTABLE RECEIPT ================= */}
			{activeReceipt &&
				createPortal(
					<div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:m-0 print:bg-white print:p-0'>
						<div className='relative w-full max-w-xl rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-stroke-dark dark:bg-[#071711] sm:p-8 print:border-none print:p-2 print:shadow-none'>
							{/* Printable Header */}
							<div className='flex items-start justify-between border-b border-stroke pb-5 dark:border-stroke-dark'>
								<div>
									<div className='flex items-center gap-2'>
										<span className='font-satoshi text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-400'>
											ChooseBed.com
										</span>
										<span className='rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
											Rent Receipt
										</span>
									</div>
									<h2 className='mt-1 font-satoshi text-base font-bold text-dark dark:text-white'>
										{activeReceipt.charge.property.name}
									</h2>
									<p className='text-xs text-slate-500 dark:text-slate-400'>
										{activeReceipt.charge.property.address},{" "}
										{activeReceipt.charge.property.area},{" "}
										{activeReceipt.charge.property.city}
									</p>
								</div>

								<div className='text-right'>
									<span className='block text-[10px] uppercase tracking-wider text-slate-400'>
										Receipt Number
									</span>
									<span className='font-mono text-xs font-bold text-dark dark:text-white sm:text-sm'>
										{activeReceipt.payment.receiptNumber}
									</span>
									<span className='mt-1 block text-[10px] text-slate-500 dark:text-slate-400'>
										Date:{" "}
										{new Date(
											activeReceipt.payment.paymentDate
										).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</span>
								</div>
							</div>

							{/* Resident & Room Details */}
							<div className='mt-5 grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs dark:border-slate-800 dark:bg-[#0A1F17]'>
								<div>
									<span className='block text-[10px] uppercase tracking-wider text-slate-400'>
										Resident Name
									</span>
									<span className='font-bold text-dark dark:text-white'>
										{activeReceipt.charge.resident?.name}
									</span>
									<span className='block text-slate-500 dark:text-slate-400'>
										📞{" "}
										{formatIndianMobile(activeReceipt.charge.resident?.phone)}
									</span>
								</div>

								<div>
									<span className='block text-[10px] uppercase tracking-wider text-slate-400'>
										Allotment Details
									</span>
									<span className='font-bold text-dark dark:text-white'>
										Room{" "}
										{activeReceipt.charge.resident?.room?.roomNumber || "N/A"} •
										Bed {activeReceipt.charge.resident?.bed?.bedNumber || "N/A"}
									</span>
									<span className='block text-slate-500 dark:text-slate-400'>
										Month:{" "}
										{formatBillingPeriod(activeReceipt.charge.billingPeriod)}
									</span>
								</div>
							</div>

							{/* Financial Breakdown Table */}
							<div className='mt-5'>
								<table className='w-full text-left text-xs'>
									<thead className='border-b border-stroke text-[11px] font-semibold uppercase text-slate-400 dark:border-stroke-dark'>
										<tr>
											<th className='py-2'>Description</th>
											<th className='py-2 text-right'>Amount (INR)</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-stroke dark:divide-stroke-dark'>
										<tr>
											<td className='py-2.5'>
												Monthly Rent (
												{formatBillingPeriod(
													activeReceipt.charge.billingPeriod
												)}
												)
											</td>
											<td className='py-2.5 text-right font-medium text-dark dark:text-white'>
												{formatINR(activeReceipt.charge.amount)}
											</td>
										</tr>
										<tr className='bg-emerald-50/50 font-bold dark:bg-emerald-950/20'>
											<td className='py-2.5 text-emerald-900 dark:text-emerald-300'>
												Amount Received (Paid via{" "}
												{activeReceipt.payment.paymentMode}
												{activeReceipt.payment.referenceNumber
													? ` • Ref: ${activeReceipt.payment.referenceNumber}`
													: ""}
												)
											</td>
											<td className='py-2.5 text-right text-emerald-700 dark:text-emerald-400'>
												{formatINR(activeReceipt.payment.amount)}
											</td>
										</tr>
										<tr>
											<td className='py-2.5 font-semibold text-slate-700 dark:text-slate-300'>
												Remaining Outstanding Due
											</td>
											<td className='py-2.5 text-right font-bold text-rose-600 dark:text-rose-400'>
												{formatINR(
													activeReceipt.charge.summary.remainingBalance
												)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							{/* Status Stamp & Verification Note */}
							<div className='mt-5 flex items-center justify-between border-t border-stroke pt-4 dark:border-stroke-dark'>
								<div>
									<div className='text-[10px] uppercase tracking-wider text-slate-400'>
										Recorded By
									</div>
									<div className='text-xs font-semibold text-dark dark:text-white'>
										{currentUser.name} (Property Owner)
									</div>
									<div className='text-[10px] text-slate-400'>
										{currentUser.email}
									</div>
								</div>

								<div className='text-right'>
									{activeReceipt.charge.summary.remainingBalance === 0 ? (
										<span className='inline-block rounded-lg border border-emerald-400 bg-emerald-50 px-3 py-1 font-satoshi text-xs font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
											✓ Settled in Full
										</span>
									) : (
										<span className='inline-block rounded-lg border border-blue-400 bg-blue-50 px-3 py-1 font-satoshi text-xs font-bold uppercase tracking-wider text-blue-800 dark:bg-blue-950 dark:text-blue-300'>
											Partially Paid Receipt
										</span>
									)}
								</div>
							</div>

							{/* Modal Footer Controls (Hidden on Print) */}
							<div className='mt-6 flex items-center justify-end gap-3 print:hidden'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setActiveReceipt(null)}
								>
									Close
								</Button>
								<Button
									variant='primary'
									size='sm'
									onClick={() => window.print()}
								>
									🖨️ Print Receipt
								</Button>
							</div>
						</div>
					</div>,
					document.body
				)}

			{/* ================= MODAL: PAYMENT HISTORY ================= */}
			{historyCharge &&
				createPortal(
					<div className='fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'>
						<div className='w-full max-w-2xl rounded-2xl border border-stroke bg-white p-6 shadow-2xl dark:border-stroke-dark dark:bg-[#071711] sm:p-7'>
							<div className='flex items-start justify-between border-b border-stroke pb-4 dark:border-stroke-dark'>
								<div>
									<h3 className='font-satoshi text-lg font-bold text-dark dark:text-white'>
										Payment Receipts & History
									</h3>
									<p className='mt-0.5 text-xs text-body dark:text-gray-4'>
										{historyCharge.resident?.name} • Room{" "}
										{historyCharge.resident?.room?.roomNumber} •{" "}
										{formatBillingPeriod(historyCharge.billingPeriod)}
									</p>
								</div>
								<button
									onClick={() => setHistoryCharge(null)}
									className='text-slate-400 hover:text-slate-600'
								>
									✕
								</button>
							</div>

							<div className='mt-4 max-h-[60vh] space-y-3 overflow-y-auto text-xs'>
								{historyCharge.payments.length === 0 ? (
									<p className='py-6 text-center text-slate-500'>
										No payment records found for this charge.
									</p>
								) : (
									historyCharge.payments.map((p) => {
										const isVoided = p.amount === 0;
										return (
											<div
												key={p.id}
												className={`flex flex-col justify-between gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center ${
													isVoided
														? "border-rose-200 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20"
														: "border-stroke bg-slate-50/50 dark:border-stroke-dark dark:bg-[#0A1F17]"
												}`}
											>
												<div>
													<div className='flex items-center gap-2'>
														<span className='font-mono font-bold text-dark dark:text-white'>
															{p.receiptNumber}
														</span>
														<Badge
															variant={isVoided ? "neutral" : "success"}
															size='sm'
														>
															{p.paymentMode}
														</Badge>
														{isVoided && (
															<span className='text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400'>
																[Voided]
															</span>
														)}
													</div>
													<div className='mt-1 text-[11px] text-slate-500 dark:text-slate-400'>
														Date:{" "}
														{new Date(p.paymentDate).toLocaleDateString(
															"en-IN",
															{
																day: "numeric",
																month: "short",
																year: "numeric",
															}
														)}
														{p.referenceNumber &&
															` • Ref: ${p.referenceNumber}`}
														{p.recordedBy?.name &&
															` • Verified by: ${p.recordedBy.name}`}
													</div>
													{p.notes && (
														<div className='font-mono mt-1 whitespace-pre-wrap text-[10px] text-slate-400'>
															{p.notes}
														</div>
													)}
												</div>

												<div className='flex items-center justify-between gap-3 sm:justify-end'>
													<span
														className={`font-satoshi text-base font-bold ${
															isVoided
																? "text-slate-400 line-through"
																: "text-emerald-700 dark:text-emerald-400"
														}`}
													>
														{formatINR(p.amount)}
													</span>

													<div className='flex items-center gap-2'>
														{!isVoided && (
															<>
																<button
																	onClick={() => {
																		setActiveReceipt({
																			payment: p,
																			charge: historyCharge,
																		});
																	}}
																	className='rounded-lg border border-stroke bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-stroke-dark dark:bg-[#071711] dark:text-slate-200'
																>
																	Receipt
																</button>
																<button
																	onClick={() => handleVoidPayment(p.id)}
																	disabled={isVoidingId === p.id}
																	className='rounded-lg text-[11px] text-rose-600 hover:underline dark:text-rose-400'
																	title='Void entry in case of error'
																>
																	{isVoidingId === p.id ? "Voiding..." : "Void"}
																</button>
															</>
														)}
													</div>
												</div>
											</div>
										);
									})
								)}
							</div>

							<div className='mt-6 flex justify-end'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => setHistoryCharge(null)}
								>
									Close
								</Button>
							</div>
						</div>
					</div>,
					document.body
				)}
		</div>
	);
}
