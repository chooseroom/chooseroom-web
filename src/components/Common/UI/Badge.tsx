import React from "react";

export type BadgeVariant =
	| "available"
	| "occupied"
	| "maintenance"
	| "paid"
	| "pending"
	| "overdue"
	| "neutral"
	| "primary"
	| "success";

interface BadgeProps {
	variant?: BadgeVariant;
	size?: "sm" | "md";
	children: React.ReactNode;
	className?: string;
	dot?: boolean;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> =
	{
		available: {
			container:
				"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
			dot: "bg-emerald-500",
		},
		occupied: {
			container:
				"bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
			dot: "bg-amber-500",
		},
		maintenance: {
			container:
				"bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
			dot: "bg-slate-400",
		},
		paid: {
			container:
				"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
			dot: "bg-emerald-500",
		},
		pending: {
			container:
				"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
			dot: "bg-amber-500",
		},
		overdue: {
			container:
				"bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
			dot: "bg-rose-500",
		},
		neutral: {
			container:
				"bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
			dot: "bg-slate-400",
		},
		primary: {
			container:
				"bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
			dot: "bg-indigo-500",
		},
		success: {
			container:
				"bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
			dot: "bg-emerald-500",
		},
	};

export function Badge({
	variant = "neutral",
	size = "md",
	children,
	className = "",
	dot = true,
}: BadgeProps) {
	const current = variantStyles[variant] || variantStyles.neutral;
	const sizeClasses =
		size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-0.5 text-xs";

	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide ${sizeClasses} ${current.container} ${className}`}
		>
			{dot && <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} />}
			{children}
		</span>
	);
}
