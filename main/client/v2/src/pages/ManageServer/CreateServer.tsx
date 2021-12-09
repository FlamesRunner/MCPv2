import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type INode = {
	nickname: string;
	host: string;
	owner: string;
	_id: string;
};

const CreateServer = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [processing, setProcessing] = React.useState(false);
	const [nodes, setNodes] = React.useState<INode[]>([]);
	const [message, setMessage] = React.useState("");
	const [loading, setLoading] = React.useState(true);
	const [nodeId, setNodeId] = React.useState("");
	const [nickname, setNickname] = React.useState("");
	const [minRam, setMinRam] = React.useState(512);
	const [maxRam, setMaxRam] = React.useState(1024);

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});

		if (loading && auth.token) {
			// Fetch available nodes
			setLoading(false);

			fetch(`${process.env.REACT_APP_API_HOST}/api/v1/node/list`, {
				method: "GET",
				headers: {
					Authorization: `${auth.token}`,
				},
			})
				.then((response) => {
					if (response.status !== 200) {
						throw new Error("Failed to retrieve nodes");
					} else {
						return response.json();
					}
				})
				.then((data) => {
					setNodes(data.nodes);
				})
				.catch((e: any) => {
					setMessage(e.toString());
					setLoading(false);
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth, loading]);

	const handleCreateNode = async () => {
		if (processing) {
			return;
		}
		setProcessing(true);
		setTimeout(async () => {
			try {
				const response = await fetch(
					`${process.env.REACT_APP_API_HOST}/api/v1/server/create`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							Authorization: `${auth.token}`,
						},
						body: JSON.stringify({
							node_id: nodeId,
							server_name: nickname,
							min_ram: minRam,
							max_ram: maxRam,
						}),
					}
				);

				const data = await response.json();

				if (response.status === 200) {
					navigate("/dashboard/servers");
				} else {
					setMessage(data.message);
					setProcessing(false);
				}
			} catch (error: any) {
				setMessage(`Error creating server: ${error.toString()}`);
				setProcessing(false);
			}
		}, 1000);
	};

	return (
		<div className="nodesCreate">
			<div className="full-page w-full px-8 py-6 bg-gray-100">
				<h1 className="text-4xl mb-2">Add a server</h1>
				<p className="mb-4">Enter the details of the server you want to add.</p>

				<div
					className="bg-red-100 border-l-4 border-red-500 text-red-700 transition-all relative"
					style={{
						opacity: message && !processing ? 1 : 0,
						visibility: message && !processing ? "visible" : "hidden",
						transition: "opacity 0.5s ease-in-out, visiblity 0.5s ease-in-out",
						padding: message && !processing ? "1rem" : "0",
					}}
				>
					{/* Close */}
					<button
						className="absolute top-0 right-3 p-2 text-2xl"
						onClick={() => setMessage("")}
					>
						×
					</button>

					<p className="font-bold">Error</p>
					<p>{message}</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mt-4 mb-4">
					<div className="md:col-span-2 shadow-lg p-8 bg-white rounded-md">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleCreateNode();
							}}
						>
							<input
								type="text"
								name="nickname"
								placeholder="Server nickname"
								required={true}
								className="w-full rounded-md px-4 py-2 focus:outline-none border-2 border-gray-300"
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
							/>
							<div className="grid grid-cols-2 gap-4 mt-4">
								<input
									type="number"
									step="1"
									min="512"
									name="minRam"
									placeholder="Minimum RAM allocation (MB)"
									required={true}
									className="w-full rounded-md px-4 py-2 focus:outline-none border-2 border-gray-300"
									value={minRam}
									onChange={(e) => {
										setMinRam(parseInt(e.target.value));
										if (maxRam + 512 < parseInt(e.target.value)) {
											setMaxRam(parseInt(e.target.value) + 512);
										}
									}}
								/>
								<input
									type="number"
									step="1"
									min={`${minRam + 512}`}
									name="maxRam"
									placeholder="Maximum RAM allocation (MB)"
									required={true}
									className="w-full rounded-md px-4 py-2 focus:outline-none border-2 border-gray-300"
									value={maxRam}
									onChange={(e) => {
										setMaxRam(parseInt(e.target.value));
									}}
								/>
							</div>
							<select
								name="node"
								className="mt-4 w-full rounded-md px-3 py-2 focus:outline-none border-2 border-gray-300"
								required={true}
								onChange={(e) => setNodeId(e.target.value)}
							>
								<option value="">Select a node</option>
								{nodes.map((node) => (
									<option key={node._id} value={node._id}>
										{node.host} / {node.nickname}
									</option>
								))}
							</select>
							<button
								type="submit"
								className={`w-full rounded-md px-4 py-2 mt-4 focus:outline-none border-2 border-gray-300 
								hover:bg-green-400 hover:text-white hover:border-transparent transition-all
								${processing ? "cursor-not-allowed opacity-50" : ""}`}
								disabled={processing}
							>
								{processing ? "Processing..." : "Create server"}
							</button>
						</form>
					</div>
					<div className="md:col-span-1 h-full bg-white rounded-md shadow-lg p-8">
						<h3 className="text-xl mb-2">Reminders</h3>
						<ul className="list-disc list-inside">
							<li>
								Server nicknames must only be alphanumeric, and must be unique.
								They are used as identifiers, and cannot be changed. They should
								be 8-16 characters long.
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreateServer;
