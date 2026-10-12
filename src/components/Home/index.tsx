import React from "react";
import Hero from "./Hero";
import { PainPoints } from "./PainPoints";
import Features from "./Features";
import { Roadmap } from "./Roadmap";
import HowItWorks from "./HowItWorks";
import FAQ from "./FAQ";
import CTA from "./CTA";

const Home = () => {
	return (
		<main className='min-h-screen bg-[#FBF9F5] dark:bg-[#0E1713]'>
			<Hero />
			<PainPoints />
			<Features />
			<Roadmap />
			<HowItWorks />
			<FAQ />
			<CTA />
		</main>
	);
};

export default Home;
