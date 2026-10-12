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

	// Form State - only PG or HOSTEL (no multi-purpose option)
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
		<div className='mx-auto max-w-2xl px-2 py-4 sm:px-0 sm:py-10'>
			{/* Top Header */}
			<div className='mb-6 text-center sm:mb-8'>
				<div className='flex justify-center'>
					<BrandLogo href='/user/setup' />
				</div>
				<h1 className='mt-4 font-satoshi text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:mt-6 sm:text-3xl'>
					First-Time PG/Hostel Setup
				</h1>
				<p className='mt-1.5 px-2 text-xs text-slate-500 dark:text-slate-400 sm:text-sm'>
					Welcome,{" "}
					<strong className='text-slate-800 dark:text-slate-200'>
						{ownerName}
					</strong>
					! Complete your initial property registration to activate your
					dashboard.
				</p>
			</div>

			{/* Progress Stepper - Clean & Responsive on all screens */}
			<div className='mb-6 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-[#071711] sm:mb-8 sm:p-5'>
				{/* Mobile Step Badge & Percentage Bar */}
				<div className='mb-3 flex items-center justify-between sm:hidden'>
					<span className='rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'>
						Step {step} of 3
					</span>
					<span className='text-xs font-semibold text-slate-600 dark:text-slate-300'>
						{step === 1
							? "Profile & Category"
							: step === 2
								? "Property Location"
								: "Review & Confirmation"}
					</span>
				</div>

				{/* Visual Step Numbers & Connectors */}
				<div className='flex items-center justify-between'>
					{/* Step 1 */}
					<div className='flex flex-1 items-center'>
						<div
							className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-satoshi text-xs font-bold transition-all sm:size-10 sm:text-sm ${
								step >= 1
									? "bg-[#1A382B] text-white shadow-sm ring-2 ring-emerald-500/20"
									: "bg-slate-100 text-slate-500 dark:bg-slate-800"
							}`}
						>
							{step > 1 ? "✓" : "1"}
						</div>
						<div className='ml-2.5 hidden sm:block'>
							<p className='text-xs font-bold text-slate-900 dark:text-white'>
								Category & Name
							</p>
							<p className='text-[11px] text-slate-400'>PG or Hostel</p>
						</div>
						<div
							className={`mx-2 h-1 flex-1 rounded-full transition-colors sm:mx-3 ${
								step > 1 ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
							}`}
						/>
					</div>

					{/* Step 2 */}
					<div className='flex flex-1 items-center'>
						<div
							className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-satoshi text-xs font-bold transition-all sm:size-10 sm:text-sm ${
								step >= 2
									? "bg-[#1A382B] text-white shadow-sm ring-2 ring-emerald-500/20"
									: "bg-slate-100 text-slate-500 dark:bg-slate-800"
							}`}
						>
							{step > 2 ? "✓" : "2"}
						</div>
						<div className='ml-2.5 hidden sm:block'>
							<p className='text-xs font-bold text-slate-900 dark:text-white'>
								Location
							</p>
							<p className='text-[11px] text-slate-400'>City & Address</p>
						</div>
						<div
							className={`mx-2 h-1 flex-1 rounded-full transition-colors sm:mx-3 ${
								step > 2 ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
							}`}
						/>
					</div>

					{/* Step 3 */}
					<div className='flex items-center'>
						<div
							className={`flex size-8 shrink-0 items-center justify-center rounded-xl font-satoshi text-xs font-bold transition-all sm:size-10 sm:text-sm ${
								step === 3
									? "bg-[#1A382B] text-white shadow-sm ring-2 ring-emerald-500/20"
									: "bg-slate-100 text-slate-500 dark:bg-slate-800"
							}`}
						>
							3
						</div>
						<div className='ml-2.5 hidden sm:block'>
							<p className='text-xs font-bold text-slate-900 dark:text-white'>
								Launch
							</p>
							<p className='text-[11px] text-slate-400'>Confirm & Start</p>
						</div>
					</div>
				</div>
			</div>

			{/* Wizard Form Card */}
			<Card className='rounded-2xl border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E382B] dark:bg-[#071711]'>
				<CardContent className='p-4.5 sm:p-8'>
					{/* STEP 1: Basic PG/Hostel Details */}
					{step === 1 && (
						<form onSubmit={handleNextFromStep1} className='space-y-5'>
							<div>
								<h2 className='font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:text-xl'>
									Step 1: Property Category & Profile
								</h2>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Select whether this building operates as a PG or a Hostel, and
									name your property.
								</p>
							</div>

							{/* Category Selection - Exactly 2 options (PG or Hostel), Multi-option removed */}
							<div>
								<div className='mb-2 flex items-center justify-between'>
									<label className='block text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm'>
										Property Category <span className='text-rose-500'>*</span>
									</label>
									<span className='text-[11px] text-slate-400'>Choose one</span>
								</div>

								<div className='grid grid-cols-2 gap-3 sm:gap-4'>
									{[
										{
											id: "PG" as const,
											title: "PG (Paying Guest)",
											desc: "Furnished rooms or beds with food & utilities included",
											icon: "🏠",
										},
										{
											id: "HOSTEL" as const,
											title: "Hostel",
											desc: "Hostel building for students or working professionals",
											icon: "🏢",
										},
									].map((item) => (
										<button
											key={item.id}
											type='button'
											onClick={() => setType(item.id)}
											className={`relative flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all sm:p-5 ${
												type === item.id
													? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-600/20 dark:border-emerald-500 dark:bg-emerald-950/40"
													: "border-[#E8E3D8] bg-white hover:border-slate-300 dark:border-[#1E382B] dark:bg-[#0A1F17]"
											}`}
										>
											<div className='flex w-full items-center justify-between'>
												<span className='text-2xl sm:text-3xl'>
													{item.icon}
												</span>
												<div
													className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
														type === item.id
															? "border-emerald-600 bg-emerald-600 text-white"
															: "border-slate-300 dark:border-slate-700"
													}`}
												>
													{type === item.id && (
														<svg
															className='h-3 w-3'
															fill='none'
															viewBox='0 0 24 24'
															stroke='currentColor'
															strokeWidth={3}
														>
															<path
																strokeLinecap='round'
																strokeLinejoin='round'
																d='M5 13l4 4L19 7'
															/>
														</svg>
													)}
												</div>
											</div>
											<span
												className={`mt-2.5 block text-xs font-bold sm:mt-3 sm:text-base ${
													type === item.id
														? "text-emerald-950 dark:text-emerald-200"
														: "text-slate-900 dark:text-white"
												}`}
											>
												{item.title}
											</span>
											<span className='mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 sm:text-xs'>
												{item.desc}
											</span>
										</button>
									))}
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
									placeholder='e.g. Shree Balaji PG/Hostel or Landmark Girls Hostel'
									value={name}
									onChange={(e) => setName(e.target.value)}
									helperText='This name will appear on resident receipts, rent invoices, and your owner dashboard.'
								/>
							</div>

							{/* Resident Gender Profile */}
							<div>
								<div className='mb-2 flex items-center justify-between'>
									<label className='block text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm'>
										Resident Type <span className='text-rose-500'>*</span>
									</label>
									<span className='text-[11px] text-slate-400'>
										Select occupant type
									</span>
								</div>

								<div className='grid grid-cols-3 gap-2 sm:gap-3'>
									{[
										{ id: "BOYS" as const, title: "Boys Only", icon: "👨" },
										{ id: "GIRLS" as const, title: "Girls Only", icon: "👩" },
										{ id: "COED" as const, title: "Co-ed", icon: "👥" },
									].map((item) => (
										<button
											key={item.id}
											type='button'
											onClick={() => setGender(item.id)}
											className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all sm:p-3.5 ${
												gender === item.id
													? "border-emerald-600 bg-emerald-50/70 font-semibold text-emerald-950 ring-2 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-200"
													: "border-[#E8E3D8] bg-white text-slate-700 hover:border-slate-300 dark:border-[#1E382B] dark:bg-[#0A1F17] dark:text-slate-300"
											}`}
										>
											<span className='text-xl sm:text-2xl'>{item.icon}</span>
											<span className='mt-1 text-xs font-bold sm:text-sm'>
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
									className='w-full py-3.5 text-sm sm:py-4'
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
								<h2 className='font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:text-xl'>
									Step 2: Property Location & Address
								</h2>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Where is your PG/Hostel building located?
								</p>
							</div>

							<div className='space-y-4 sm:space-y-5'>
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
														? "shadow-xs bg-emerald-600 font-bold text-white"
														: "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
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

								{/* Detailed Address */}
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
							<div className='flex items-center gap-2.5 pt-2 sm:gap-3'>
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
								<h2 className='font-satoshi text-lg font-bold text-slate-900 dark:text-white sm:text-xl'>
									Step 3: Review & Launch Property
								</h2>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Please confirm your PG/Hostel details before creating your
									dashboard.
								</p>
							</div>

							{/* Summary Card */}
							<div className='rounded-2xl border border-[#E8E3D8] bg-slate-50/70 p-4 dark:border-[#1E382B] dark:bg-[#0A1F17] sm:p-5'>
								<div className='flex items-start justify-between gap-3'>
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

								{/* Badges */}
								<div className='mt-3.5 flex flex-wrap gap-2 border-t border-[#E8E3D8] pt-3 text-xs dark:border-[#1E382B]'>
									<span className='inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
										{type === "PG" ? "🏠" : "🏢"} {getTypeLabel(type)}
									</span>
									<span className='inline-flex items-center gap-1 rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300'>
										👥 {getGenderLabel(gender)}
									</span>
								</div>

								{/* Details Table */}
								<div className='mt-3.5 space-y-2 border-t border-[#E8E3D8] pt-3 text-xs dark:border-[#1E382B]'>
									<div className='flex items-start justify-between gap-2'>
										<span className='text-slate-500 dark:text-slate-400'>
											Full Address
										</span>
										<span className='text-right font-medium text-slate-800 dark:text-slate-200'>
											{address}
										</span>
									</div>
									<div className='flex items-center justify-between'>
										<span className='text-slate-500 dark:text-slate-400'>
											Registered Owner
										</span>
										<span className='font-medium text-slate-800 dark:text-slate-200'>
											{ownerName}
										</span>
									</div>
								</div>
							</div>

							{/* Callout Notice */}
							<div className='flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200 sm:p-3.5'>
								<span className='text-base'>💡</span>
								<p className='leading-relaxed'>
									Your initial PG/Hostel record will be saved securely. Room
									allocations, floor plans, and resident check-ins can be
									configured directly from your dashboard next.
								</p>
							</div>

							{/* Final Action Buttons */}
							<div className='flex items-center gap-2.5 pt-2 sm:gap-3'>
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
									Confirm & Launch PG/Hostel
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
