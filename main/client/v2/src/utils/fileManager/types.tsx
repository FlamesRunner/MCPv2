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

type ListFilesProps = {
    host: string;
    username: string;
    password: string;
    token: string;
    path: string;
}

export type { IInode, FMProps, ListFilesProps };