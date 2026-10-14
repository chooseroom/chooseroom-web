import React from "react";
import Signin from "@/components/Auth/Signin";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Sign in | ChooseBed",
	description: "Sign in to your ChooseBed account.",
};

const SigninPage = () => {
	return (
		<main className='pt-[150px]'>
			<Signin />
		</main>
	);
};

export default SigninPage;
