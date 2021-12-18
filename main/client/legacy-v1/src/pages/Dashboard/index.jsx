import React from "react";
import { useContext } from "react";
import Background from "../../images/background.jpg";
import AuthenticationContext from "../../contexts/AuthenticationContext";
import { Redirect, useHistory } from "react-router-dom";
import { useServers } from "../../utils/useServers";
import LoadingScreen from "../../components/LoadingScreen";

export default function Dashboard() {
  const authContext = useContext(AuthenticationContext);
  const servers = useServers();
  const history = useHistory();

  if (authContext.authData == null) return <Redirect to="/signin" />;
  if (servers == null) return <LoadingScreen />;

  const loadServerPage = (server_id) => {
    history.push("/server/" + server_id);
  };

  return (
    <>
      <div
        className="bg-fixed w-full bg-no-repeat bg-cover flex"
        style={{
          backgroundImage: "url(" + Background + ")",
          height: "40vh",
        }}
      >
        <div className="my-auto mx-auto text-white text-center">
          <h1 className="text-5xl">MCP</h1>
          <h3 className="text-2xl mt-4">
            Welcome back, {authContext.authData.username}.
          </h3>
        </div>
      </div>
      <div className="w-full p-8 bg-gray-200">
        <h1 className="text-2xl mb-8">Your servers</h1>
        {servers.servers.length > 0 &&
          servers.servers.map((s) => {
            return (
              <div
                className="rounded-md p-4 w-full bg-white cursor-pointer"
                onClick={() => {
                  loadServerPage(s.server_id);
                }}
              >
                <p>
                  {s.server_name} ({s.host})
                </p>
              </div>
            );
          })}
        {servers.servers.length === 0 && (
          <div className="rounded-md p-4 w-full bg-white">
            <p>No servers were found.</p>
          </div>
        )}
      </div>
      <div className="w-full p-8">
        <h1 className="text-2xl mb-4">Installation</h1>
        <div className="rounded-md p-4 w-full bg-blue-100">
          <p>
            To install MCPv2 node software, please prepare a fresh server
            running Debian 10.x. Then, execute the commands below as the root user to complete installation:
          </p>
        </div>
        <div className="rounded-md p-4 mt-4 w-full bg-black">
          <pre class="console-font text-white">
            # Installation
            <br />
            cd ~
            <br />
            wget https://raw.githubusercontent.com/FlamesRunner/MCPv2/main/node/install.bash
            <br />
            chmod +x install.bash
            <br />
            ./install.bash
            <br />
            <br />
            <hr />
            <br />
            # Add Server
            <br />
            cd /root && ./add-server.bash
          </pre>
        </div>
      </div>
    </>
  );
}
