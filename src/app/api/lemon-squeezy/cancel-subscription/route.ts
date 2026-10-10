import { lemonSqueezyCancelSubscriptionSchema } from "./schema";
// https://api.lemonsqueezy.com/v1/subscriptions/{subscription_id}

import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";

async function POST(req: NextRequest) {
	const body = await req.json();
	const res = lemonSqueezyCancelSubscriptionSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { subscriptionId } = res.data;

	try {
		const { data } = await axios.delete(
			`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`,
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.LEMON_SQUEEZY_API_KEY}`,
				},
			}
		);

		return NextResponse.json(
			{ message: "Subscription canceled successfully", data },
			{ status: 200 }
		);
	} catch (error) {
		if (error instanceof AxiosError) {
			return NextResponse.json(
				{ error: error.response?.data.error.detail },
				{ status: error.response?.status }
			);
		}

		return NextResponse.json(
			{ message: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export { POST };
