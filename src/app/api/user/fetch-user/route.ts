import { prisma } from "@/libs/prismaDb";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
	const encodedEmail = req.nextUrl.searchParams.get("email");
	const email = decodeURIComponent(encodedEmail || "");

	if (!email) {
		return NextResponse.json({ message: "Email is required" }, { status: 400 });
	}

	const res = z.string().email().safeParse(email);

	if (!res.success) {
		return NextResponse.json({ message: "Invalid email" }, { status: 400 });
	}

	try {
		const user = await prisma.user.findUnique({
			where: { email },
		});

		return NextResponse.json(
			{
				priceId: user?.priceId,
				subscriptionId: user?.subscriptionId,
				currentPeriodEnd: user?.currentPeriodEnd,
			},
			{ status: 200 }
		);
	} catch (error) {
		return new NextResponse("Something went wrong", { status: 500 });
	}
}
