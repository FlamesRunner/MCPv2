import axios from "axios";
import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface IServerStatus {
	status: string;
	hostname: string;
	nickname: string;
}

type INode = {
	nickname: string;
	host: string;
	owner: string;
};

const Dashboard = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [serverStatus, setServerStatus] = React.useState<IServerStatus[]>([]);
	const [isLoading, setIsLoading] = React.useState<boolean>(true);
	const [nodeList, setNodeList] = React.useState<INode[]>([]);

	useEffect(() => {
		if (auth.token) {
			auth.isAuthenticated().then((isAuthenticated) => {
				if (!isAuthenticated) {
					navigate("/");
				} else {
					if (isLoading) {
						setIsLoading(false);
						axios
							.get(`${process.env.REACT_APP_API_HOST}/api/v1/server/summary`, {
								headers: {
									Authorization: `${auth.token}`,
								},
							})
							.then((res) => {
								if (res) {
									setServerStatus(res.data.servers);
								}
							});

						// Get node list
						axios
							.get(`${process.env.REACT_APP_API_HOST}/api/v1/node/list`, {
								headers: {
									Authorization: `${auth.token}`,
								},
							})
							.then((res) => {
								if (res) {
									setNodeList(res.data.nodes);
								}
							});
					}
				}
			});
		}
	}, [auth]);

	clearInterval();

	return (
		<div className="dashboard">
			<div className="full-page w-full px-8 py-6 bg-gray-100">
				<h1 className="text-4xl mb-2">Dashboard</h1>
				<h3 className="text-xl mb-4">Welcome back, {auth.user.username}.</h3>
				{/* Highlight cards, flat UI with TailwindCSS */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="bg-white shadow-md p-4 h-40">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold">Nodes</h3>
							<Link
								to="/dashboard/nodes/add"
								className="bg-white transition-all hover:text-white border-2 hover:bg-green-700 hover:border-transparent text-black border-blue-500 py-1 px-2 rounded"
							>
								Add
							</Link>
						</div>
						<hr />
						<div className="mt-4">
							<ul className="list-inside list-none">
								<li>You have {nodeList.length} nodes.</li>
								<li>0 events require your attention.</li>
							</ul>
						</div>
					</div>
					<div className="bg-white shadow-md p-4 h-40">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold">Servers</h3>
							<Link
								to="/dashboard/servers/add"
								className="bg-white transition-all hover:text-white border-2 hover:bg-green-700 hover:border-transparent text-black border-blue-500 py-1 px-2 rounded"
							>
								Add
							</Link>
						</div>
						<hr />
						<div className="mt-4">
							<ul className="list-inside list-none">
								<li>You have {serverStatus.length} server(s).</li>
								<li>
									{
										serverStatus.filter((server) => server.status === "on")
											.length
									}{" "}
									of {serverStatus.length} server(s) are online.
								</li>
							</ul>
						</div>
					</div>
					<div className="bg-white shadow-md p-4 h-40 mb-4 md:mb-0">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold">Profile</h3>
							<Link
								to="/dashboard/profile"
								className="bg-white transition-all hover:text-white border-2 hover:bg-green-700 hover:border-transparent text-black border-blue-500 py-1 px-2 rounded"
							>
								Edit
							</Link>
						</div>
						<hr />
						<div className="mt-4">
							<ul className="list-inside list-none">
								<li>Username: {auth.user.username}</li>
								<li>Email: {auth.user.email}</li>
							</ul>
						</div>
					</div>
				</div>
				{/* End of Highlight cards */}
				{/* Resource monitoring graphs */}
			</div>
		</div>
	);
};

export default Dashboard;
