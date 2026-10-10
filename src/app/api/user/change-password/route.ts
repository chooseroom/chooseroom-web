import { prisma } from "@/libs/prismaDb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { changePasswordSchema } from "./schema";

export async function POST(request: Request) {
	const body = await request.json();
	const res = changePasswordSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { email, currentPassword, password } = res.data;

	const user = await prisma.user.findUnique({
		where: {
			email,
		},
	});

	if (!user) {
		return NextResponse.json({ message: "User not found!" }, { status: 404 });
	}

	// check to see if passwords match
	const passwordMatch = await bcrypt.compare(
		currentPassword,
		user?.password as string
	);

	if (!passwordMatch) {
		return NextResponse.json(
			{ message: "Current password is incorrect." },
			{ status: 400 }
		);
	}

	const isDemo = user?.email?.includes("demo-");

	if (isDemo) {
		return NextResponse.json(
			{ message: "Can't change password for demo user" },
			{ status: 401 }
		);
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	try {
		await prisma.user.update({
			where: { email },
			data: {
				password: hashedPassword,
			},
		});

		return NextResponse.json({ message: "Password Updated" }, { status: 200 });
	} catch (error) {
		return new NextResponse("Something went wrong", { status: 500 });
	}
}
