import { getAuthSession } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ResidentsPageClient from "@/components/User/Residents/ResidentsPageClient";

export const metadata: Metadata = {
	title: "Residents Management | ChooseBed",
	description:
		"Manage resident profiles, bed allocations, and check-in records.",
};

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
	// 1. Authoritative session verification
	const session = await getAuthSession();
	if (!session?.user?.id) {
		redirect("/auth/signin");
	}

	if (session.user.role === "ADMIN") {
		redirect("/admin");
	}

	// 2. Query user, account status, and registered properties
	const dbUser = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			status: true,
			setupCompleted: true,
			properties: {
				orderBy: { createdAt: "asc" },
				include: {
					rooms: {
						orderBy: [{ floor: "asc" }, { roomNumber: "asc" }],
						include: {
							beds: {
								orderBy: { bedNumber: "asc" },
								select: {
									id: true,
									bedNumber: true,
									status: true,
								},
							},
						},
					},
				},
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

	// 3. Query all residents for this owner's properties
	const residents = await prisma.resident.findMany({
		where: {
			property: {
				ownerId: session.user.id,
			},
		},
		orderBy: [{ status: "asc" }, { checkInDate: "desc" }],
		include: {
			property: {
				select: {
					id: true,
					name: true,
					city: true,
					area: true,
				},
			},
			room: {
				select: {
					id: true,
					roomNumber: true,
					floor: true,
					sharing: true,
					acType: true,
					rentPerBed: true,
				},
			},
			bed: {
				select: {
					id: true,
					bedNumber: true,
					status: true,
				},
			},
		},
	});

	return (
		<ResidentsPageClient
			properties={dbUser.properties}
			initialResidents={residents}
		/>
	);
}
