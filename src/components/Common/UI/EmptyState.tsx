import React from "react";

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description: string;
	action?: React.ReactNode;
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className = "",
}: EmptyStateProps) {
	return (
		<div
			className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center dark:border-slate-800 dark:bg-slate-900/50 sm:p-12 ${className}`}
		>
			<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'>
				{icon || (
					<svg
						className='h-6 w-6'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth='1.5'
							d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
						/>
					</svg>
				)}
			</div>
			<h4 className='text-base font-semibold text-slate-900 dark:text-white sm:text-lg'>
				{title}
			</h4>
			<p className='mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400'>
				{description}
			</p>
			{action && <div className='mt-6'>{action}</div>}
		</div>
	);
}
