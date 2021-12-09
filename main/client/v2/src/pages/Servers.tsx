import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type IServer = {
	_id: string;
    nickname: string;
    token: string;
    host: string;
    parameters: {
        max_ram: number;
        min_ram: number;
    };
    node: string;
}


const Servers = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [servers, setServers] = React.useState<IServer[]>([]);

	const [loading, setLoading] = React.useState(true);

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});

		if (auth.token && loading) {
			setLoading(false);
			fetch(`${process.env.REACT_APP_API_HOST}/api/v1/server/list`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `${auth.token}`,
				},
			}).then((res) => {
				if (res.status === 200) {
					res.json().then((data) => {
						setServers(data.servers);
					});
				}
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth.token, loading]);

	clearInterval();

	return (
		<div className="servers">
			<div className="full-page w-full px-8 py-6 bg-gray-100">
				<h1 className="text-4xl mb-2">Servers</h1>
				<p>Manage, monitor and configure your servers.</p>
				<div className="mt-4 md:mt-8 w-full rounded-md bg-white shadow-lg">
					<div className="flex flex-row items-center justify-between px-4 py-4">
						<div>Basic info</div>
						<div>Actions</div>
					</div>
				</div>
				<div
					style={{
						height: "calc(100vh - 300px)",
						overflowY: "auto",
					}}
				>
					{servers.map((server) => (
						<div className="mt-4 w-full rounded-md bg-white shadow-lg">
							<div className="flex flex-row items-center justify-between px-4 py-4">
								<div>{server.nickname} ({server.host})</div>
								<Link to={`/dashboard/servers/manage/${server._id}`}>Manage</Link>
							</div>
						</div>
					))}
					{!loading && servers.length === 0 && (
						<div className="mt-4 w-full rounded-md bg-white shadow-lg">
							<div className="flex flex-row items-center justify-between px-4 py-4">
								<div>No servers found. <Link to="/dashboard/servers/add" className="underline">Would you like to create one?</Link></div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Servers;
