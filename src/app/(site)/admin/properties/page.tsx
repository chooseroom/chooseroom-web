import { requireAdminSession } from "@/libs/adminAuth";
import { Button, Card, CardContent } from "@/components/Common/UI";
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Properties",
	description: "Platform property inventory and facility monitoring.",
};

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
	// Strict Server-side Super Admin Guard
	await requireAdminSession();

	return (
		<div className='space-y-5 pb-10 sm:space-y-6'>
			{/* Clean Page Title */}
			<div>
				<h1 className='font-satoshi text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl'>
					Properties
				</h1>
				<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Monitor and inspect registered hostel and PG properties across Choose
					Ghar.
				</p>
			</div>

			{/* Properties Status Card */}
			<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
				<CardContent className='px-4 py-10 text-center sm:py-14'>
					<div className='mx-auto flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'>
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
								d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
							/>
						</svg>
					</div>

					<h2 className='mt-4 font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
						No Properties Added Yet
					</h2>

					<p className='mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm'>
						Registered PG and hostel owners can set up their buildings, floors,
						and rooms from their dashboard. As properties are added, they will
						appear here with live occupancy tracking.
					</p>

					<div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
						<Link href='/admin/owners'>
							<Button variant='primary' size='sm'>
								View PG Owners
							</Button>
						</Link>
						<Link href='/admin'>
							<Button variant='outline' size='sm'>
								Back to Overview
							</Button>
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
