import { Badge, Button, Card, CardContent } from "@/components/Common/UI";
import { getAuthSession } from "@/libs/auth";
import { formatIndianMobile, formatINR } from "@/libs/formatters";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Owner Dashboard",
	description: "Operations dashboard for Choose Ghar PG and hostel owners.",
};

export const dynamic = "force-dynamic";

export default async function OwnerDashboardPage() {
	// 1. Authoritative session verification
	const session = await getAuthSession();
	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	// 2. Strict Role Segregation: Admins belong exclusively in /admin
	if (session.user.role === "ADMIN") {
		redirect("/admin");
	}

	// 3. Query authoritative user and properties from database
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			name: true,
			email: true,
			phone: true,
			role: true,
			status: true,
			setupCompleted: true,
			properties: {
				orderBy: { createdAt: "desc" },
			},
		},
	});

	if (!dbUser) {
		redirect("/auth/signin");
	}

	if (dbUser.status === "SUSPENDED") {
		redirect("/auth/signin?error=AccountSuspended");
	}

	// 4. Incomplete setup guard: If setup is pending or no property exists, force to /user/setup
	if (!dbUser.setupCompleted || dbUser.properties.length === 0) {
		redirect("/user/setup");
	}

	const activeProperty = dbUser.properties[0];
	const totalProperties = dbUser.properties.length;

	const formatPropertyType = (t: string) => {
		const typeLabels: Record<string, string> = {
			PG: "PG",
			HOSTEL: "Hostel",
			BOTH: "Both PG & Hostel",
		};
		return typeLabels[t] || "Both PG & Hostel";
	};

	const formatGender = (g: string) => {
		const genderLabels: Record<string, string> = {
			BOYS: "Boys PG/Hostel",
			GIRLS: "Girls PG/Hostel",
			COED: "Co-ed PG/Hostel",
		};
		return genderLabels[g] || "Co-ed PG/Hostel";
	};

	return (
		<div className='space-y-6 sm:space-y-8'>
			{/* Top Header & Property Context */}
			<div className='flex flex-col justify-between gap-4 border-b border-stroke pb-6 dark:border-stroke-dark sm:flex-row sm:items-center'>
				<div>
					<div className='flex flex-wrap items-center gap-2.5'>
						<h1 className='font-satoshi text-2xl font-bold tracking-tight text-dark dark:text-white sm:text-3xl'>
							{activeProperty.name}
						</h1>
						<Badge variant='success' size='sm'>
							Active PG/Hostel
						</Badge>
						<Badge variant='neutral' size='sm'>
							{formatPropertyType(activeProperty.type)}
						</Badge>
						<Badge variant='neutral' size='sm'>
							{formatGender(activeProperty.gender)}
						</Badge>
					</div>
					<p className='mt-1 text-xs text-body dark:text-gray-4 sm:text-sm'>
						📍 {activeProperty.address}, {activeProperty.area},{" "}
						{activeProperty.city}
					</p>
				</div>

				<div className='flex flex-wrap items-center gap-3'>
					<Link href='/user/account-settings'>
						<Button variant='outline' size='sm'>
							Account Settings
						</Button>
					</Link>
					<Button
						variant='primary'
						size='sm'
						disabled
						title='Additional property additions will be operational in Phase E'
					>
						+ Add Another PG/Hostel (Phase E)
					</Button>
				</div>
			</div>

			{/* Operational Metrics Cards (Real Data Grounded) */}
			<div>
				<div className='mb-3 flex items-center justify-between'>
					<h2 className='text-xs font-semibold uppercase tracking-wider text-body dark:text-gray-4'>
						Key Operational Metrics
					</h2>
					<span className='text-xs font-medium text-slate-500 dark:text-slate-400'>
						Live Property Data
					</span>
				</div>

				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					{/* Total Properties */}
					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Total PG/Hostel Properties
								</span>
								<span className='rounded-full bg-primary/10 p-2 text-primary'>
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
											d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
										/>
									</svg>
								</span>
							</div>
							<div className='mt-2 flex items-baseline gap-2'>
								<span className='font-satoshi text-2xl font-bold text-dark dark:text-white'>
									{totalProperties}
								</span>
								<span className='text-xs text-body dark:text-gray-4'>
									Registered facility
								</span>
							</div>
							<p className='mt-2 text-xs text-emerald-700 dark:text-emerald-400'>
								Verified in {activeProperty.city}
							</p>
						</CardContent>
					</Card>

					{/* Total Rooms */}
					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Total Configured Rooms
								</span>
								<span className='rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
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
							<div className='mt-2 flex items-baseline gap-2'>
								<span className='font-satoshi text-2xl font-bold text-dark dark:text-white'>
									0
								</span>
								<span className='text-xs text-body dark:text-gray-4'>
									Rooms configured
								</span>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								Room layout setup in Phase E
							</p>
						</CardContent>
					</Card>

					{/* Bed Occupancy */}
					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Bed Occupancy
								</span>
								<span className='rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
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
							<div className='mt-2 flex items-baseline gap-2'>
								<span className='font-satoshi text-2xl font-bold text-dark dark:text-white'>
									0%
								</span>
								<span className='text-xs text-body dark:text-gray-4'>
									0 / 0 Beds occupied
								</span>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								Ready for room allocations
							</p>
						</CardContent>
					</Card>

					{/* Monthly Rent Collection */}
					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Monthly Rent Collections
								</span>
								<span className='rounded-full bg-amber-500/10 p-2 text-xs font-semibold text-amber-600'>
									₹
								</span>
							</div>
							<div className='mt-2 flex items-baseline gap-2'>
								<span className='font-satoshi text-2xl font-bold text-dark dark:text-white'>
									{formatINR(0)}
								</span>
								<span className='text-xs text-body dark:text-gray-4'>
									/ month
								</span>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								Rent ledger launches in Phase F
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Grid: Real Property Identity & Modules Empty States */}
			<div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
				{/* Left 2 Cols: Property Profile & Modules Empty State */}
				<div className='space-y-6 lg:col-span-2'>
					{/* Active Property Card */}
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-5 sm:p-6'>
							<div className='flex items-start justify-between'>
								<div>
									<span className='text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400'>
										Primary Facility Profile
									</span>
									<h3 className='mt-1 font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:text-xl'>
										{activeProperty.name}
									</h3>
									<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
										{activeProperty.address}, {activeProperty.area},{" "}
										{activeProperty.city}
									</p>
								</div>
								<span className='flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A382B] to-[#10B981] font-satoshi text-base font-bold text-white shadow-sm'>
									🏠
								</span>
							</div>

							<div className='mt-5 grid grid-cols-2 gap-3 border-t border-[#E8E3D8] pt-4 text-xs dark:border-[#1E382B] sm:grid-cols-4'>
								<div className='rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-[#0A1F17]'>
									<p className='text-[10px] uppercase text-slate-400'>
										Category
									</p>
									<p className='mt-0.5 font-bold text-slate-800 dark:text-slate-200'>
										{formatPropertyType(activeProperty.type)}
									</p>
								</div>
								<div className='rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-[#0A1F17]'>
									<p className='text-[10px] uppercase text-slate-400'>
										Resident Type
									</p>
									<p className='mt-0.5 font-bold text-slate-800 dark:text-slate-200'>
										{formatGender(activeProperty.gender)}
									</p>
								</div>
								<div className='rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-[#0A1F17]'>
									<p className='text-[10px] uppercase text-slate-400'>
										City / Area
									</p>
									<p className='mt-0.5 truncate font-bold text-slate-800 dark:text-slate-200'>
										{activeProperty.city}
									</p>
								</div>
								<div className='rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 dark:border-slate-800 dark:bg-[#0A1F17]'>
									<p className='text-[10px] uppercase text-slate-400'>
										Owner Mobile
									</p>
									<p className='mt-0.5 truncate font-bold text-slate-800 dark:text-slate-200'>
										{formatIndianMobile(dbUser.phone) || "Not provided"}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Rooms & Beds Inventory Empty State */}
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-6 text-center sm:p-8'>
							<div className='mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
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
										d='M4 6h16M4 10h16M4 14h16M4 18h16'
									/>
								</svg>
							</div>

							<h3 className='mt-4 font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
								No Rooms or Beds Configured Yet
							</h3>

							<p className='mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm'>
								Your PG/Hostel building is officially registered! Floor-wise
								room setup, single/double sharing allocations, and real-time bed
								inventories will be configured here in Phase E.
							</p>

							<div className='mt-5 flex items-center justify-center gap-2'>
								<span className='inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
									Phase E Roadmap • Room & Bed Layout Designer
								</span>
							</div>
						</CardContent>
					</Card>

					{/* Residents Management Empty State */}
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-6 text-center sm:p-8'>
							<div className='mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
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
										d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
									/>
								</svg>
							</div>

							<h3 className='mt-4 font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
								No Residents Checked In
							</h3>

							<p className='mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm'>
								Once your rooms and beds are created, you can onboard residents,
								collect Aadhaar / KYC documents, and monitor digital check-in
								records.
							</p>

							<div className='mt-5 flex items-center justify-center gap-2'>
								<span className='inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'>
									Phase E Roadmap • Resident Onboarding & KYC
								</span>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right 1 Col: Onboarding Roadmap Checklist */}
				<div className='space-y-6'>
					<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
						<CardContent className='p-5 sm:p-6'>
							<h3 className='font-satoshi text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
								PG/Hostel Setup Roadmap
							</h3>
							<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
								Your operational onboarding progress
							</p>

							<div className='mt-4 space-y-3.5'>
								{/* Step 1: Done */}
								<div className='flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/40'>
									<div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white'>
										✓
									</div>
									<div>
										<h4 className='text-xs font-bold text-emerald-950 dark:text-emerald-200'>
											Step 1: PG/Hostel Registered
										</h4>
										<p className='mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-300'>
											{activeProperty.name} is active in {activeProperty.city}.
										</p>
									</div>
								</div>

								{/* Step 2: Phase E */}
								<div className='flex items-start gap-3 rounded-xl border border-stroke p-3 dark:border-stroke-dark'>
									<div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
										2
									</div>
									<div>
										<h4 className='text-xs font-bold text-dark dark:text-white'>
											Step 2: Room & Bed Layouts (Phase E)
										</h4>
										<p className='mt-0.5 text-[11px] text-body dark:text-gray-4'>
											Add floors, 1/2/3 sharing rooms, and bed counts.
										</p>
									</div>
								</div>

								{/* Step 3: Phase E */}
								<div className='flex items-start gap-3 rounded-xl border border-stroke p-3 dark:border-stroke-dark'>
									<div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
										3
									</div>
									<div>
										<h4 className='text-xs font-bold text-dark dark:text-white'>
											Step 3: Resident Check-In & KYC (Phase E)
										</h4>
										<p className='mt-0.5 text-[11px] text-body dark:text-gray-4'>
											Aadhaar verification, guardian details, and allotments.
										</p>
									</div>
								</div>

								{/* Step 4: Phase F */}
								<div className='flex items-start gap-3 rounded-xl border border-stroke p-3 dark:border-stroke-dark'>
									<div className='flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300'>
										4
									</div>
									<div>
										<h4 className='text-xs font-bold text-dark dark:text-white'>
											Step 4: Automated Rent & Dues (Phase F)
										</h4>
										<p className='mt-0.5 text-[11px] text-body dark:text-gray-4'>
											UPI payment links, monthly dues, and PDF receipts.
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Information Card */}
					<div className='rounded-xl border border-[#E8E3D8] bg-[#F4EFEA]/60 p-5 dark:border-[#1E3A2F] dark:bg-[#071711]'>
						<div className='flex items-start gap-3'>
							<span className='text-base'>🇮🇳</span>
							<div>
								<h4 className='text-xs font-bold text-slate-900 dark:text-white'>
									Choose Ghar Support
								</h4>
								<p className='mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400'>
									Need help configuring your property or managing multiple
									PG/Hostel branches? Contact our team anytime from the Support
									section.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
