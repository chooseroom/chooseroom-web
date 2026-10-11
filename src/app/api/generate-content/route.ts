import { authOptions } from "@/libs/auth";
import { getServerSession } from "next-auth";
import OpenAI from "openai";

/**
 * POST /api/generate-content
 *
 * Generates AI content using the server-side OpenAI API key.
 *
 * SECURITY: This endpoint previously had no authentication check and accepted
 * an `apiKey` field from the request body, allowing unauthenticated callers to
 * proxy arbitrary OpenAI API calls through this server, including using a
 * caller-supplied key (which is an open proxy) or falling back to the server's
 * own OPENAI_API_KEY (which is cost abuse).
 *
 * Fixes applied:
 *  1. Requires an authenticated session.
 *  2. Always uses the server-side OPENAI_API_KEY — never accepts a key from the
 *     client request body.
 */
export async function POST(req: Request) {
	// Require an authenticated session
	const session = await getServerSession(authOptions);

	if (!session?.user) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), {
			status: 401,
			headers: { "Content-Type": "application/json" },
		});
	}

	const body = await req.json();
	const { prompt } = body;

	if (!prompt) {
		return new Response(JSON.stringify({ message: "Prompt is required" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	// Always use the server-side key — never accept one from the client
	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY,
	});

	try {
		const chatCompletion = await openai.chat.completions.create({
			messages: prompt,
			model: "gpt-3.5-turbo",
			temperature: 1,
			top_p: 1,
			frequency_penalty: 0,
			presence_penalty: 0,
		});

		const generatedContent = chatCompletion.choices[0].message?.content;

		return new Response(JSON.stringify(generatedContent));
	} catch (error: any) {
		return new Response(
			JSON.stringify(error?.error?.message ?? "OpenAI request failed"),
			{ status: 500 }
		);
	}
}
