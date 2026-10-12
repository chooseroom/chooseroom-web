import Loader from "@/components/Common/PreLoader";
import FooterWrapper from "@/components/Footer/FooterWrapper";
import { HeaderWrapper } from "@/components/Header/HeaderWrapper";
import NextTopLoader from "nextjs-toploader";
import "react-quill-new/dist/quill.snow.css";
import "../../styles/globals.css";
import "../../styles/satoshi.css";
import ToastContext from "../context/ToastContext";
import { Providers } from "./providers";

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Loader />
			<div className='isolate'>
				<ToastContext />
				<Providers>
					<NextTopLoader
						color='#34D399'
						crawlSpeed={250}
						height={3}
						showSpinner={false}
						shadow='0 0 10px #34D399,0 0 5px #E5A83B'
					/>
					<HeaderWrapper />
					<div className='isolate'>{children}</div>

					<FooterWrapper />
				</Providers>
			</div>
		</>
	);
}
