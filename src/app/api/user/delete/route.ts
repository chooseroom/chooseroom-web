import { authOptions } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { userDeleteSchema } from "./schema";

export async function DELETE(request: Request) {
	const body = await request.json();
	const res = userDeleteSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { email } = res.data;

	const isDemoUser = email?.includes("demo-");

	if (isDemoUser) {
		return NextResponse.json(
			{ message: "Can't delete demo user" },
			{ status: 400 }
		);
	}

	const session = await getServerSession(authOptions);

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		return NextResponse.json({ message: "User not found!" }, { status: 404 });
	}

	const isAuthorized =
		session?.user.email === user.email || user?.role === "ADMIN";

	if (!isAuthorized) {
		return NextResponse.json(
			{ message: "Unauthorized Access" },
			{ status: 401 }
		);
	}

	try {
		await prisma.user.delete({
			where: { email },
		});

		return NextResponse.json(
			{ message: "Account Deleted Successfully!" },
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Something went wrong" },
			{ status: 500 }
		);
	}
}
