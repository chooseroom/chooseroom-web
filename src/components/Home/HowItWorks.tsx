import React from "react";

const steps = [
	{
		number: "01",
		badge: "60 Seconds",
		title: "Create Your Owner Account",
		description:
			"Register with your mobile number and name. Add your PG name to get started immediately without paperwork.",
		highlight: "Quick mobile registration",
	},
	{
		number: "02",
		badge: "Set Up Rooms",
		title: "Add Your Floors & Rooms",
		description:
			"Add your building floors, choose AC or Non-AC, and set sharing types (Single, Double, Triple) with exact bed counts.",
		highlight: "Simple room and bed setup",
	},
	{
		number: "03",
		badge: "Daily Use",
		title: "Add Residents & Track Empty Beds",
		description:
			"Enter resident details, allot them to rooms, and see live empty beds from your mobile phone anytime.",
		highlight: "Instant empty bed visibility",
	},
];

const HowItWorks = () => {
	return (
		<section
			id='how-it-works'
			className='border-t border-[#E8E3D8] bg-[#F5F1EA] py-20 dark:border-slate-800 dark:bg-[#121E19] sm:py-28'
		>
			<div className='mx-auto max-w-[1170px] px-4 sm:px-8 xl:px-0'>
				<div className='mx-auto max-w-2xl text-center'>
					<span className='rounded-full border border-[#E8E3D8] bg-white px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#0B2B20] dark:border-slate-800 dark:bg-slate-900 dark:text-emerald-300'>
						3 Easy Steps
					</span>
					<h2 className='mt-4 font-inter text-3xl font-extrabold tracking-tight text-[#0B2B20] dark:text-white sm:text-4xl'>
						Up and running in three simple steps.
					</h2>
					<p className='mt-3 text-base text-[#4A5550] dark:text-slate-300'>
						A straightforward setup designed directly for Indian PG, hostel, and
						co-living owners.
					</p>
				</div>

				<div className='mt-14 grid grid-cols-1 gap-8 md:grid-cols-3'>
					{steps.map((step, index) => (
						<div
							key={index}
							className='group relative flex flex-col justify-between rounded-2xl border border-[#E8E3D8] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#D5CEBF] hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
						>
							<div>
								<div className='flex items-center justify-between'>
									<div className='font-mono flex h-12 w-12 items-center justify-center rounded-xl bg-[#0B2B20] text-base font-bold text-[#E5A83B] shadow-sm transition-transform group-hover:scale-105 dark:bg-[#133E2F]'>
										{step.number}
									</div>
									<span className='rounded-full border border-[#E8E3D8] bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'>
										{step.badge}
									</span>
								</div>

								<h3 className='mt-6 text-lg font-bold text-[#0B2B20] dark:text-white'>
									{step.title}
								</h3>

								<p className='mt-2.5 text-sm leading-relaxed text-[#4A5550] dark:text-slate-300'>
									{step.description}
								</p>
							</div>

							<div className='mt-6 border-t border-[#F0EBE0] pt-4 dark:border-slate-800'>
								<span className='flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400'>
									<svg
										className='h-3.5 w-3.5'
										fill='none'
										viewBox='0 0 24 24'
										stroke='currentColor'
										strokeWidth='2.5'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											d='M5 13l4 4L19 7'
										/>
									</svg>
									{step.highlight}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

export default HowItWorks;
