import { sendEmail } from "@/libs/email";
import { prisma } from "@/libs/prismaDb";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { resetPasswordSchema } from "./schema";

export async function POST(request: Request) {
	const body = await request.json();
	const res = resetPasswordSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { email } = res.data;

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		return NextResponse.json(
			{ message: "User doesn't exist" },
			{ status: 404 }
		);
	}


	const resetToken = crypto.randomBytes(20).toString("hex");

	const passwordResetTokenExp = new Date();
	passwordResetTokenExp.setMinutes(passwordResetTokenExp.getMinutes() + 10);

	await prisma.user.update({
		where: { email },
		data: {
			passwordResetToken: resetToken,
			passwordResetTokenExp,
		},
	});

	const resetURL = `${process.env.SITE_URL}/auth/reset-password/${resetToken}`;

	try {
		await sendEmail({
			to: email,
			subject: "Reset your password",
			html: ` 
      <div>
        <h1>You requested a password reset</h1>
        <p>Click the link below to reset your password</p>
        <a href="${resetURL}" target="_blank">Reset Password</a>
      </div>
      `,
		});

		return NextResponse.json(
			{ message: "An email has been sent to your email" },
			{
				status: 200,
			}
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "An error occurred. Please try again!" },
			{
				status: 500,
			}
		);
	}
}
