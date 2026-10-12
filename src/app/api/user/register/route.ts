import { prisma } from "@/libs/prismaDb";
import { normalizeIndianMobile } from "@/libs/formatters";
import { excludeFields } from "@/utils/exclude-fields";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { registerSchema } from "./schema";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const res = registerSchema.safeParse(body);

		if (!res.success) {
			return NextResponse.json(
				{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const { name, email, password, phone } = res.data;
		const cleanPhone = normalizeIndianMobile(phone);

		if (cleanPhone.length !== 10) {
			return NextResponse.json(
				{ message: "Please provide a valid 10-digit Indian mobile number." },
				{ status: 400 }
			);
		}

		// 1. Check if mobile number already exists
		const existingPhone = await prisma.user.findFirst({
			where: { phone: cleanPhone },
		});

		if (existingPhone) {
			return NextResponse.json(
				{
					message: "This mobile number is already registered. Please sign in.",
				},
				{ status: 409 }
			);
		}

		// 2. Determine final unique email
		const finalEmail =
			email && email.trim() !== ""
				? email.toLowerCase().trim()
				: `${cleanPhone}@pghostel.local`;

		const existingEmail = await prisma.user.findUnique({
			where: { email: finalEmail },
		});

		if (existingEmail) {
			return NextResponse.json(
				{
					message: "This email address is already registered. Please sign in.",
				},
				{ status: 409 }
			);
		}

		const hashedPassword = await bcrypt.hash(password, 10);

		// SECURITY: Public registration ALWAYS assigns BUSINESS_OWNER role.
		// Admin accounts are provisioned exclusively through controlled administrative processes.
		const newUser = {
			name: name.trim(),
			email: finalEmail,
			phone: cleanPhone,
			password: hashedPassword,
			role: "BUSINESS_OWNER",
			status: "ACTIVE",
			setupCompleted: false,
		};

		const user = await prisma.user.create({
			data: newUser,
		});

		return NextResponse.json(
			{
				message: "Owner account registered successfully. Please sign in.",
				data: excludeFields(user, [
					"password",
					"passwordResetToken",
					"passwordResetTokenExp",
				]),
			},
			{ status: 201 }
		);
	} catch (error: any) {
		return NextResponse.json(
			{ message: error?.message || "An error occurred during registration." },
			{ status: 500 }
		);
	}
}
