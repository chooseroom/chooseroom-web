"use client";

import { BrandLogo } from "@/components/Common/BrandLogo";
import {
	Badge,
	Button,
	Card,
	CardContent,
	Input,
} from "@/components/Common/UI";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface PropertySetupWizardProps {
	ownerName: string;
}

export default function PropertySetupWizard({
	ownerName,
}: PropertySetupWizardProps) {
	const { update } = useSession();
	const router = useRouter();

	const [step, setStep] = useState<1 | 2 | 3>(1);
	const [loading, setLoading] = useState(false);

	// Form State
	const [name, setName] = useState("");
	const [type, setType] = useState<"PG" | "HOSTEL" | "BOTH">("BOTH");
	const [gender, setGender] = useState<"BOYS" | "GIRLS" | "COED">("BOYS");
	const [city, setCity] = useState("");
	const [area, setArea] = useState("");
	const [address, setAddress] = useState("");

	// Step 1 Validation
	const handleNextFromStep1 = (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim() || name.trim().length < 2) {
			toast.error(
				"Please enter a valid PG/Hostel name (at least 2 characters)."
			);
			return;
		}
		setStep(2);
	};

	// Step 2 Validation
	const handleNextFromStep2 = (e: React.FormEvent) => {
		e.preventDefault();
		if (!city.trim() || city.trim().length < 2) {
			toast.error("Please enter your property city.");
			return;
		}
		if (!area.trim() || area.trim().length < 2) {
			toast.error("Please enter the locality or area name.");
			return;
		}
		if (!address.trim() || address.trim().length < 5) {
			toast.error(
				"Please enter the complete street address (at least 5 characters)."
			);
			return;
		}
		setStep(3);
	};

	// Step 3 Submission
	const handleFinalSubmit = async () => {
		setLoading(true);

		try {
			const res = await axios.post("/api/user/setup", {
				name: name.trim(),
				type,
				gender,
				city: city.trim(),
				area: area.trim(),
				address: address.trim(),
			});

			if (res.status === 200 || res.status === 201) {
				toast.success("PG/Hostel property configured successfully!");
				// Update client session token with setupCompleted: true
				try {
					await update();
				} catch {
					// Proceed even if update hook has any delay
				}

				setTimeout(() => {
					router.push("/user");
					router.refresh();
				}, 600);
			}
		} catch (error: any) {
			const errMsg =
				error?.response?.data?.message ||
				error?.response?.data ||
				"Failed to create property. Please verify your details.";
			toast.error(
				typeof errMsg === "string" ? errMsg : "Property creation failed."
			);
			setLoading(false);
		}
	};

	const getTypeLabel = (t: "PG" | "HOSTEL" | "BOTH") => {
		const typeLabels: Record<string, string> = {
			PG: "PG (Paying Guest)",
			HOSTEL: "Hostel",
			BOTH: "Both PG & Hostel",
		};
		return typeLabels[t] || "Both PG & Hostel";
	};

	const getGenderLabel = (g: "BOYS" | "GIRLS" | "COED") => {
		const genderLabels: Record<string, string> = {
			BOYS: "Boys PG/Hostel",
			GIRLS: "Girls PG/Hostel",
			COED: "Co-ed (Combined) PG/Hostel",
		};
		return genderLabels[g] || "Co-ed (Combined) PG/Hostel";
	};

	return (
		<div className='mx-auto max-w-2xl py-8 sm:py-12'>
			{/* Top Header */}
			<div className='mb-8 text-center'>
				<div className='flex justify-center'>
					<BrandLogo href='/user/setup' />
				</div>
				<h1 className='mt-6 font-satoshi text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl'>
					First-Time PG/Hostel Setup
				</h1>
				<p className='mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Welcome,{" "}
					<strong className='text-slate-800 dark:text-slate-200'>
						{ownerName}
					</strong>
					! Complete your initial PG/Hostel property registration to activate
					your dashboard.
				</p>
			</div>

			{/* Multi-Step Progress Stepper */}
			<div className='mb-8'>
				<div className='flex items-center justify-between'>
					{/* Step 1 */}
					<div className='flex flex-1 items-center'>
						<div
							className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-satoshi text-xs font-bold transition-all sm:size-10 sm:text-sm ${
								step >= 1
									? "bg-[#1A382B] text-white shadow-sm ring-2 ring-emerald-500/20"
									: "bg-slate-100 text-slate-500 dark:bg-slate-800"
							}`}
						>
							{step > 1 ? "✓" : "1"}
						</div>
						<div className='ml-3 hidden sm:block'>
							<p className='text-xs font-bold text-slate-900 dark:text-white'>
								PG/Hostel Info
							</p>
							<p className='text-[11px] text-slate-400'>Name & Category</p>
						</div>
						<div
							className={`mx-3 h-0.5 flex-1 transition-colors ${
								step > 1 ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
							}`}
						/>
					</div>

					{/* Step 2 */}
					<div className='flex flex-1 items-center'>
						<div
							className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-satoshi text-xs font-bold transition-all sm:size-10 sm:text-sm ${
								step >= 2
									? "bg-[#1A382B] text-white shadow-sm ring-2 ring-emerald-500/20"
									: "bg-slate-100 text-slate-500 dark:bg-slate-800"
							}`}
						>
							{step > 2 ? "✓" : "2"}
						</div>
						<div className='ml-3 hidden sm:block'>
							<p className='text-xs font-bold text-slate-900 dark:text-white'>
								Location
							</p>
							<p className='text-[11px] text-slate-400'>City & Address</p>
						</div>
						<div
							className={`mx-3 h-0.5 flex-1 transition-colors ${
								step > 2 ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
							}`}
						/>
					</div>

					{/* Step 3 */}
					<div className='flex items-center'>
						<div
							className={`flex size-9 shrink-0 items-center justify-center rounded-xl font-satoshi text-xs font-bold transition-all sm:size-10 sm:text-sm ${
								step === 3
									? "bg-[#1A382B] text-white shadow-sm ring-2 ring-emerald-500/20"
									: "bg-slate-100 text-slate-500 dark:bg-slate-800"
							}`}
						>
							3
						</div>
						<div className='ml-3 hidden sm:block'>
							<p className='text-xs font-bold text-slate-900 dark:text-white'>
								Confirm
							</p>
							<p className='text-[11px] text-slate-400'>Review & Launch</p>
						</div>
					</div>
				</div>
			</div>

			{/* Wizard Step Cards */}
			<Card className='border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
				<CardContent className='p-6 sm:p-8'>
					{/* STEP 1: Basic PG/Hostel Details */}
					{step === 1 && (
						<form onSubmit={handleNextFromStep1} className='space-y-5'>
							<div>
								<h2 className='font-satoshi text-lg font-bold text-slate-900 dark:text-white'>
									Step 1: PG/Hostel Profile
								</h2>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Provide the official name and operational type for your
									property.
								</p>
							</div>

							<div>
								<Input
									label='PG/Hostel Name'
									id='property-name'
									name='property-name'
									type='text'
									required
									placeholder='e.g. Shree Balaji PG/Hostel or Landmark Girls Hostel'
									value={name}
									onChange={(e) => setName(e.target.value)}
									helperText='This name will appear on resident receipts and your dashboard.'
								/>
							</div>

							{/* Category Selection */}
							<div>
								<label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>
									Property Category <span className='text-rose-500'>*</span>
								</label>
								<div className='mt-2 grid grid-cols-3 gap-2.5 sm:gap-3'>
									{(
										[
											{
												id: "BOTH",
												title: "Both PG & Hostel",
												desc: "Multi-purpose",
											},
											{ id: "PG", title: "PG Only", desc: "Paying Guest" },
											{
												id: "HOSTEL",
												title: "Hostel Only",
												desc: "Student/Hostel",
											},
										] as const
									).map((item) => (
										<button
											key={item.id}
											type='button'
											onClick={() => setType(item.id)}
											className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
												type === item.id
													? "border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900 ring-2 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200"
													: "border-[#E8E3D8] bg-white text-slate-700 hover:border-slate-300 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-slate-300"
											}`}
										>
											<span className='text-xs font-bold'>{item.title}</span>
											<span className='mt-0.5 text-[10px] text-slate-400 dark:text-slate-500'>
												{item.desc}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Resident Gender/Type */}
							<div>
								<label className='block text-xs font-semibold text-slate-700 dark:text-slate-200'>
									Resident Type <span className='text-rose-500'>*</span>
								</label>
								<div className='mt-2 grid grid-cols-3 gap-2.5 sm:gap-3'>
									{(
										[
											{ id: "BOYS", title: "Boys Only", icon: "👨" },
											{ id: "GIRLS", title: "Girls Only", icon: "👩" },
											{ id: "COED", title: "Co-ed (Combined)", icon: "👥" },
										] as const
									).map((item) => (
										<button
											key={item.id}
											type='button'
											onClick={() => setGender(item.id)}
											className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
												gender === item.id
													? "border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-900 ring-2 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200"
													: "border-[#E8E3D8] bg-white text-slate-700 hover:border-slate-300 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-slate-300"
											}`}
										>
											<span className='text-base'>{item.icon}</span>
											<span className='mt-1 text-xs font-bold'>
												{item.title}
											</span>
										</button>
									))}
								</div>
							</div>

							<div className='pt-2'>
								<Button
									type='submit'
									variant='primary'
									size='lg'
									className='w-full'
								>
									Continue to Location →
								</Button>
							</div>
						</form>
					)}

					{/* STEP 2: Location & Address */}
					{step === 2 && (
						<form onSubmit={handleNextFromStep2} className='space-y-5'>
							<div>
								<h2 className='font-satoshi text-lg font-bold text-slate-900 dark:text-white'>
									Step 2: Property Location & Address
								</h2>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Enter where your PG/Hostel building is physically situated.
								</p>
							</div>

							<div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
								<div>
									<Input
										label='City'
										id='city'
										name='city'
										type='text'
										required
										placeholder='e.g. Kota, Bengaluru, Pune, Delhi'
										value={city}
										onChange={(e) => setCity(e.target.value)}
									/>
								</div>
								<div>
									<Input
										label='Area / Locality'
										id='area'
										name='area'
										type='text'
										required
										placeholder='e.g. Landmark City, Koramangala'
										value={area}
										onChange={(e) => setArea(e.target.value)}
									/>
								</div>
							</div>

							<div>
								<Input
									label='Detailed Address'
									id='address'
									name='address'
									type='text'
									required
									placeholder='Plot No, Building Name, Street / Landmark'
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									helperText='Complete address for official resident agreements and bills.'
								/>
							</div>

							<div className='flex items-center gap-3 pt-2'>
								<Button
									type='button'
									variant='outline'
									size='lg'
									onClick={() => setStep(1)}
									className='w-1/3'
								>
									← Back
								</Button>
								<Button
									type='submit'
									variant='primary'
									size='lg'
									className='w-2/3'
								>
									Review Summary →
								</Button>
							</div>
						</form>
					)}

					{/* STEP 3: Review & Confirmation */}
					{step === 3 && (
						<div className='space-y-5'>
							<div>
								<h2 className='font-satoshi text-lg font-bold text-slate-900 dark:text-white'>
									Step 3: Review & Confirm PG/Hostel Setup
								</h2>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Please verify your property information before creating your
									workspace.
								</p>
							</div>

							{/* Review Summary Card */}
							<div className='rounded-2xl border border-[#E8E3D8] bg-slate-50/70 p-5 dark:border-[#1E382B] dark:bg-[#0A1F17]'>
								<div className='flex items-start justify-between'>
									<div>
										<h3 className='font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
											{name}
										</h3>
										<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
											{area}, {city}
										</p>
									</div>
									<Badge variant='success' size='sm'>
										Ready to Launch
									</Badge>
								</div>

								<div className='mt-4 flex flex-wrap gap-2 border-t border-[#E8E3D8] pt-3 text-xs dark:border-[#1E382B]'>
									<span className='inline-flex items-center rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
										🏷️ {getTypeLabel(type)}
									</span>
									<span className='inline-flex items-center rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300'>
										👥 {getGenderLabel(gender)}
									</span>
								</div>

								<div className='mt-3.5 space-y-2 border-t border-[#E8E3D8] pt-3 text-xs dark:border-[#1E382B]'>
									<div className='flex justify-between'>
										<span className='text-slate-500 dark:text-slate-400'>
											Full Address
										</span>
										<span className='font-medium text-slate-800 dark:text-slate-200'>
											{address}
										</span>
									</div>
									<div className='flex justify-between'>
										<span className='text-slate-500 dark:text-slate-400'>
											Registered Owner
										</span>
										<span className='font-medium text-slate-800 dark:text-slate-200'>
											{ownerName}
										</span>
									</div>
								</div>
							</div>

							{/* Informative Note */}
							<div className='flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200'>
								<span className='text-base'>💡</span>
								<p className='leading-relaxed'>
									Once confirmed, your property record is saved in Choose Ghar.
									Floor plans, rooms, and resident check-ins can be customized
									next from your dashboard.
								</p>
							</div>

							<div className='flex items-center gap-3 pt-2'>
								<Button
									type='button'
									variant='outline'
									size='lg'
									disabled={loading}
									onClick={() => setStep(2)}
									className='w-1/3'
								>
									← Edit
								</Button>
								<Button
									type='button'
									variant='primary'
									size='lg'
									isLoading={loading}
									onClick={handleFinalSubmit}
									className='w-2/3'
								>
									Confirm & Launch My PG/Hostel
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
