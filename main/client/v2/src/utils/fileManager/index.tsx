import axios, { AxiosResponse } from "axios";
import { IInode, ListFilesProps } from "./types";

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

const listFiles = async ({
	host,
	username,
	password,
	token,
	path,
}: ListFilesProps): Promise<IInode[]> => {
	const fileListing: IInode[] = await axios
		.post(
			`${process.env.REACT_APP_API_HOST}/api/v1/sftp/ls`,
			{
				host: host,
				username: username,
				password: password,
				path: path,
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
			return files;
		})
		.catch((err) => {
			console.log(err);
			return [];
		});
	return fileListing;
};

export { formatFileSize, downloadFile, deleteFile, listFiles };
