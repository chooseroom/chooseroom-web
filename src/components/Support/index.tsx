"use client";
import { useTranslations } from "next-intl";
import Breadcrumbs from "../Common/Breadcrumbs";

const Support = () => {
	const t = useTranslations("support_page");
	const tCommon = useTranslations("common");

	return (
		<section className='lg:ub-pb-22.5 overflow-hidden pb-17.5 pt-35 xl:pb-27.5'>
			{/* <!-- ===== Breadcrumb Section Start ===== --> */}
			<Breadcrumbs
				title={t("heading")}
				pages={[tCommon("home"), t("heading")]}
			/>
			{/* <!-- ===== Breadcrumb Section End ===== --> */}

			<div className='mx-auto w-full max-w-[1170px] px-4 sm:px-8 xl:px-0'>
				<div className='flex flex-col overflow-hidden rounded-2xl border border-[#E8E3D8] bg-white shadow-sm dark:border-slate-800 dark:bg-[#0B1E17] md:flex-row'>
					<div className='w-full px-6 py-12 sm:px-10 lg:px-14'>
						<form>
							<div className='mb-5 w-full'>
								<label
									htmlFor='fullName'
									className='mb-2 block font-satoshi text-sm font-semibold text-[#0B2B20] dark:text-white'
								>
									{t("form.full_name.label")}
								</label>

								<input
									type='text'
									name='fullName'
									id='fullName'
									placeholder={t("form.full_name.placeholder")}
									className='w-full rounded-xl border border-[#E8E3D8] bg-[#FBF9F5] px-4.5 py-3 text-sm text-[#0B2B20] outline-none transition-all placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:ring-2 focus:ring-[#059669]/20 dark:border-slate-700 dark:bg-[#071711] dark:text-white dark:focus:bg-[#0B1E17]'
								/>
							</div>

							<div className='mb-5 w-full'>
								<label
									htmlFor='email'
									className='mb-2 block font-satoshi text-sm font-semibold text-[#0B2B20] dark:text-white'
								>
									{t("form.email.label")}
								</label>

								<input
									type='email'
									name='email'
									id='email'
									placeholder={t("form.email.placeholder")}
									className='w-full rounded-xl border border-[#E8E3D8] bg-[#FBF9F5] px-4.5 py-3 text-sm text-[#0B2B20] outline-none transition-all placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:ring-2 focus:ring-[#059669]/20 dark:border-slate-700 dark:bg-[#071711] dark:text-white dark:focus:bg-[#0B1E17]'
								/>
							</div>

							<div className='mb-6'>
								<label
									htmlFor='message'
									className='mb-2 block font-satoshi text-sm font-semibold text-[#0B2B20] dark:text-white'
								>
									{t("form.message.label")}
								</label>

								<textarea
									name='message'
									id='message'
									rows={5}
									placeholder={t("form.message.placeholder")}
									className='w-full rounded-xl border border-[#E8E3D8] bg-[#FBF9F5] px-4.5 py-3 text-sm text-[#0B2B20] outline-none transition-all placeholder:text-slate-400 focus:border-[#059669] focus:bg-white focus:ring-2 focus:ring-[#059669]/20 dark:border-slate-700 dark:bg-[#071711] dark:text-white dark:focus:bg-[#0B1E17]'
								/>
							</div>

							<button
								type='submit'
								className='flex w-full justify-center rounded-xl bg-[#0B2B20] p-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#133E2F] dark:bg-white dark:text-[#0B2B20] dark:hover:bg-slate-100'
							>
								{t("form.submit")}
							</button>
						</form>
					</div>

					<div className='relative z-1 flex w-full max-w-[500px] flex-col items-start justify-center overflow-hidden bg-[#0B2B20] p-8 py-14 text-white dark:bg-[#071711] sm:p-12'>
						{/* Ambient Emerald & Gold Radial Glow */}
						<div className='pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl' />
						<div className='pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#E5A83B]/15 blur-3xl' />

						<div className='z-2 relative'>
							<span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300'>
								<span className='h-1.5 w-1.5 rounded-full bg-[#E5A83B]' />
								Choose Ghar Support
							</span>
							<h2 className='mt-5 font-inter text-2xl font-bold tracking-tight text-white sm:text-3xl'>
								{t("title")}
							</h2>
							<p className='mt-3 text-sm leading-relaxed text-slate-300'>
								{t("subtitle")}
							</p>

							<div className='mt-8 space-y-3 border-t border-emerald-800/40 pt-6 text-xs text-slate-300'>
								<div className='flex items-center gap-2'>
									<span className='font-bold text-[#E5A83B]'>•</span>
									<span>Quick reply within 24 hours</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='font-bold text-[#E5A83B]'>•</span>
									<span>Built specifically for Indian PG owners</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default Support;
