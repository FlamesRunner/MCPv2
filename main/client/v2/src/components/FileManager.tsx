import React from "react";

type FileManagerProps = {
	show: boolean;
	close: () => void;
};

const FileManager = ({ show, close }: FileManagerProps) => {
	if (!show) return <></>;
	return (
		<div className="fileManager">
			{/* Show file manager modal on the centre of the screen (TailwindCSS) */}
			<div
				className="fixed inset-0 flex z-10"
				style={{
					top: "80px",
				}}
			>
				<div
					className="w-full h-full flex justify-center items-center"
					style={{
						zIndex: "2",
					}}
				>
					<div className="md:w-1/2 md:h-1/2 h-full w-full md:m-8 bg-white md:rounded-md md:p-8 p-4 relative">
						<h1 className="text-2xl mb-2">File access</h1>
						<div
							id="closeFileManager"
							className="absolute top-4 right-4 cursor-pointer"
							onClick={close}
						>
							<svg
								className="fill-current text-gray-500 hover:text-gray-700"
								xmlns="http://www.w3.org/2000/svg"
								width="18"
								height="18"
								viewBox="0 0 18 18"
							>
								<path d="M14.53 4.53l-1.06-1.06L9 7.94 4.53 3.47 3.47 4.53 7.94 9l-4.47 4.47 1.06 1.06L9 10.06l4.47 4.47 1.06-1.06L10.06 9z"></path>
							</svg>
						</div>
						<p className="text-sm">
							You may generate a set of SFTP credentials to access your server
							files. Please note that generated credentials are not stored, so
							you must re-generate them if you lose them. You may do this at any
							time.
						</p>
					</div>
				</div>
				<div className="absolute inset-0 bg-gray-500 opacity-75 flex"></div>
			</div>
		</div>
	);
};

export default FileManager;
