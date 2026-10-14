import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";

export interface SystemNotification {
	id: string;
	title: string;
	description: string;
	timestamp: string;
	type: "info" | "success" | "warning" | "security";
	link: string;
	category: "property" | "owner" | "system" | "security";
}

export async function GET() {
	try {
		const session = await getServerSession(authOptions);
		if (!session?.user?.email) {
			return NextResponse.json(
				{ message: "Authentication required" },
				{ status: 401 }
			);
		}

		const dbUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ email: session.user.email },
					...(session.user.id ? [{ id: session.user.id }] : []),
				],
			},
			include: {
				properties: true,
			},
		});

		if (!dbUser) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		const notifications: SystemNotification[] = [];

		if (dbUser.role === "ADMIN") {
			// 1. Recent Registered Owners (latest 4)
			const recentOwners = await prisma.user.findMany({
				where: { role: "BUSINESS_OWNER" },
				orderBy: { createdAt: "desc" },
				take: 4,
				select: {
					id: true,
					name: true,
					phone: true,
					email: true,
					setupCompleted: true,
					createdAt: true,
				},
			});

			for (const owner of recentOwners) {
				const ownerLabel =
					owner.name || owner.phone || owner.email || "New Owner";
				notifications.push({
					id: `owner-${owner.id}`,
					title: `New PG/Hostel Owner Registered`,
					description: `${ownerLabel} registered with phone ${owner.phone || "N/A"}. Setup is ${owner.setupCompleted ? "completed" : "pending"}.`,
					timestamp: owner.createdAt.toISOString(),
					type: "info",
					link: `/admin/owners/${owner.id}`,
					category: "owner",
				});
			}

			// 2. Recent Properties Configured (latest 4)
			const recentProperties = await prisma.property.findMany({
				orderBy: { createdAt: "desc" },
				take: 4,
				include: {
					owner: {
						select: { name: true, phone: true },
					},
				},
			});

			for (const prop of recentProperties) {
				const typeLabel =
					prop.type === "BOTH"
						? "Both PG & Hostel"
						: prop.type === "HOSTEL"
							? "Hostel"
							: "PG";
				notifications.push({
					id: `prop-${prop.id}`,
					title: `New Property Onboarded: ${prop.name}`,
					description: `${typeLabel} in ${prop.area ? `${prop.area}, ` : ""}${prop.city} by ${prop.owner?.name || "Owner"}.`,
					timestamp: prop.createdAt.toISOString(),
					type: "success",
					link: "/admin/properties",
					category: "property",
				});
			}

			// 3. Recent Security Audit Actions (latest 3)
			const recentLogs = await prisma.adminAuditLog.findMany({
				orderBy: { createdAt: "desc" },
				take: 3,
			});

			for (const log of recentLogs) {
				notifications.push({
					id: `log-${log.id}`,
					title: `Security Action: ${log.action.replace(/_/g, " ")}`,
					description:
						log.details || `Admin performed ${log.action} on account.`,
					timestamp: log.createdAt.toISOString(),
					type: "security",
					link: "/admin/activity",
					category: "security",
				});
			}

			// 4. Default Admin System Notification if list is small
			notifications.push({
				id: "admin-system-status",
				title: "ChooseBed System Health Active",
				description:
					"Database connected, multi-tenant PG/Hostel architecture operational.",
				timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
				type: "info",
				link: "/admin/settings",
				category: "system",
			});
		} else {
			// BUSINESS OWNER NOTIFICATIONS
			if (dbUser.properties && dbUser.properties.length > 0) {
				for (const prop of dbUser.properties) {
					const typeLabel =
						prop.type === "BOTH"
							? "Both PG & Hostel"
							: prop.type === "HOSTEL"
								? "Hostel"
								: "PG";
					notifications.push({
						id: `owner-prop-${prop.id}`,
						title: `Property Live: ${prop.name}`,
						description: `Your ${typeLabel} property in ${prop.city} is configured and ready for room setup.`,
						timestamp: prop.createdAt.toISOString(),
						type: "success",
						link: "/user",
						category: "property",
					});
				}
			} else {
				notifications.push({
					id: "owner-action-required",
					title: "Action Required: Complete Initial PG/Hostel Setup",
					description:
						"Your owner account is active. Complete first-time property setup to activate your dashboard.",
					timestamp: dbUser.createdAt.toISOString(),
					type: "warning",
					link: "/user/setup",
					category: "property",
				});
			}

			// Account verification notice
			notifications.push({
				id: `owner-welcome-${dbUser.id}`,
				title: "Welcome to ChooseBed",
				description:
					"Your business owner account is verified. Manage your PG/Hostel properties and rooms effortlessly.",
				timestamp: dbUser.createdAt.toISOString(),
				type: "info",
				link: "/user/account-settings",
				category: "system",
			});

			// Future feature roadmap notification
			notifications.push({
				id: "owner-roadmap-notice",
				title: "Rooms & Resident Management Modules",
				description:
					"Advanced room allocation and resident check-ins are rolling out in the next update.",
				timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
				type: "info",
				link: "/user",
				category: "system",
			});
		}

		// Sort all notifications by timestamp descending
		notifications.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);

		return NextResponse.json({
			notifications,
			count: notifications.length,
		});
	} catch (error: any) {
		console.error("Failed to fetch notifications:", error);
		return NextResponse.json(
			{ message: "Failed to fetch notifications", error: error?.message },
			{ status: 500 }
		);
	}
}
