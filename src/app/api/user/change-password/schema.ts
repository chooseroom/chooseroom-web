import { z } from "zod";
import { passwordSchema } from "../../common-schema";

export const changePasswordSchema = z
	.object({
		email: z.string().email(),
		password: passwordSchema,
		currentPassword: passwordSchema,
	})
	.refine((data) => data.password !== data.currentPassword, {
		message: "New password can't be the same as currentPassword",
		path: ["password"],
	});
