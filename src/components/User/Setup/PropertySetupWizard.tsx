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

// ==========================================
// Professional Vector Icons (No Emojis)
// ==========================================

function IconHouse({ className = "size-5" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M3 10.5L12 3l9 7.5' />
			<path d='M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5' />
			<path d='M9 21v-6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6' />
		</svg>
	);
}

function IconBuilding({ className = "size-5" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<rect x='4' y='3' width='16' height='18' rx='2' />
			<path d='M9 3v18' />
			<path d='M4 8h5M4 12h5M4 16h5' />
			<path d='M14 7h2M14 11h2M14 15h2' />
		</svg>
	);
}

function IconUserMale({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<circle cx='12' cy='7' r='4' />
			<path d='M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2' />
		</svg>
	);
}

function IconUserFemale({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<circle cx='12' cy='7' r='4' />
			<path d='M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2' />
			<path d='M12 11v4' />
			<path d='M10 13h4' />
		</svg>
	);
}

function IconUsersCoed({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
			<circle cx='9' cy='7' r='4' />
			<path d='M22 21v-2a4 4 0 0 0-3-3.87' />
			<path d='M16 3.13a4 4 0 0 1 0 7.75' />
		</svg>
	);
}

function IconArrowRight({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<line x1='5' y1='12' x2='19' y2='12' />
			<polyline points='12 5 19 12 12 19' />
		</svg>
	);
}

function IconArrowLeft({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<line x1='19' y1='12' x2='5' y2='12' />
			<polyline points='12 19 5 12 12 5' />
		</svg>
	);
}

function IconShieldCheck({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
			<polyline points='9 12 11 14 15 10' />
		</svg>
	);
}

function IconInfo({ className = "size-4" }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox='0 0 24 24'
			fill='none'
			stroke='currentColor'
			strokeWidth='1.75'
			strokeLinecap='round'
			strokeLinejoin='round'
		>
			<circle cx='12' cy='12' r='10' />
			<line x1='12' y1='16' x2='12' y2='12' />
			<line x1='12' y1='8' x2='12.01' y2='8' />
		</svg>
	);
}

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

	// Form State - strictly PG or HOSTEL
	const [name, setName] = useState("");
	const [type, setType] = useState<"PG" | "HOSTEL">("PG");
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
				try {
					await update();
				} catch {
					// safe fallback
				}

				setTimeout(() => {
					router.push("/user");
					router.refresh();
				}, 500);
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

	const getTypeLabel = (t: "PG" | "HOSTEL") => {
		const typeLabels: Record<string, string> = {
			PG: "PG (Paying Guest)",
			HOSTEL: "Hostel",
		};
		return typeLabels[t] || "PG (Paying Guest)";
	};

	const getGenderLabel = (g: "BOYS" | "GIRLS" | "COED") => {
		const genderLabels: Record<string, string> = {
			BOYS: "Boys Only",
			GIRLS: "Girls Only",
			COED: "Co-ed (Combined)",
		};
		return genderLabels[g] || "Co-ed (Combined)";
	};

	const popularCities = [
		"Kota",
		"Jaipur",
		"Pune",
		"Bengaluru",
		"Indore",
		"Delhi NCR",
	];

	return (
		<div className='mx-auto max-w-lg'>
			{/* Top Brand Header */}
			<div className='mb-4 text-center sm:mb-6'>
				<div className='flex justify-center'>
					<BrandLogo href='/user/setup' />
				</div>
				<h1 className='mt-3 font-satoshi text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:mt-4 sm:text-2xl'>
					First-Time PG/Hostel Setup
				</h1>
				<p className='mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Welcome,{" "}
					<span className='font-semibold text-slate-800 dark:text-slate-200'>
						{ownerName}
					</span>
					! Configure your property to activate your dashboard.
				</p>
			</div>

			{/* Sleek Segmented Stepper */}
			<div className='shadow-xs mb-4 rounded-xl border border-slate-200/90 bg-white p-3 dark:border-slate-800 dark:bg-[#071711] sm:mb-5 sm:p-3.5'>
				<div className='mb-2.5 flex items-center justify-between'>
					<span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/70 dark:text-emerald-300'>
						<span className='size-1.5 rounded-full bg-emerald-600' />
						Step {step} of 3
					</span>
					<span className='text-xs font-medium text-slate-600 dark:text-slate-300'>
						{step === 1
							? "Category & Profile"
							: step === 2
								? "Property Location"
								: "Review & Launch"}
					</span>
				</div>

				<div className='grid grid-cols-3 gap-1.5 sm:gap-2'>
					<div
						className={`h-1.5 rounded-full transition-all duration-300 ${
							step >= 1
								? "bg-[#1A382B] dark:bg-emerald-500"
								: "bg-slate-200 dark:bg-slate-800"
						}`}
					/>
					<div
						className={`h-1.5 rounded-full transition-all duration-300 ${
							step >= 2
								? "bg-[#1A382B] dark:bg-emerald-500"
								: "bg-slate-200 dark:bg-slate-800"
						}`}
					/>
					<div
						className={`h-1.5 rounded-full transition-all duration-300 ${
							step >= 3
								? "bg-[#1A382B] dark:bg-emerald-500"
								: "bg-slate-200 dark:bg-slate-800"
						}`}
					/>
				</div>
			</div>

			{/* Wizard Form Card */}
			<Card className='shadow-xs rounded-2xl border-slate-200/90 bg-white dark:border-slate-800 dark:bg-[#071711]'>
				<CardContent className='p-4 sm:p-6'>
					{/* STEP 1: Basic PG/Hostel Details */}
					{step === 1 && (
						<form
							onSubmit={handleNextFromStep1}
							className='space-y-4 sm:space-y-5'
						>
							<div>
								<h2 className='font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
									Property Category & Profile
								</h2>
								<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
									Select property type and name your establishment.
								</p>
							</div>

							{/* Category Selection - Strictly 2 Options with Vector SVGs */}
							<div>
								<div className='mb-1.5 flex items-center justify-between'>
									<label className='block text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm'>
										Property Category <span className='text-rose-500'>*</span>
									</label>
									<span className='text-[11px] text-slate-400'>
										Choose PG or Hostel
									</span>
								</div>

								<div className='grid grid-cols-2 gap-2.5 sm:gap-3'>
									{/* PG Option */}
									<button
										type='button'
										onClick={() => setType("PG")}
										className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all sm:p-3.5 ${
											type === "PG"
												? "shadow-xs border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40"
												: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-[#0A1F17]"
										}`}
									>
										<div className='flex w-full items-center justify-between'>
											<div
												className={`flex size-8 items-center justify-center rounded-lg transition-colors sm:size-9 ${
													type === "PG"
														? "shadow-xs bg-[#1A382B] text-white dark:bg-emerald-600"
														: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
												}`}
											>
												<IconHouse className='size-4 sm:size-4.5' />
											</div>
											<div
												className={`flex size-4.5 items-center justify-center rounded-full border transition-all ${
													type === "PG"
														? "border-emerald-600 bg-emerald-600 text-white"
														: "border-slate-300 dark:border-slate-700"
												}`}
											>
												{type === "PG" && (
													<svg
														className='size-3'
														viewBox='0 0 24 24'
														fill='none'
														stroke='currentColor'
														strokeWidth={3}
														strokeLinecap='round'
														strokeLinejoin='round'
													>
														<polyline points='20 6 9 17 4 12' />
													</svg>
												)}
											</div>
										</div>
										<div className='mt-2.5'>
											<p
												className={`text-xs font-bold sm:text-sm ${
													type === "PG"
														? "text-emerald-950 dark:text-emerald-200"
														: "text-slate-900 dark:text-white"
												}`}
											>
												PG (Paying Guest)
											</p>
											<p className='mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400'>
												Furnished rooms or beds with food & utilities included
											</p>
										</div>
									</button>

									{/* Hostel Option */}
									<button
										type='button'
										onClick={() => setType("HOSTEL")}
										className={`group relative flex flex-col justify-between rounded-xl border p-3 text-left transition-all sm:p-3.5 ${
											type === "HOSTEL"
												? "shadow-xs border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600/30 dark:border-emerald-500 dark:bg-emerald-950/40"
												: "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 dark:border-slate-800 dark:bg-[#0A1F17]"
										}`}
									>
										<div className='flex w-full items-center justify-between'>
											<div
												className={`flex size-8 items-center justify-center rounded-lg transition-colors sm:size-9 ${
													type === "HOSTEL"
														? "shadow-xs bg-[#1A382B] text-white dark:bg-emerald-600"
														: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
												}`}
											>
												<IconBuilding className='size-4 sm:size-4.5' />
											</div>
											<div
												className={`flex size-4.5 items-center justify-center rounded-full border transition-all ${
													type === "HOSTEL"
														? "border-emerald-600 bg-emerald-600 text-white"
														: "border-slate-300 dark:border-slate-700"
												}`}
											>
												{type === "HOSTEL" && (
													<svg
														className='size-3'
														viewBox='0 0 24 24'
														fill='none'
														stroke='currentColor'
														strokeWidth={3}
														strokeLinecap='round'
														strokeLinejoin='round'
													>
														<polyline points='20 6 9 17 4 12' />
													</svg>
												)}
											</div>
										</div>
										<div className='mt-2.5'>
											<p
												className={`text-xs font-bold sm:text-sm ${
													type === "HOSTEL"
														? "text-emerald-950 dark:text-emerald-200"
														: "text-slate-900 dark:text-white"
												}`}
											>
												Hostel
											</p>
											<p className='mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400'>
												Hostel building for students or working professionals
											</p>
										</div>
									</button>
								</div>
							</div>

							{/* Property Name Input */}
							<div>
								<Input
									label='PG/Hostel Name'
									id='property-name'
									name='property-name'
									type='text'
									required
									placeholder='e.g. Shree Balaji PG or Landmark Girls Hostel'
									value={name}
									onChange={(e) => setName(e.target.value)}
									helperText='Name displayed on resident rent receipts and agreements.'
								/>
							</div>

							{/* Resident Profile - Clean Vector Selector */}
							<div>
								<div className='mb-1.5 flex items-center justify-between'>
									<label className='block text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm'>
										Resident Type <span className='text-rose-500'>*</span>
									</label>
									<span className='text-[11px] text-slate-400'>
										Target occupants
									</span>
								</div>

								<div className='grid grid-cols-3 gap-2'>
									{[
										{
											id: "BOYS" as const,
											title: "Boys Only",
											Icon: IconUserMale,
										},
										{
											id: "GIRLS" as const,
											title: "Girls Only",
											Icon: IconUserFemale,
										},
										{
											id: "COED" as const,
											title: "Co-ed",
											Icon: IconUsersCoed,
										},
									].map((item) => (
										<button
											key={item.id}
											type='button'
											onClick={() => setGender(item.id)}
											className={`flex flex-col items-center justify-center rounded-xl border px-2 py-2.5 text-center transition-all ${
												gender === item.id
													? "border-emerald-600 bg-emerald-50/60 font-semibold text-emerald-950 ring-1 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200"
													: "border-slate-200 bg-slate-50/40 text-slate-700 hover:border-slate-300 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-[#0A1F17] dark:text-slate-300"
											}`}
										>
											<item.Icon className='size-4 text-inherit sm:size-4.5' />
											<span className='mt-1 text-xs font-bold'>
												{item.title}
											</span>
										</button>
									))}
								</div>
							</div>

							{/* Primary Action Button */}
							<div className='pt-1 sm:pt-2'>
								<Button
									type='submit'
									variant='primary'
									size='lg'
									className='w-full'
									rightIcon={<IconArrowRight className='size-4' />}
								>
									Continue to Location
								</Button>
							</div>
						</form>
					)}

					{/* STEP 2: Location & Address */}
					{step === 2 && (
						<form
							onSubmit={handleNextFromStep2}
							className='space-y-4 sm:space-y-5'
						>
							<div>
								<h2 className='font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
									Property Location & Address
								</h2>
								<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
									Where is your PG/Hostel building physically located?
								</p>
							</div>

							<div className='space-y-3.5 sm:space-y-4'>
								{/* City Input with Quick Tap Chips */}
								<div>
									<Input
										label='City'
										id='city'
										name='city'
										type='text'
										required
										placeholder='e.g. Kota, Jaipur, Pune, Bengaluru'
										value={city}
										onChange={(e) => setCity(e.target.value)}
									/>

									{/* Quick Tap Chips for Mobile Convenience */}
									<div className='mt-2 flex flex-wrap items-center gap-1.5'>
										<span className='text-[11px] text-slate-400'>
											Quick tap:
										</span>
										{popularCities.map((c) => (
											<button
												key={c}
												type='button'
												onClick={() => setCity(c)}
												className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
													city === c
														? "shadow-xs border border-emerald-600 bg-emerald-600 font-bold text-white"
														: "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
												}`}
											>
												{c}
											</button>
										))}
									</div>
								</div>

								{/* Area Input */}
								<div>
									<Input
										label='Area / Locality'
										id='area'
										name='area'
										type='text'
										required
										placeholder='e.g. Landmark City, Malviya Nagar, Koramangala'
										value={area}
										onChange={(e) => setArea(e.target.value)}
									/>
								</div>

								{/* Detailed Street Address */}
								<div>
									<Input
										label='Detailed Street Address'
										id='address'
										name='address'
										type='text'
										required
										placeholder='Plot No, Building Name, Street / Landmark'
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										helperText='Complete address for official resident agreements, invoices, and police verification.'
									/>
								</div>
							</div>

							{/* Navigation Buttons */}
							<div className='flex items-center gap-2 pt-1 sm:gap-3 sm:pt-2'>
								<Button
									type='button'
									variant='outline'
									size='lg'
									onClick={() => setStep(1)}
									className='w-1/3'
									icon={<IconArrowLeft className='size-4' />}
								>
									Back
								</Button>
								<Button
									type='submit'
									variant='primary'
									size='lg'
									className='w-2/3'
									rightIcon={<IconArrowRight className='size-4' />}
								>
									Review Summary
								</Button>
							</div>
						</form>
					)}

					{/* STEP 3: Review & Confirmation */}
					{step === 3 && (
						<div className='space-y-4 sm:space-y-5'>
							<div>
								<h2 className='font-satoshi text-base font-bold text-slate-900 dark:text-white sm:text-lg'>
									Review & Launch Property
								</h2>
								<p className='mt-0.5 text-xs text-slate-500 dark:text-slate-400'>
									Confirm your PG/Hostel details before creating your dashboard.
								</p>
							</div>

							{/* Summary Card */}
							<div className='rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-[#0A1F17] sm:p-4.5'>
								<div className='flex items-start justify-between gap-2.5'>
									<div>
										<h3 className='font-satoshi text-base font-bold text-slate-900 dark:text-white'>
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

								{/* Badges with Clean Vector Icons */}
								<div className='mt-3 flex flex-wrap gap-1.5 border-t border-slate-200/80 pt-2.5 text-xs dark:border-slate-800'>
									<span className='inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-100/70 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950 dark:text-emerald-300'>
										{type === "PG" ? (
											<IconHouse className='size-3.5 text-emerald-700 dark:text-emerald-300' />
										) : (
											<IconBuilding className='size-3.5 text-emerald-700 dark:text-emerald-300' />
										)}
										<span>{getTypeLabel(type)}</span>
									</span>

									<span className='inline-flex items-center gap-1.5 rounded-lg border border-blue-200/70 bg-blue-100/70 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:border-blue-800/60 dark:bg-blue-950 dark:text-blue-300'>
										{gender === "BOYS" ? (
											<IconUserMale className='size-3.5 text-blue-700 dark:text-blue-300' />
										) : gender === "GIRLS" ? (
											<IconUserFemale className='size-3.5 text-blue-700 dark:text-blue-300' />
										) : (
											<IconUsersCoed className='size-3.5 text-blue-700 dark:text-blue-300' />
										)}
										<span>{getGenderLabel(gender)}</span>
									</span>
								</div>

								{/* Details Table */}
								<div className='mt-3 space-y-1.5 border-t border-slate-200/80 pt-2.5 text-xs dark:border-slate-800'>
									<div className='flex items-start justify-between gap-2'>
										<span className='text-slate-500 dark:text-slate-400'>
											Address
										</span>
										<span className='text-right font-medium text-slate-800 dark:text-slate-200'>
											{address}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-slate-500 dark:text-slate-400'>
											Owner
										</span>
										<span className='font-medium text-slate-800 dark:text-slate-200'>
											{ownerName}
										</span>
									</div>
								</div>
							</div>

							{/* Callout Notice with Vector SVG */}
							<div className='flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200 sm:p-3'>
								<IconInfo className='mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-300' />
								<p className='leading-relaxed'>
									Your initial PG/Hostel record will be saved securely. Room
									allocations, floor plans, and resident check-ins can be
									configured directly from your dashboard next.
								</p>
							</div>

							{/* Final Action Buttons */}
							<div className='flex items-center gap-2 pt-1 sm:gap-3 sm:pt-2'>
								<Button
									type='button'
									variant='outline'
									size='lg'
									disabled={loading}
									onClick={() => setStep(2)}
									className='w-1/3'
									icon={<IconArrowLeft className='size-4' />}
								>
									Edit
								</Button>
								<Button
									type='button'
									variant='primary'
									size='lg'
									isLoading={loading}
									onClick={handleFinalSubmit}
									className='w-2/3'
									icon={<IconShieldCheck className='size-4' />}
								>
									Confirm & Launch
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
