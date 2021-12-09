import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
	const auth = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			if (!isAuthenticated) {
				navigate("/");
			}
		});
	});
    
	return (
		<div className="dashboard">
			<div className="full-page w-full px-6 py-4 bg-gray-100">
				<h1 className="text-4xl mb-2">Dashboard</h1>
				<h3 className="text-xl mb-4">Welcome back, {auth.user.username}.</h3>
				{/* Highlight cards, flat UI with TailwindCSS */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
					<div className="bg-white shadow-md p-4 h-40">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold">Nodes</h3>
							<Link to="/dashboard/nodes/add" className="bg-white transition-all hover:text-white border-2 hover:bg-green-700 hover:border-transparent text-black border-blue-500 py-1 px-2 rounded">
								Add
							</Link>
						</div>
						<hr />
						<div className="mt-4">
							<ul className="list-inside list-none">
								<li>You have X nodes.</li>
								<li>0 events require your attention.</li>
							</ul>
						</div>
					</div>
					<div className="bg-white shadow-md p-4 h-40">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold">Servers</h3>
							<button className="bg-white transition-all hover:text-white border-2 hover:bg-green-700 hover:border-transparent text-black border-blue-500 py-1 px-2 rounded">
								Add
							</button>
						</div>
						<hr />
						<div className="mt-4">
							<ul className="list-inside list-none">
								<li>You have X servers.</li>
								<li>Z of X servers are currently online.</li>
							</ul>
						</div>
					</div>
					<div className="bg-white shadow-md p-4 h-40 mb-4 md:mb-0">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold">Profile</h3>
							<button className="bg-white transition-all hover:text-white border-2 hover:bg-green-700 hover:border-transparent text-black border-blue-500 py-1 px-2 rounded">
								Edit
							</button>
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
