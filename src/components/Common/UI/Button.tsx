import React from "react";

export type ButtonVariant =
	"primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
	icon?: React.ReactNode;
	children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
	primary:
		"bg-[#0B2B20] text-white hover:bg-[#133E2F] dark:bg-emerald-500 dark:text-[#071711] dark:hover:bg-emerald-400 shadow-sm focus:ring-[#0B2B20]",
	secondary:
		"bg-amber-600 text-white hover:bg-amber-700 shadow-sm focus:ring-amber-500",
	outline:
		"border border-[#D9D3C7] bg-white text-slate-800 hover:bg-[#F4EFEA] dark:border-[#1E3A2F] dark:bg-[#0B1E17] dark:text-slate-200 dark:hover:bg-[#133E2F] focus:ring-emerald-500",
	ghost:
		"bg-transparent text-slate-700 hover:bg-[#F4EFEA] dark:text-slate-200 dark:hover:bg-[#133E2F] focus:ring-emerald-500",
	danger:
		"bg-rose-600 text-white hover:bg-rose-700 shadow-sm focus:ring-rose-500",
};

const sizeClasses: Record<ButtonSize, string> = {
	sm: "h-9 px-3 text-xs font-medium rounded-lg gap-1.5",
	md: "h-11 px-4 text-sm font-medium rounded-lg gap-2",
	lg: "h-12 px-6 text-base font-medium rounded-xl gap-2.5",
};

export function Button({
	variant = "primary",
	size = "md",
	isLoading = false,
	icon,
	children,
	className = "",
	disabled,
	...props
}: ButtonProps) {
	return (
		<button
			disabled={disabled || isLoading}
			className={`inline-flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
			{...props}
		>
			{isLoading ? (
				<svg
					className='h-4 w-4 animate-spin text-current'
					xmlns='http://www.w3.org/2000/svg'
					fill='none'
					viewBox='0 0 24 24'
				>
					<circle
						className='opacity-25'
						cx='12'
						cy='12'
						r='10'
						stroke='currentColor'
						strokeWidth='4'
					/>
					<path
						className='opacity-75'
						fill='currentColor'
						d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
					/>
				</svg>
			) : (
				icon && <span className='shrink-0'>{icon}</span>
			)}
			<span>{children}</span>
		</button>
	);
}
