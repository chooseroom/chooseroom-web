"use client";
import { Toaster } from "react-hot-toast";

const ToastContext = () => {
	return (
		<div className='z-[99999]'>
			<Toaster
				position='top-center'
				reverseOrder={false}
				toastOptions={{
					className:
						"font-sans text-sm font-medium shadow-md border border-[#E8E3D8] dark:border-slate-800 bg-[#FBF9F5] dark:bg-[#0E1713] text-[#0B2B20] dark:text-white rounded-xl px-4 py-3",
					success: {
						duration: 4000,
						iconTheme: {
							primary: "#059669",
							secondary: "#FFFFFF",
						},
					},
					error: {
						duration: 4000,
						iconTheme: {
							primary: "#DC2626",
							secondary: "#FFFFFF",
						},
					},
				}}
			/>
		</div>
	);
};

export default ToastContext;
