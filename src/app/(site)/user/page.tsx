import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/Common/UI";
import { getAuthSession } from "@/libs/auth";
import { formatINR } from "@/libs/formatters";
import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
	title: "Owner Dashboard",
	description: "Operations dashboard for Indian PG and hostel owners.",
};

export default async function OwnerDashboardPage() {
	const session = await getAuthSession();
	if (session?.user?.role === "ADMIN") {
		redirect("/admin");
	}

	return (
		<div className='space-y-8'>
			{/* Top Header & Context */}
			<div className='flex flex-col justify-between gap-4 border-b border-stroke pb-6 dark:border-stroke-dark sm:flex-row sm:items-center'>
				<div>
					<div className='flex items-center gap-2.5'>
						<h1 className='text-2xl font-bold tracking-tight text-dark dark:text-white sm:text-3xl'>
							Operations Dashboard
						</h1>
						<Badge variant='neutral' size='sm'>
							Phase C Design System
						</Badge>
					</div>
					<p className='mt-1 text-sm text-body dark:text-gray-4'>
						Overview of property occupancy, rooms, resident verification, and
						operational workflow.
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
						onClick={undefined}
						title='Property creation will be operational in Phase E'
					>
						+ Add Property (Phase E)
					</Button>
				</div>
			</div>

			{/* Operational Metrics Cards (India-First & Explicitly Illustrative) */}
			<div>
				<div className='mb-3 flex items-center justify-between'>
					<h2 className='text-xs font-semibold uppercase tracking-wider text-body dark:text-gray-4'>
						Key Operational Metrics
					</h2>
					<span className='rounded border border-emerald-200/50 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300'>
						Illustrative preview • Live CRUD in Phase E
					</span>
				</div>

				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Total Properties
								</span>
								<span className='rounded-full bg-primary/10 p-2 text-primary'>
									<svg
										className='h-4 w-4'
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
							<div className='mt-2'>
								<span className='text-2xl font-bold text-dark dark:text-white'>
									1
								</span>
								<span className='ml-2 text-xs text-body dark:text-gray-4'>
									Active facility
								</span>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								Sample property configured
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Total Bed Capacity
								</span>
								<span className='rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400'>
									<svg
										className='h-4 w-4'
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
							<div className='mt-2'>
								<span className='text-2xl font-bold text-dark dark:text-white'>
									36
								</span>
								<span className='ml-2 text-xs text-body dark:text-gray-4'>
									Beds across 14 rooms
								</span>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								Single, Double & Triple sharing
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Current Occupancy
								</span>
								<span className='rounded-full bg-emerald-500/10 p-2 text-emerald-600'>
									<svg
										className='h-4 w-4'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											strokeWidth='2'
											d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
										/>
									</svg>
								</span>
							</div>
							<div className='mt-2 flex items-baseline gap-2'>
								<span className='text-2xl font-bold text-dark dark:text-white'>
									78%
								</span>
								<Badge variant='occupied' size='sm'>
									28 / 36 Beds
								</Badge>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								8 beds available for check-in
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className='p-5'>
							<div className='flex items-center justify-between'>
								<span className='text-xs font-medium text-body dark:text-gray-4'>
									Monthly Rent Target
								</span>
								<span className='rounded-full bg-amber-500/10 p-2 text-xs font-semibold text-amber-600'>
									₹
								</span>
							</div>
							<div className='mt-2'>
								<span className='text-2xl font-bold text-dark dark:text-white'>
									{formatINR(195000)}
								</span>
								<span className='ml-2 text-xs text-body dark:text-gray-4'>
									/ month
								</span>
							</div>
							<p className='mt-2 text-xs text-body dark:text-gray-4'>
								Expected monthly collections
							</p>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Main Grid: Onboarding Checklist & Room Matrix Preview */}
			<div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
				{/* Left 2 Cols: Room Matrix / Inventory Preview */}
				<div className='space-y-6 lg:col-span-2'>
					<Card>
						<CardHeader className='border-b border-stroke pb-4 dark:border-stroke-dark'>
							<div className='flex flex-wrap items-center justify-between gap-2'>
								<div>
									<CardTitle>Room Inventory & Occupancy Status</CardTitle>
									<CardDescription>
										Floor-wise room allocations and bed availability
									</CardDescription>
								</div>
								<div className='flex items-center gap-2'>
									<Badge variant='available' size='sm'>
										Available
									</Badge>
									<Badge variant='occupied' size='sm'>
										Occupied
									</Badge>
									<Badge variant='maintenance' size='sm'>
										Maintenance
									</Badge>
								</div>
							</div>
						</CardHeader>
						<CardContent className='p-0'>
							<div className='overflow-x-auto'>
								<table className='w-full text-left text-sm'>
									<thead className='bg-gray-1 text-xs font-semibold uppercase text-body dark:bg-gray-800 dark:text-gray-300'>
										<tr>
											<th className='px-5 py-3.5'>Room No</th>
											<th className='px-5 py-3.5'>Floor / Wing</th>
											<th className='px-5 py-3.5'>Sharing Type</th>
											<th className='px-5 py-3.5'>Rent per Bed</th>
											<th className='px-5 py-3.5'>Status</th>
										</tr>
									</thead>
									<tbody className='divide-y divide-stroke dark:divide-stroke-dark'>
										<tr className='hover:bg-gray-1/50 dark:hover:bg-gray-800/50'>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												Room 101
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												1st Floor, Wing A
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												2-Sharing (Double)
											</td>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												{formatINR(8500)}
											</td>
											<td className='px-5 py-3.5'>
												<Badge variant='occupied'>2/2 Beds Occupied</Badge>
											</td>
										</tr>
										<tr className='hover:bg-gray-1/50 dark:hover:bg-gray-800/50'>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												Room 102
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												1st Floor, Wing A
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												3-Sharing (Triple)
											</td>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												{formatINR(6500)}
											</td>
											<td className='px-5 py-3.5'>
												<Badge variant='available'>1 Bed Available</Badge>
											</td>
										</tr>
										<tr className='hover:bg-gray-1/50 dark:hover:bg-gray-800/50'>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												Room 201
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												2nd Floor, Wing B
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												1-Sharing (Single)
											</td>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												{formatINR(12000)}
											</td>
											<td className='px-5 py-3.5'>
												<Badge variant='available'>Available</Badge>
											</td>
										</tr>
										<tr className='hover:bg-gray-1/50 dark:hover:bg-gray-800/50'>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												Room 202
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												2nd Floor, Wing B
											</td>
											<td className='px-5 py-3.5 text-body dark:text-gray-300'>
												2-Sharing (Double)
											</td>
											<td className='px-5 py-3.5 font-medium text-dark dark:text-white'>
												{formatINR(8500)}
											</td>
											<td className='px-5 py-3.5'>
												<Badge variant='maintenance'>
													Painting / AC Repair
												</Badge>
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Right 1 Col: Setup Checklist for New PG Owner */}
				<div className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle>PG Setup Checklist</CardTitle>
							<CardDescription>
								Core workflows for onboarding your PG or Hostel operations
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-4'>
							<div className='flex items-start gap-3 rounded-lg border border-stroke p-3 dark:border-stroke-dark'>
								<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'>
									✓
								</div>
								<div>
									<h4 className='text-xs font-semibold text-dark dark:text-white'>
										Design System Baseline
									</h4>
									<p className='text-xs text-body dark:text-gray-4'>
										Tokens, components, and Indian currency utilities active.
									</p>
								</div>
							</div>

							<div className='flex items-start gap-3 rounded-lg border border-stroke p-3 dark:border-stroke-dark'>
								<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'>
									2
								</div>
								<div>
									<h4 className='text-xs font-semibold text-dark dark:text-white'>
										Property & Room Inventory (Phase E)
									</h4>
									<p className='text-xs text-body dark:text-gray-4'>
										Prisma models and management views for properties, floors,
										rooms, and beds.
									</p>
								</div>
							</div>

							<div className='flex items-start gap-3 rounded-lg border border-stroke p-3 dark:border-stroke-dark'>
								<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
									3
								</div>
								<div>
									<h4 className='text-xs font-semibold text-dark dark:text-white'>
										Resident KYC & Allotment (Phase E)
									</h4>
									<p className='text-xs text-body dark:text-gray-4'>
										Aadhaar/ID collection, guardian details, and check-in dates.
									</p>
								</div>
							</div>

							<div className='flex items-start gap-3 rounded-lg border border-stroke p-3 dark:border-stroke-dark'>
								<div className='flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300'>
									4
								</div>
								<div>
									<h4 className='text-xs font-semibold text-dark dark:text-white'>
										Rent Invoicing & Dues (Phase F)
									</h4>
									<p className='text-xs text-body dark:text-gray-4'>
										Cycle generation, security deposit tracking, and payment
										logging.
									</p>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Phase Notice Card */}
					<div className='rounded-xl border border-[#E8E3D8] bg-[#F4EFEA]/60 p-5 dark:border-[#1E3A2F] dark:bg-[#071711]'>
						<div className='flex items-start gap-3'>
							<span className='text-emerald-600 dark:text-emerald-400'>ℹ️</span>
							<div>
								<h4 className='text-xs font-semibold text-dark dark:text-white'>
									Indian PG Operations Focus
								</h4>
								<p className='mt-1 text-xs leading-relaxed text-body dark:text-gray-4'>
									Designed specifically for PG & hostel operators managing
									multi-sharing rooms, monthly rent collections in Rupees, and
									verified resident records.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
