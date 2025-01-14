import axios from "axios";
import React, { ChangeEvent, useEffect, useState } from "react";
import "../assets/styles/FMInterface.css";
import HomeIcon from "../assets/images/home.svg";
import {
	deleteFile,
	downloadFile,
	formatFileSize,
	listFiles,
} from "../utils/fileManager";
import { FMProps, IInode } from "../utils/fileManager/types";

const INodeTypes = {
	d: "Directory",
	l: "Symbolic Link",
	"-": "File",
	s: "Socket",
};

const FMInterface = ({ host, username, password, close, token }: FMProps) => {
	const [fileListing, setFileListing] = useState<IInode[]>([]);
	const [currentPath, setCurrentPath] = useState<string>("/");
	const [loading, setLoading] = useState<boolean>(true);
	const [uploading, setUploading] = useState<string>("");
	const [selectedFile, setSelectedFile] = useState<string>("");
	const [uploadProgress, setUploadProgress] = useState<number>(0);

	const changePath = (path: string) => {
		setLoading(true);
		setCurrentPath(path);
		setSelectedFile("");
	};

	useEffect(() => {
		if (username && password && host && token) {
			// Get the file listing
			listFiles({
				host,
				username,
				password,
				token,
				path: currentPath,
			})
				.then((files) => {
					setFileListing(files);
				})
				.finally(() => {
					setLoading(false);
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPath, password, token, username]);

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
													onUploadProgress: (progressEvent: ProgressEvent) => {
														const percentCompleted = Math.round(
															(progressEvent.loaded * 100) / progressEvent.total
														);

														if (percentCompleted === 100) {
															setTimeout(() => {
																setUploadProgress(0);
																setUploading("");
																setLoading(true);
															}, 1000);
														}

														setUploadProgress(percentCompleted);
													},
												}
											)
											.catch((err) => {
												console.log(err);
												setLoading(false);
												setUploading("");
											});
									}}
								/>
								<div className="w-full">
									{/* Show current path */}
									<div className="flex justify-between items-center mb-4 bg-gray-200 rounded-md p-2">
										<div className="flex items-center">
											{/* Show path elements and allow for navigation */}
											{/* Show home icon */}
											<div
												className="cursor-pointer"
												onClick={() => {
													changePath("/");
												}}
											>
												<img src={HomeIcon} alt="Root directory" width={20} />
											</div>
											{currentPath.split("/").map((path, index) => {
												if (path === "") return null;
												return (
													<div>
														<span className="mx-1">/</span>
														<a
															className="text-blue-500 cursor-pointer"
															href="#dir"
															onClick={() => {
																changePath(
																	currentPath
																		.split("/")
																		.slice(0, index + 1)
																		.join("/")
																);
															}}
														>
															{path}
														</a>
													</div>
												);
											})}
										</div>
										{/* Show upload status */}
										<div className="flex items-center">
											{uploading && (
												<div className="flex items-center">
													<div className="flex items-center">
														<svg
															className="w-4 h-4 mr-2"
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 20 20"
														>
															<path d="M10 20a10 10 0 1 1 0-20 10 10 0 0 1 0 20zm-5.6-4.29a9.95 9.95 0 0 0 11.2 0 8 8 0 1 0-11.2 0zm6.12-7.64l3.02-3.02 1.41 1.41-3.02 3.02a2 2 0 1 1-1.41-1.41z" />
														</svg>
														<span>Uploading: {uploadProgress}</span>
													</div>
													<span className="mx-1">%</span>
												</div>
											)}
										</div>
									</div>
								</div>
								<div className="w-full grid grid-cols-2 gap-2">
									<div
										className={`w-full mb-4 bg-gray-200 p-2 rounded-md ${
											uploading
												? "opacity-50"
												: "cursor-pointer hover:bg-gray-300"
										}`}
										onClick={() => {
											if (!uploading) {
												// Show upload dialog
												const fileUpload = document.getElementById(
													"fileUpload"
												) as HTMLInputElement;
												fileUpload.click();
											}
										}}
									>
										<p className="text-sm text-gray-600 text-center">
											Upload file
										</p>
									</div>
									<div
										className="mb-4 bg-gray-200 p-2 cursor-pointer rounded-md hover:bg-gray-300"
										onClick={() => {
											setLoading(true);

											// Move up one directory if current path is not root
											if (
												currentPath !== "/" &&
												currentPath.charAt(currentPath.length - 1) !== "/"
											) {
												changePath(
													currentPath.split("/").slice(0, -1).join("/")
												);
											}
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
											Download{" "}
											{selectedFile.substring(
												selectedFile.lastIndexOf("/") + 1,
												selectedFile.length
											)}
										</p>
									</div>
									<div
										className="mb-4 bg-red-500 h-9 overflow-x-auto p-2 cursor-pointer rounded-md hover:bg-red-600"
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
												key={
													file.name +
													file.size +
													file.accessTime +
													file.modifyTime
												}
												className={`w-full md:w-1/3 pr-3 pb-3 ${
													file.type === "d" || file.type === "-"
														? "cursor-pointer"
														: ""
												}`}
												onClick={() => {
													if (file.type === "-") {
														setSelectedFile(
															currentPath === "/"
																? currentPath + file.name
																: currentPath + "/" + file.name
														);
													} else if (file.type === "d") {
														// Change path to directory file.name
														changePath(
															currentPath === "/"
																? currentPath + file.name
																: currentPath + "/" + file.name
														);
													}
												}}
											>
												<div
													className={`rounded-lg p-2 overflow-x-auto ${
														file.type === "d" || file.type === "-"
															? selectedFile.substring(
																	selectedFile.lastIndexOf("/") + 1
															  ) === file.name
																? "bg-gray-300"
																: "bg-gray-200 hover:bg-gray-300"
															: "bg-gray-200"
													}`}
												>
													<div className="flex justify-between gap-2">
														<div>
															<p className="text-gray-700 text-sm">
																{file.name}
															</p>
														</div>
														<div>
															<p className="text-gray-700 text-sm">
																{formatFileSize(file.size)}
															</p>
														</div>
													</div>
													<div className="text-gray-500 text-xs grid grid-cols-2 w-full">
														<div>
															<span className="font-bold">
																{INodeTypes[file.type]}
															</span>
															:{" "}
															{file.rights.user +
																"/" +
																file.rights.group +
																"/" +
																file.rights.other}
														</div>
														<div className="text-right">
															U/G: {file.owner}/{file.group}
														</div>
													</div>
													<div className="text-gray-500 text-xs w-full">
														<span className="font-bold">Last modified:</span>{" "}
														{new Date(file.modifyTime).toLocaleString()}
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
