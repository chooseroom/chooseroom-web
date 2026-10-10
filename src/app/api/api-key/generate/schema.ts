import { z } from "zod";

export const generateAPIKeyPayloadSchema = z.object({
	email: z.string().email(),
	keyName: z.string(),
});
