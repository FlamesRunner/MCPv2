import React, { useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
	LineChart,
	Line,
	CartesianGrid,
	XAxis,
	YAxis,
	ResponsiveContainer,
	Tooltip,
	Legend,
} from "recharts";
import moment from "moment";
import FileManager from "../../components/FileManager";
import parseMinecraftConsoleOutput from "../../utils/parseMinecraftConsoleOutput";
import "../../assets/styles/Console.css";

type IServerStatus = {
	memory_usage: string;
	power_level: string;
	status: string;
};

type IServer = {
	_id: string;
	nickname: string;
	host: string;
	parameters: {
		max_ram: number;
		min_ram: number;
	};
	node: string;
};

type MemoryUsageDataPoint = {
	time: number;
	usage: number;
};

const executeAction = async (
	action: string,
	command: string,
	server: IServer,
	token: string
) => {
	const validActions = ["start", "stop", "kill", "execute"];
	if (!validActions.includes(action)) {
		return;
	}
	const url = `${process.env.REACT_APP_API_HOST}/api/v1/server/${action}`;
	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `${token}`,
		},
		body: JSON.stringify({ server_id: server._id, command }),
	}).catch((err) => {
		console.log(err);
	});
};

const ManageServer = (props: any) => {
	const auth = useAuth();
	const navigate = useNavigate();
	const [loading, setLoading] = React.useState(true);
	const params = useParams();
	const [serverStatus, setServerStatus] = React.useState<IServerStatus>({
		memory_usage: "0",
		power_level: "",
		status: "",
	});

	const consoleRef = React.useRef<HTMLPreElement>(null);

	const [serverProperties, setServerProperties] = React.useState<IServer>({
		_id: "",
		nickname: "",
		host: "",
		parameters: {
			max_ram: 0,
			min_ram: 100,
		},
		node: "",
	});

	const [consoleInput, setConsoleInput] = React.useState("");

	const [lastAdded, setLastAdded] = React.useState<number>(0);

	const [consoleLog, setConsoleLog] = React.useState<string[]>([]);

	const [showFileManager, setShowFileManager] = React.useState(false);

	const [memoryUsageData, setMemoryUsageData] = React.useState<
		MemoryUsageDataPoint[]
	>([]);

	const [executingAction, setExecutingAction] = React.useState<boolean>(false);

	const getConsoleLog = async () => {
		await fetch(
			`${process.env.REACT_APP_API_HOST}/api/v1/server/log/${params.id}`,
			{
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `${auth.token}`,
				},
			}
		).then((res) => {
			if (res.status === 200) {
				res.json().then((data) => {
					const consoleLog: string[] = data.logs.split("\n");
					consoleLog.reverse();
					if (consoleLog[0].trim() === "") {
						consoleLog.shift();
					}
					setConsoleLog(
						consoleLog.map((line) => {
							return line + "\n";
						})
					);
				});
			}
		});
	};

	const getServerStatus = async () => {
		return fetch(
			`${process.env.REACT_APP_API_HOST}/api/v1/server/status/${params.id}`,
			{
				method: "GET",
				headers: {
					Authorization: `${auth.token}`,
				},
			}
		)
			.then((response) => {
				if (response.status !== 200) {
					throw new Error("Failed to retrieve server status");
				} else {
					return response.json();
				}
			})
			.then((data) => {
				setServerStatus(data.status);
				setServerProperties(data.server);
				setLastAdded(Date.now());

				const memoryUsageDataPoints: MemoryUsageDataPoint[] = memoryUsageData;

				memoryUsageDataPoints.push({
					usage: Math.min(
						Math.round(
							(parseInt(data.status.memory_usage) /
								data.server.parameters.max_ram) *
								100
						),
						100
					),
					time: Date.now(),
				});

				setMemoryUsageData([]);
				setMemoryUsageData(memoryUsageDataPoints);
				setExecutingAction(false);
			})
			.catch((e: any) => {
				navigate("/dashboard/servers");
			})
			.finally(() => {
				setLoading(false);
			});
	};

	if (params.id === undefined) {
		navigate("/dashboard/servers");
	}

	useEffect(() => {
		let interval_one: NodeJS.Timeout;
		let interval_two: NodeJS.Timeout;

		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});

		if (loading && auth.token) {
			// Fetch available nodes
			setLoading(false);
			getServerStatus();

			interval_one = setInterval(() => {
				getServerStatus();
			}, 5000);

			interval_two = setInterval(() => {
				getConsoleLog();
			}, 2000);
		}

		return () => {
			clearInterval(interval_one);
			clearInterval(interval_two);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [auth.token, params.id]);

	return (
		<div className="serverManage">
			<FileManager
				token={auth.token}
				serverId={params.id || ""}
				serverHostname={serverProperties.host}
				show={showFileManager}
				close={() => {
					setShowFileManager(false);
				}}
			/>
			<div className="full-page w-full px-8 py-6 bg-gray-100">
				<h1 className="text-4xl mb-8">
					Managing: {serverProperties.nickname} ({serverProperties.host})
				</h1>

				{/* Show server actions */}
				<div className="bg-white w-full shadow-lg mb-4 p-4 rounded-md">
					<h3 className="text-xl mb-4">Server Actions</h3>
					<div className="flex flex-row justify-between">
						<div className="flex flex-row">
							<button
								style={{
									opacity:
										serverStatus.power_level === "on"
											? 0
											: executingAction
											? 0.5
											: 1,
									display:
										serverStatus.power_level === "off" ? "block" : "none",
									transition: "all 0.5s ease-in-out",
								}}
								className={`${
									executingAction ? "bg-gray-300 cursor-not-allowed" : ""
								} bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded mr-2`}
								onClick={() => {
									if (executingAction) return;
									setExecutingAction(true);
									executeAction("start", "", serverProperties, auth.token);
								}}
							>
								Start
							</button>
							<button
								style={{
									opacity:
										serverStatus.power_level === "off"
											? 0
											: executingAction
											? 0.5
											: 1,
									display: serverStatus.power_level === "on" ? "block" : "none",
									transition: "all 0.5s ease-in-out",
								}}
								className={`${
									executingAction ? "bg-gray-300 cursor-not-allowed" : ""
								} bg-yellow-500 hover:bg-yellow-700 text-white py-2 px-4 rounded mr-2`}
								onClick={() => {
									if (executingAction) return;
									setExecutingAction(true);
									executeAction("stop", "", serverProperties, auth.token);
								}}
							>
								Stop
							</button>
							<button
								style={{
									opacity:
										serverStatus.power_level === "off"
											? 0
											: executingAction
											? 0.5
											: 1,
									display: serverStatus.power_level === "on" ? "block" : "none",
									transition: "all 0.5s ease-in-out",
								}}
								className={`${
									executingAction ? "bg-gray-300 cursor-not-allowed" : ""
								} bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded mr-2`}
								onClick={() => {
									if (executingAction) return;
									setExecutingAction(true);
									executeAction("kill", "", serverProperties, auth.token);
								}}
							>
								Kill
							</button>
						</div>
					</div>
				</div>

				<div
					className="grid grid-cols-1 md:grid-cols-2 gap-4"
					style={{
						height: "480px",
					}}
				>
					<div className="bg-white shadow-md rounded px-4 py-4">
						<h2 className="text-xl mb-2">Current Memory Usage</h2>
						<div className="bg-gray-200 h-6 w-full rounded-full">
							<div
								className="bg-green-500 h-6 w-full rounded-full"
								style={{
									width: `${Math.max(
										Math.min(
											(parseInt(serverStatus.memory_usage) /
												serverProperties.parameters.max_ram) *
												100,
											100
										),
										3
									)}%`,
									transition: "width 2s ease-in-out",
								}}
							/>
						</div>
						<div
							className="hidden md:block"
							style={{
								paddingTop: "30px",
							}}
						>
							<ResponsiveContainer width="100%" height={350}>
								<LineChart
									height={250}
									data={memoryUsageData}
									margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
								>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis
										dataKey="time"
										type="number"
										tickFormatter={(timeStr) =>
											moment(timeStr).format("DD-MM-YYYY HH:mm:ss")
										}
										domain={[Date.now(), lastAdded]}
									/>
									<YAxis
										dataKey="usage"
										label={{
											value: "Memory usage %",
											angle: -90,
											position: "insideLeft",
										}}
									/>
									<Tooltip
										labelFormatter={(timeStr) =>
											moment(timeStr).format("DD-MM-YYYY HH:mm:ss")
										}
									/>
									<Legend />
									<Line
										type="monotone"
										isAnimationActive={false}
										dataKey="usage"
										name="Usage"
										stroke="#8884d8"
										dot={false}
										strokeWidth={2}
									/>
								</LineChart>
							</ResponsiveContainer>
						</div>
					</div>
					<div
						className="w-full flex flex-col"
						style={{
							height: "480px",
						}}
					>
						<pre
							className="bg-gray-800 text-green-600 w-full p-2 h-full rounded-t-md console-scroll"
							style={{
								overflowX: "hidden",
								overflowY: "auto",
								wordBreak: "break-all",
								whiteSpace: "pre-wrap",
							}}
							ref={consoleRef}
							dangerouslySetInnerHTML={{
								__html: parseMinecraftConsoleOutput(consoleLog),
							}}
						/>
						<form
							onSubmit={(e) => {
								e.preventDefault();
								if (executingAction) return;
								executeAction(
									"execute",
									consoleInput,
									serverProperties,
									auth.token
								).finally(() => {
									setConsoleInput("");
								});
							}}
						>
							<div className="flex items-center">
								<input
									type="text"
									className="w-full p-2 focus:outline-none bg-gray-200"
									style={{
										borderBottomLeftRadius: "6px",
									}}
									onChange={(e) => {
										setConsoleInput(e.target.value);
									}}
									placeholder="Enter command"
									value={consoleInput}
								/>
								<button
									type="submit"
									className="py-2 px-4 bg-green-500 text-white focus:outline-none"
									style={{
										borderBottomRightRadius: "6px",
									}}
								>
									Execute
								</button>
							</div>
						</form>
					</div>
				</div>
				{/* File manager */}
				<div className="w-full mt-32 md:mt-4">
					<div className="bg-white shadow-md rounded p-4">
						<h3 className="text-xl mb-2">File access</h3>
						<button
							onClick={() => setShowFileManager(true)}
							className="w-full md:w-auto rounded-md px-4 py-2 bg-blue-400 hover:bg-blue-600 transition-all text-white"
						>
							Open
						</button>
					</div>
				</div>
			</div>
			<style>
				{`
					html {
						overflow-y: ${showFileManager ? "hidden" : "scroll"};
					}
				`}
			</style>
		</div>
	);
};

export default ManageServer;
