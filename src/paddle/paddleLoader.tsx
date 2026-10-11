"use client";
import Script from "next/script";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

declare global {
	interface Window {
		Paddle: any;
	}
}

/**
 * PaddleLoader — initialises the Paddle.js SDK.
 *
 * SECURITY: The original implementation called signIn("fetchSession", { email })
 * after a successful checkout to refresh the session. The fetchSession provider
 * has been removed because it was a critical authentication bypass.
 *
 * Instead, we now use the NextAuth session `update()` mechanism which triggers
 * the JWT callback with `trigger === "update"`. The callback re-fetches billing
 * fields from the database server-side, so no client-supplied data is trusted.
 */
export function PaddleLoader() {
	const { update } = useSession();

	const loadPaddle = () => {
		if (typeof window !== "undefined") {
			window?.Paddle?.Environment.set("sandbox");
			window.Paddle.Initialize({
				token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
				eventCallback: function (event: any) {
					if (
						event.name === "checkout.completed" &&
						event.data.status === "completed"
					) {
						// Trigger a server-side session refresh.
						// The JWT callback re-fetches billing fields from the DB.
						update()
							.then(() => {
								toast.success("Subscription created successfully");
							})
							.catch(() => {
								toast.error("Session refresh failed. Please reload the page.");
							});
					}
				},
			});
		}
	};

	return (
		<Script
			src='https://cdn.paddle.com/paddle/v2/paddle.js'
			onLoad={() => {
				loadPaddle();
			}}
		/>
	);
}
