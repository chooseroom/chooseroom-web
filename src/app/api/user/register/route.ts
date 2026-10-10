import { prisma } from "@/libs/prismaDb";
import { excludeFields } from "@/utils/exclude-fields";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { registerSchema } from "./schema";

export async function POST(request: Request) {
	const body = await request.json();
	const res = registerSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { name, email, password } = res.data;

	const isUserRegistered = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserRegistered) {
		return new NextResponse("Email already exists", { status: 409 });
	}

	const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

	// Function to check if an email is in the list of admin emails
	function isAdminEmail(email: string) {
		return adminEmails.includes(email);
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	const newUser = {
		name,
		email,
		password: hashedPassword,
		role: "USER",
	};

	if (isAdminEmail(email)) {
		newUser.role = "ADMIN";
	}

	try {
		const user = await prisma.user.create({
			data: {
				...newUser,
			},
		});

		return NextResponse.json(
			{
				message: "User created successfully",
				data: excludeFields(user, [
					"password",
					"passwordResetToken",
					"passwordResetTokenExp",
				]),
			},
			{ status: 201 }
		);
	} catch (error) {
		if (error instanceof Error) {
			return NextResponse.json({ message: error.message }, { status: 500 });
		}
	}
}
