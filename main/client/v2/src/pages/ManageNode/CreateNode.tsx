import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const CreateNode = () => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [processing, setProcessing] = React.useState(false);
	const [message, setMessage] = React.useState("");
	const [nickname, setNickname] = React.useState("");
	const [masterToken, setMasterToken] = React.useState("");
	const [hostname, setHostname] = React.useState("");

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});
	});

	const handleCreateNode = async () => {
		if (processing) {
			return;
		}
		setProcessing(true);
		setTimeout(async () => {
			try {
				const response = await fetch(`${process.env.REACT_APP_API_HOST}/api/v1/node/create`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `${auth.token}`,
					},
					body: JSON.stringify({
						node_hostname: hostname,
						nickname: nickname,
						token: masterToken,
					}),
				});

				const data = await response.json();

				if (response.status === 200) {
					navigate("/dashboard/nodes");
				} else {
					console.log("error");
					setMessage(data.message);
					setProcessing(false);
				}
			} catch (error: any) {
				setMessage(`Error creating node: ${error.toString()}`);
				setProcessing(false);
			}
		}, 1000);
	};

	return (
		<div className="nodesCreate">
			<div className="full-page w-full px-8 py-6 bg-gray-100">
				<h1 className="text-4xl mb-2">Add a node</h1>
				<p className="mb-4">Enter the details of the node you want to add.</p>

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
								placeholder="Node nickname"
								className="w-full rounded-md px-4 py-2 focus:outline-none border-2 border-gray-300"
								value={nickname}
								onChange={(e) => setNickname(e.target.value)}
							/>
							<input
								type="text"
								name="hostname"
								placeholder="Node hostname or IP"
								className="w-full rounded-md px-4 py-2 mt-4 focus:outline-none border-2 border-gray-300"
								value={hostname}
								onChange={(e) => setHostname(e.target.value)}
							/>
							<input
								type="password"
								name="masterToken"
								placeholder="Master token"
								className="w-full rounded-md px-4 py-2 mt-4 focus:outline-none border-2 border-gray-300"
								value={masterToken}
								onChange={(e) => setMasterToken(e.target.value)}
							/>
							<button
								type="submit"
								className={`w-full rounded-md px-4 py-2 mt-4 focus:outline-none border-2 border-gray-300 
								hover:bg-green-400 hover:text-white hover:border-transparent transition-all
								${processing ? "cursor-not-allowed opacity-50" : ""}`}
								disabled={processing}
							>
								{processing ? "Processing..." : "Create node"}
							</button>
						</form>
					</div>
					<div className="md:col-span-1 h-full bg-white rounded-md shadow-lg p-8">
						<h3 className="text-xl mb-2">Reminders</h3>
						<ul className="list-disc list-inside">
							<li>
								Node nicknames must only be alphanumeric (and may contain
								periods, underscores and dashes). If you choose not to set a
								nickname, the system will default to the hostname.
							</li>
							<li>
								Node hostnames/IPs should be the location of an MCPv2 node. Do
								not include any protocols (http://, etc) nor any slashes, etc.
							</li>
							<li>
								Your master token is set during setup. It can be retrieved
								through <em>.env</em> in <em>/var/local/mcp-node/</em>
							</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CreateNode;
