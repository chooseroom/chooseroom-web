import { authOptions } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/fetch-user
 *
 * Returns billing fields for the currently authenticated user.
 *
 * SECURITY: This endpoint previously accepted an arbitrary ?email= query
 * parameter with no session check, allowing any unauthenticated caller to
 * query billing data for any registered user. It is now gated behind an active
 * session and only returns data for the session owner — the email parameter is
 * ignored in favour of the session identity.
 */
export async function GET(_req: NextRequest) {
	// Require an authenticated session
	const session = await getServerSession(authOptions);

	if (!session?.user?.email) {
		return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
	}

	try {
		const user = await prisma.user.findUnique({
			where: { email: session.user.email },
			select: {
				priceId: true,
				subscriptionId: true,
				currentPeriodEnd: true,
			},
		});

		if (!user) {
			return NextResponse.json({ message: "User not found" }, { status: 404 });
		}

		return NextResponse.json(
			{
				priceId: user.priceId,
				subscriptionId: user.subscriptionId,
				currentPeriodEnd: user.currentPeriodEnd,
			},
			{ status: 200 }
		);
	} catch (error) {
		return new NextResponse("Something went wrong", { status: 500 });
	}
}
