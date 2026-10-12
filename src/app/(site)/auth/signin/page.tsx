import React from "react";
import Signin from "@/components/Auth/Signin";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign in",
	description: "Sign in to your Choose Ghar account.",
};

const SigninPage = () => {
	return (
		<main className='pt-[150px]'>
			<Signin />
		</main>
	);
};

export default SigninPage;
