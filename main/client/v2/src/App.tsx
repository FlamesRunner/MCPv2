import React, { useEffect, useState } from "react";
import "./App.css";
import { Route, Routes } from "react-router";
import Home from "./pages/Home";
import "./assets/styles/Header.css";
import Logo from "./assets/images/logo.png";
import { Link } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import { useAuth } from "./context/AuthContext";
import Nodes from "./pages/Nodes";
import CreateNode from "./pages/ManageNode/CreateNode";
import Servers from "./pages/Servers";
import CreateServer from "./pages/ManageServer/CreateServer";
import ManageServer from "./pages/ManageServer/ManageServer";

function App() {
	const auth = useAuth();
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		auth.isAuthenticated().then((isAuthenticated) => {
			setIsAuthenticated(isAuthenticated);
		});
	}, [auth]);

	return (
		<div className="App">
			<nav className="navbar">
				<div className="navbar-content">
					<Link to="/" className="navbar-brand">
						<img
							src={Logo}
							alt="logo"
							style={{
								width: "48px",
							}}
						/>
					</Link>

					{isAuthenticated ? (
						<>
							<Link to="/dashboard">Dashboard</Link>
							<Link to="/dashboard/nodes">Nodes</Link>
							<Link to="/dashboard/servers">Servers</Link>
							<Link to="/" onClick={() => auth.signOut()}>
								Sign Out
							</Link>
						</>
					) : (
						<>
							<Link to="/">Home</Link>
							<Link to="/auth/login">Sign in</Link>
							<Link to="/auth/register">Register</Link>
						</>
					)}
				</div>
			</nav>
			<div className="content">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/dashboard" element={<Dashboard />} />
					<Route path="/dashboard/nodes" element={<Nodes />} />
					<Route path="/dashboard/servers" element={<Servers />} />
					<Route path="/dashboard/nodes/add" element={<CreateNode />} />
					<Route path="/dashboard/servers/add" element={<CreateServer />} />
					<Route path="/dashboard/servers/manage/:id" element={<ManageServer />} />
					<Route path="/auth/login" element={<SignIn />} />
					<Route path="/auth/register" element={<Register />} />
				</Routes>
			</div>
		</div>
	);
}

export default App;
