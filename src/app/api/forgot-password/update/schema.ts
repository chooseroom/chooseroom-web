import { z } from "zod";
import { passwordSchema } from "../../common-schema";

export const updatePasswordSchema = z.object({
	email: z.string().email(),
	password: passwordSchema,
});
