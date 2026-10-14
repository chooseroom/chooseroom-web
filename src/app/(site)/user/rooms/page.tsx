import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import RoomsPageClient from "@/components/User/Rooms/RoomsPageClient";

export const metadata: Metadata = {
	title: "Rooms & Beds | ChooseBed",
	description:
		"Manage floor-wise room layouts, bed inventory, and sharing configurations for your PG/Hostel.",
};

export const dynamic = "force-dynamic";

export default async function RoomsPage() {
	// 1. Session guard
	const session = await getAuthSession();
	if (!session?.user?.id) {
		redirect("/auth/signin");
	}
	if (session.user.role === "ADMIN") {
		redirect("/admin");
	}

	// 2. Authoritative DB check
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			name: true,
			status: true,
			setupCompleted: true,
			properties: {
				select: {
					id: true,
					name: true,
					city: true,
					area: true,
					type: true,
					gender: true,
					rooms: {
						orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
						include: {
							beds: {
								orderBy: { bedNumber: "asc" },
								select: { id: true, bedNumber: true, status: true },
							},
						},
					},
				},
				orderBy: { createdAt: "asc" },
			},
		},
	});

	if (!dbUser) {
		redirect("/auth/signin");
	}
	if (dbUser.status === "SUSPENDED") {
		redirect("/auth/signin?error=AccountSuspended");
	}
	if (!dbUser.setupCompleted || dbUser.properties.length === 0) {
		redirect("/user/setup");
	}

	return <RoomsPageClient properties={dbUser.properties} />;
}
