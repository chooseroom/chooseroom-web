import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: {
		default: "Choose Ghar | Smart PG & Hostel Management Software India",
		template: "%s | Choose Ghar",
	},
	description:
		"Choose Ghar is the premier PG and hostel management platform for Indian property owners. Seamlessly manage rooms, track vacant beds, record tenant details, and prevent revenue loss.",
	keywords: [
		"PG management software India",
		"Hostel management software",
		"Paying guest management system",
		"PG room bed allocation",
		"PG tenant record software",
		"Co-living management software India",
		"Choose Ghar",
	],
	icons: {
		icon: "/images/logo/favicon.svg",
	},
};

export default async function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html lang={locale} suppressHydrationWarning={true}>
			<body
				className={`${inter.className} flex min-h-screen flex-col bg-[#FBF9F5] text-[#2D3732] antialiased selection:bg-[#34D399]/20 selection:text-[#0B2B20] dark:bg-[#0E1713] dark:text-slate-200 dark:selection:bg-[#34D399]/30 dark:selection:text-emerald-300`}
			>
				<NextIntlClientProvider messages={messages}>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
