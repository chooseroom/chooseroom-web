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

	const { name, email, password, phone } = res.data;

	const isUserRegistered = await prisma.user.findUnique({
		where: { email },
	});

	if (isUserRegistered) {
		return new NextResponse("Email already exists", { status: 409 });
	}

	const hashedPassword = await bcrypt.hash(password, 10);

	// SECURITY: Public registration ALWAYS assigns BUSINESS_OWNER role.
	// Admin accounts are provisioned exclusively through controlled administrative processes.
	const newUser = {
		name,
		email: email.toLowerCase().trim(),
		password: hashedPassword,
		role: "BUSINESS_OWNER",
		status: "ACTIVE",
		setupCompleted: false,
		...(phone ? { phone: phone.trim() } : {}),
	};

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
