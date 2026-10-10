import { authOptions } from "@/libs/auth";
import { prisma } from "@/libs/prismaDb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
	const session = await getServerSession(authOptions);
	const user = session?.user;

	if (!user) {
		return NextResponse.json("Unauthorized", { status: 401 });
	}

	try {
		const keys = await prisma.apiKey.findMany({
			where: {
				userId: user.id,
			},
		});
		return NextResponse.json(keys, { status: 200 });
	} catch (error) {
		return new NextResponse("Something went wrong", { status: 500 });
	}
}
