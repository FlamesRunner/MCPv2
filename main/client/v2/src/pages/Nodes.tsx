import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type INode = {
    nickname: string;
    host: string;
    owner: string;
}

const Nodes = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [serverNodes, setServerNodes] = React.useState<INode[]>([]);

	const [loading, setLoading] = React.useState(true);

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});

		if (auth.token && loading) {
			setLoading(false);
			fetch(`${process.env.REACT_APP_API_HOST}/api/v1/node/list`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `${auth.token}`,
				},
			}).then((res) => {
				if (res.status === 200) {
					res.json().then((data) => {
						setServerNodes(data.nodes);
					});
				}
			});
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth.token, loading]);

	clearInterval();

	return (
		<div className="nodes">
			<div className="full-page w-full px-8 py-6 bg-gray-100">
				<h1 className="text-4xl mb-2">Nodes</h1>
				<p>Manage, monitor and configure your nodes.</p>
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
					{serverNodes.map((currentNode) => (
						<div className="mt-4 w-full rounded-md bg-white shadow-lg">
							<div className="flex flex-row items-center justify-between px-4 py-4">
								<div>{currentNode.nickname} ({currentNode.host})</div>
								<div onClick={() => {

								}}>N/A</div>
							</div>
						</div>
					))}
					{!loading && serverNodes.length === 0 && (
						<div className="mt-4 w-full rounded-md bg-white shadow-lg">
							<div className="flex flex-row items-center justify-between px-4 py-4">
								<div>No nodes found. <Link to="/dashboard/nodes/add" className="underline">Would you like to create one?</Link></div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default Nodes;
