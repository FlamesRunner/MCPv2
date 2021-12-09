import axios, { AxiosError } from "axios";
import React from "react";

type FileManagerProps = {
	show: boolean;
	close: () => void;
	serverId: string;
	token: string;
	serverHostname: string;
};

const FileManager = ({ show, close, serverId, token, serverHostname }: FileManagerProps) => {
	const [processing, setProcessing] = React.useState(false);
	const [password, setPassword] = React.useState("");
	const [username, setUsername] = React.useState("");
	const [message, setMessage] = React.useState("");

	const generateCredentials = async () => {
		setTimeout(() => {
			axios
				.get(
					`${process.env.REACT_APP_API_HOST}/api/v1/server/sftp/${serverId}`,
					{
						headers: {
							Authorization: `${token}`,
						},
					}
				)
				.then((response) => {
					setProcessing(false);
					setPassword(response.data.password);
					setUsername(response.data.username);
				})
				.catch((error: AxiosError) => {
					setProcessing(false);
					setMessage(error.response?.data.message || "An error occurred");
				});
		}, 1000);
	};

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
					<div className="md:w-1/2 md:h-auto h-full w-full md:m-8 bg-white md:rounded-md md:p-8 p-4 relative">
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
							time, but generating credentials will invalidate any existing ones.
						</p>
						{/* Status message */}
						{(message || password) && (
							<div
								className={`${message ? "bg-red-100 border-red-500 text-red-700" : "bg-blue-100 border-blue-500 text-blue-700"} border-l-4  transition-all relative mt-6 mb-4`}
								style={{
									opacity: (message || password) && !processing ? 1 : 0,
									visibility: (message || password) && !processing ? "visible" : "hidden",
									transition:
										"opacity 0.5s ease-in-out, visiblity 0.5s ease-in-out",
									padding: (message || password) && !processing ? "1rem" : "0",
								}}
							>
								{/* Close */}
								<button
									className="absolute top-0 right-3 p-2 text-2xl"
									onClick={() => setMessage("")}
								>
									×
								</button>

								<p className="font-bold">{message ? "Error" : "Info"}</p>
								<p>{message ? message : (
									<>
										<span className="font-bold">Host:</span> {serverHostname}
										<br />
										<span className="font-bold">Username: </span> {username}
										<br />
										<span className="font-bold">Password: </span> {password}
									</>
								)}</p>
							</div>
						)}
						<br />
						{/* Generate credentials button */}
						<button
							className={`bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 rounded ${
								processing ? "opacity-50 cursor-not-allowed" : ""
							}`}
							disabled={processing}
							onClick={() => {
								if (processing) return;
								setProcessing(true);
								generateCredentials();
							}}
						>
							{processing ? "Generating..." : "Generate credentials"}
						</button>
					</div>
				</div>
				<div className="absolute inset-0 bg-gray-500 opacity-75 flex"></div>
			</div>
		</div>
	);
};

export default FileManager;
