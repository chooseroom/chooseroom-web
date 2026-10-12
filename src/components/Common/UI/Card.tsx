import React from "react";

export function Card({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`rounded-xl border border-[#E8E3D8] bg-white shadow-sm dark:border-[#1E3A2F] dark:bg-[#0B1E17] ${className}`}
		>
			{children}
		</div>
	);
}

export function CardHeader({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`p-5 pb-2 sm:p-6 ${className}`}>{children}</div>;
}

export function CardTitle({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<h3
			className={`text-base font-semibold text-slate-900 dark:text-white sm:text-lg ${className}`}
		>
			{children}
		</h3>
	);
}

export function CardDescription({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<p
			className={`mt-1 text-sm text-slate-500 dark:text-slate-400 ${className}`}
		>
			{children}
		</p>
	);
}

export function CardContent({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function CardFooter({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`border-t border-slate-100 p-4 dark:border-slate-800 sm:px-6 ${className}`}
		>
			{children}
		</div>
	);
}
