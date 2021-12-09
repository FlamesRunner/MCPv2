import axios, { AxiosResponse } from "axios";
import React, {
	ChangeEvent,
	useEffect,
	useState,
} from "react";
import "../assets/styles/FMInterface.css";

type FMProps = {
	host: string;
	username: string;
	password: string;
	token: string;
	close: () => void;
};

type IInode = {
	name: string;
	type: "d" | "-" | "l";
	size: number;
	modifyTime: number;
	accessTime: number;
	owner: number;
	group: number;
	rights: {
		user: string;
		group: string;
		other: string;
	};
};

const INodeTypes = {
	d: "Directory",
	l: "Symbolic Link",
	"-": "File",
	s: "Socket",
};

const formatFileSize = (bytes: number) => {
	const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	let i = 0;
	while (bytes >= 1024) {
		bytes /= 1024;
		++i;
	}
	return `${bytes.toFixed(1) + units[i]}`;
};

const downloadFile = (
	host: string,
	username: string,
	password: string,
	token: string,
	path: string,
	filename: string
) => {
	const url = `${process.env.REACT_APP_API_HOST}/api/v1/sftp/download?path=${path}&fileName=${filename}&username=${username}&password=${password}&host=${host}`;
	axios({
		url,
		method: "GET",
		responseType: "blob",
		headers: {
			"Content-Type": "application/json",
			Authorization: `${token}`,
		},
	}).then((response: AxiosResponse) => {
		const blob = new Blob([response.data], {
			type: "application/octet-stream",
		});
		const url = window.URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute("download", filename);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	});
};

const deleteFile = (
	host: string,
	username: string,
	password: string,
	token: string,
	path: string
): Promise<AxiosResponse> => {
	const url = `${process.env.REACT_APP_API_HOST}/api/v1/sftp/rm`;
	console.log(token);
	return axios.post(
		url,
		{
			path,
			username: username,
			password: password,
			host: host,
		},
		{
			headers: {
				"Content-Type": "application/json",
				Authorization: `${token}`,
			},
		}
	);
};

const FMInterface = ({ host, username, password, close, token }: FMProps) => {
	const [fileListing, setFileListing] = useState<IInode[]>([]);
	const [currentPath, setCurrentPath] = useState<string>("/");
	const [loading, setLoading] = useState<boolean>(true);
	const [uploading, setUploading] = useState<string>("");
	const [selectedFile, setSelectedFile] = useState<string>("");
	useEffect(() => {
		// Get the file listing
		axios
			.post(
				`${process.env.REACT_APP_API_HOST}/api/v1/sftp/ls`,
				{
					host: host,
					username: username,
					password: password,
					path: currentPath,
				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: token,
					},
				}
			)
			.then((res) => {
				const files: IInode[] = res.data?.data || [];
				setFileListing(files);
			})
			.catch((err) => {
				console.log(err);
			})
			.finally(() => {
				setLoading(false);
			});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, currentPath, selectedFile]);

	return (
		<div className="fileManagerInterface">
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
						<h1 className="text-2xl mb-6">File manager</h1>
						<div
							id="closeFileManager"
							className="absolute top-4 right-4 cursor-pointer"
							onClick={() => {
								setFileListing([]);
								setCurrentPath("/");
								close();
							}}
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
						{loading ? (
							<>
								<h3 className="text-xl text-center">
									{uploading
										? `Your file, ${uploading}, is being uploaded`
										: "Fetching file listing..."}
								</h3>
								<div className="flex justify-center mt-8">
									<img
										src="/loading.gif"
										alt="Loading..."
										style={{
											width: "64px",
										}}
									/>
								</div>
							</>
						) : (
							<div>
								<input
									className="hidden"
									type="file"
									id="fileUpload"
									onChange={(e: ChangeEvent<HTMLInputElement>) => {
										const file = e.target.files && e.target.files[0];
										if (!file) return;
										setLoading(true);
										setUploading(
											file.name + " (" + formatFileSize(file.size) + ")"
										);
										const formData = new FormData();
										formData.append("file", file);
										formData.append("fileName", file.name);
										formData.append("host", host);
										formData.append("username", username);
										formData.append("password", password);
										formData.append("path", currentPath);
										formData.append("token", token);
										axios
											.post(
												`${process.env.REACT_APP_API_HOST}/api/v1/sftp/upload`,
												formData,
												{
													headers: {
														"Content-Type": "multipart/form-data",
														Authorization: token,
													},
												}
											)
											.catch((err) => {
												console.log(err);
											})
											.finally(() => {
												setLoading(false);
												setUploading("");
											});
									}}
								/>
								<div className="w-full grid grid-cols-2 gap-2">
									<div
										className="w-full mb-4 bg-gray-200 p-2 cursor-pointer rounded-md hover:bg-gray-300"
										onClick={() => {
											// Show upload dialog
											const fileUpload = document.getElementById(
												"fileUpload"
											) as HTMLInputElement;
											fileUpload.click();
										}}
									>
										<p className="text-sm text-gray-600 text-center">
											Upload file
										</p>
									</div>
									<div
										className="mb-4 bg-gray-200 mr-3 p-2 cursor-pointer rounded-md hover:bg-gray-300"
										onClick={() => {
											setLoading(true);
											let path = currentPath.split("/").slice(0, -2).join("/");
											if (path.charAt(0) !== "/") {
												path = "/" + path;
											}
                                            setSelectedFile("");
											setCurrentPath(path);
										}}
									>
										<p className="text-sm text-gray-600 text-center">
											Go up one level
										</p>
									</div>
								</div>
								<div className="w-full grid grid-cols-2 gap-2">
									<div
										className="mb-4 w-full h-9 bg-green-400 overflow-x-auto p-2 cursor-pointer rounded-md hover:bg-green-500"
										onClick={() => {
											downloadFile(
												host,
												username,
												password,
												token,
												currentPath,
												selectedFile.substring(
                                                    selectedFile.lastIndexOf("/") + 1
                                                )
											);
										}}
										style={{
											display: selectedFile ? "block" : "none",
										}}
									>
										<p className="text-sm text-white text-center">
											Download {selectedFile.substring(selectedFile.lastIndexOf("/") + 1, selectedFile.length)}
										</p>
									</div>
									<div
										className="mb-4 bg-red-500 h-9 overflow-x-auto mr-3 p-2 cursor-pointer rounded-md hover:bg-red-600"
										onClick={() => {
											setLoading(true);
											deleteFile(
												host,
												username,
												password,
												token,
												selectedFile
											).finally(() => {
												setLoading(false);
												setSelectedFile("");
											});
										}}
										style={{
											display: selectedFile ? "block" : "none",
										}}
									>
										<p className="text-sm text-white text-center">Delete</p>
									</div>
								</div>
								<div className="flex flex-wrap overflow-y-auto file-listing pb-1">
									{fileListing.map((file) => {
										return (
											<div
												key={file.name + file.size + file.accessTime + file.modifyTime}
												className={`w-full md:w-1/3 pr-3 pb-3 ${
													file.type === "d" || file.type === "-"
														? "cursor-pointer"
														: ""
												}`}
												onClick={() => {
													if (file.type === "-") {
														setSelectedFile(currentPath + file.name);
													} else if (file.type === "d") {
														setLoading(true);
														setCurrentPath(`${currentPath}${file.name}/`);
														setSelectedFile("");
													}
												}}
											>
												<div
													className={`bg-gray-200 rounded-lg p-2 overflow-x-auto ${
														file.type === "d" || file.type === "-"
															? "hover:bg-gray-300"
															: ""
													}`}
												>
													<div className="flex justify-between gap-2">
														<div>
															<p className="text-gray-700 text-sm">
																{file.name}
															</p>
															<p className="text-gray-500 text-xs">
																{INodeTypes[file.type]}
															</p>
														</div>
														<div>
															<p className="text-gray-700 text-sm">
																{formatFileSize(file.size)}
															</p>
														</div>
													</div>
												</div>
											</div>
										);
									})}
								</div>
							</div>
						)}
					</div>
				</div>
				<div className="absolute inset-0 bg-gray-500 opacity-75 flex"></div>
			</div>
		</div>
	);
};

export default FMInterface;