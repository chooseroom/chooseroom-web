import { NextResponse } from "next/server";
import { prisma } from "@/libs/prismaDb";
import bcrypt from "bcrypt";
import { generateAPIKeyPayloadSchema } from "./schema";

export async function POST(request: Request) {
	const body = await request.json();
	const res = generateAPIKeyPayloadSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { email, keyName } = res.data;

	const user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		return NextResponse.json({ message: "User not found!" }, { status: 404 });
	}

	// Generate a random key
	const key = user.role as string;

	// Hash the key
	const hashedKey = await bcrypt.hash(key, 10);

	try {
		await prisma.apiKey.create({
			data: {
				name: keyName,
				key: hashedKey,
				userId: user.id,
			},
		});

		return NextResponse.json(
			{
				message: "API Key generated successfully",
				key: hashedKey,
			},
			{ status: 200 }
		);
	} catch (error) {
		return NextResponse.json(
			{ message: "Something went wrong" },
			{ status: 500 }
		);
	}
}
