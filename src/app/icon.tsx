import { ImageResponse } from "next/og";

export const size = {
	width: 32,
	height: 32,
};
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#0B2B20",
				borderRadius: 8,
			}}
		>
			<svg
				width='22'
				height='22'
				viewBox='0 0 32 32'
				fill='none'
				xmlns='http://www.w3.org/2000/svg'
			>
				<path
					d='M22.8 10.4C21 8.2 18.2 7 15.2 7C9.9 7 5.6 11 5.6 16.2C5.6 21.4 9.9 25.4 15.2 25.4C19.4 25.4 23 22.8 24.2 19'
					stroke='#FFFFFF'
					strokeWidth='3.2'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
				<path
					d='M15.2 12C12.7 12 10.7 13.9 10.7 16.2C10.7 18.5 12.7 20.4 15.2 20.4C17.7 20.4 19.7 18.5 19.7 16.2V15.8H15.2'
					stroke='#34D399'
					strokeWidth='2.8'
					strokeLinecap='round'
					strokeLinejoin='round'
				/>
				<path d='M23.6 8L25.8 10.2L23.6 12.4L21.4 10.2Z' fill='#E5A83B' />
			</svg>
		</div>,
		{
			...size,
		}
	);
}
