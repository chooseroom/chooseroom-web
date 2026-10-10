import hashPassword from "@/libs/formatPassword";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";
import { updatePasswordSchema } from "./schema";

export async function POST(request: Request) {
	const body = await request.json();
	const res = updatePasswordSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { email, password } = res.data;

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		return NextResponse.json(
			{ message: "User doesn't exist" },
			{ status: 404 }
		);
	}

	const hashedPassword = await hashPassword(password);

	try {
		await prisma.user.update({
			where: { email },
			data: {
				password: hashedPassword,
				passwordResetToken: null,
				passwordResetTokenExp: null,
			},
		});

		return NextResponse.json({ message: "Password Updated" }, { status: 200 });
	} catch (error) {
		return NextResponse.json({ message: "Internal Error" }, { status: 500 });
	}
}
