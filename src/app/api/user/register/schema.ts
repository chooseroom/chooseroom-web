import { z } from "zod";
import { passwordSchema } from "../../common-schema";
import { normalizeIndianMobile } from "@/libs/formatters";

export const registerSchema = z.object({
	name: z
		.string()
		.trim()
		.min(2, { message: "Full name must be at least 2 characters long" }),
	phone: z
		.string()
		.trim()
		.refine((val) => normalizeIndianMobile(val).length === 10, {
			message: "Please enter a valid 10-digit Indian mobile number",
		}),
	email: z
		.string()
		.trim()
		.email({ message: "Invalid email format" })
		.optional()
		.or(z.literal("")),
	password: passwordSchema,
});
