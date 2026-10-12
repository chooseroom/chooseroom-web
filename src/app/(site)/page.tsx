import Home from "@/components/Home";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Choose Ghar | Smart PG & Hostel Management Software India",
	description:
		"Choose Ghar is the premier PG and hostel management software for Indian owners. Effortlessly manage rooms, bed occupancy, resident records, and rent dues across single or multi-branch properties.",
	openGraph: {
		type: "website",
		title: "Choose Ghar | Smart PG & Hostel Management Software India",
		description:
			"Simple, reliable PG management software for Indian owners. Track rooms, beds, and residents in real time.",
	},
	icons: {
		icon: "/images/logo/favicon.svg",
	},
};

export default function HomePage() {
	return <Home />;
}
