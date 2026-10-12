"use client";
import { useId, useState } from "react";

export default function InputGroup(props: any) {
	const {
		name,
		label,
		value,
		type,
		placeholder,
		handleChange,
		height = "52px",
		required,
		maxlength,
	} = props;
	const [inputType, setInputType] = useState(type);
	const id = useId();

	return (
		<>
			<label
				htmlFor={id}
				className='mb-2.5 block font-satoshi text-base font-medium text-dark dark:text-white'
			>
				{label} {required && <span className='text-red-500'>*</span>}
			</label>

			<div className='relative'>
				<input
					id={id}
					type={inputType}
					placeholder={placeholder}
					value={value}
					onChange={handleChange}
					name={name}
					className={`w-full rounded-lg border border-gray-3 px-5.5 py-3 text-dark outline-none ring-offset-1 duration-300 focus:shadow-input focus:ring-primary/20 dark:border-stroke-dark dark:bg-transparent dark:text-white dark:focus:border-transparent ${
						type === "password" ? "pr-12" : ""
					}`}
					style={{ height }}
					required={required}
					maxLength={maxlength}
				/>
				{type === "password" && (
					<button
						type='button'
						tabIndex={-1}
						title={inputType === "password" ? "Show password" : "Hide password"}
						aria-label={
							inputType === "password" ? "Show password" : "Hide password"
						}
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							setInputType(inputType === "password" ? "text" : "password");
						}}
						className='absolute inset-y-0 right-0 z-10 flex cursor-pointer items-center pr-4 text-body transition-colors hover:text-dark focus:outline-none dark:text-gray-6 dark:hover:text-white'
					>
						{inputType === "password" ? (
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='1.8'
								aria-hidden='true'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z'
								/>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
								/>
							</svg>
						) : (
							<svg
								className='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
								strokeWidth='1.8'
								aria-hidden='true'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
								/>
							</svg>
						)}
					</button>
				)}
			</div>
		</>
	);
}
