import axios, { AxiosError } from "axios";
import { NextRequest, NextResponse } from "next/server";
import { paddleCancelSubscriptionSchema } from "./schema";

async function POST(req: NextRequest) {
	const body = await req.json();
	const res = paddleCancelSubscriptionSchema.safeParse(body);

	if (!res.success) {
		return NextResponse.json(
			{ message: "Invalid Payload", errors: res.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}

	const { subscriptionId } = res.data;

	try {
		const { data } = await axios.post(
			`${process.env.NEXT_PUBLIC_PADDLE_API_URL}/subscriptions/${subscriptionId}/cancel`,
			{
				effective_from: "immediately",
			},
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
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
				{
					message: "An error occurred",
					error: error.response?.data.error.detail,
				},
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
