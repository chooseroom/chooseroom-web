import hashPassword from "@/libs/formatPassword";
import { prisma } from "@/libs/prismaDb";
import { stripe } from "@/stripe/stripe";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: Request) {
	const body = await request.text();
	const signature = (await headers()).get("Stripe-Signature") ?? "";

	let event: Stripe.Event;

	try {
		event = stripe.webhooks.constructEvent(
			body,
			signature,
			process.env.STRIPE_WEBHOOK_SECRET || ""
		);
	} catch (err) {
		return new Response(
			`Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
			{ status: 400 }
		);
	}

	const session = event.data.object as Stripe.Checkout.Session;
	const email = session.customer_details?.email?.toLowerCase() as string;

	if (!email) {
		return new Response(null, {
			status: 200,
		});
	}

	// when first purchased
	if (event.type === "checkout.session.completed") {
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string
		);

		// Update the price id and set the new period end.
		const exist = await prisma.user.findUnique({
			where: {
				email,
			},
		});

		const formatedPassword = await hashPassword("guset-user");

		if (!exist) {
			await prisma.user.create({
				data: {
					name: "guest",
					email,
					password: formatedPassword,
					subscriptionId: subscription.id,
					customerId: subscription.customer as string,
					priceId: subscription.items.data[0].price.id,
					currentPeriodEnd: new Date(subscription.current_period_end * 1000),
				},
			});
		} else {
			await prisma.user.update({
				where: {
					email: session.customer_details?.email as string,
				},
				data: {
					subscriptionId: subscription.id,
					customerId: subscription.customer as string,
					priceId: subscription.items.data[0].price.id,
					currentPeriodEnd: new Date(subscription.current_period_end * 1000),
				},
			});
		}
	}

	// when renewed the subscription
	if (event.type === "invoice.payment_succeeded") {
		// Retrieve the subscription details from Stripe.
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string
		);

		// Update the price id and set the new period end.
		await prisma.user.update({
			where: {
				subscriptionId: subscription.id,
			},
			data: {
				priceId: subscription.items.data[0].price.id,
				currentPeriodEnd: new Date(subscription.current_period_end * 1000),
			},
		});
	}

	// When a payment fails (subscription expires)
	if (event.type === "customer.subscription.updated") {
		const subscription = await stripe.subscriptions.retrieve(
			session.subscription as string
		);

		await prisma.user.update({
			where: {
				subscriptionId: subscription.id,
			},
			data: {
				currentPeriodEnd: subscription?.current_period_end
					? new Date(subscription.current_period_end * 1000)
					: null,
				subscriptionId: null,
				priceId: null,
			},
		});
	}

	revalidatePath("/user/billing");

	return new Response(null, { status: 200 });
}
