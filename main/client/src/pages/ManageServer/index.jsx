import React, { useEffect } from "react";
import { useContext, useState, useRef } from "react";
import Background from "../../images/background.jpg";
import AuthenticationContext from "../../contexts/AuthenticationContext";
import { Redirect, useParams } from "react-router-dom";
import { useServers } from "../../utils/useServers";
import LoadingScreen from "../../components/LoadingScreen";
import {
  startServer,
  stopServer,
  killServer,
  getConsole,
  sendCommand,
} from "../../utils/server_helpers";

export default function ManageServer() {
  const [status, setStatus] = useState(null);
  const [memoryWidth, setMemoryWidth] = useState(0);
  const [consoleLog, setConsoleLog] = useState("Please wait...");
  const [powerClasses, setPowerClasses] = useState({
    start: "hidden",
    stop: "hidden",
  });
  const cmdRef = useRef(null);
  const [powerCycling, setPowerCycling] = useState(false);
  const [lastPowerStatus, setLastPowerStatus] = useState();
  const [currentCommand, setCurrentCommand] = useState("");
  const authContext = useContext(AuthenticationContext);

  const servers = useServers();
  const { id } = useParams();

  const getServerStatus = async (server_data_internal) => {
    const response = await fetch(
      "/api/server/status?" + new URLSearchParams({ server_id: id }),
      {
        method: "GET",
        cache: "no-cache",
        headers: {
          TOKEN: authContext.authData.val,
        },
      }
    );
    try {
      const data = await response.json();
      setStatus(data);
      if (data != null && server_data_internal != null) {
        if (lastPowerStatus !== data.power_level) {
          setPowerCycling(false);
          setLastPowerStatus(data.power_level);
        }
        if (data.power_level === "on" && !powerCycling) {
          setPowerClasses({
            start: "hidden",
            stop: "",
          });
        } else if (data.power_level === "off" && !powerCycling) {
          setPowerClasses({
            start: "",
            stop: "hidden",
          });
        }
        console.log(server_data_internal);
        setMemoryWidth(
          (parseInt(data.memory_usage) /
            parseInt(server_data_internal[0].max_ram)) *
            100 +
            "%"
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getConsoleLog = async (server_data_internal) => {
    if (server_data_internal == null) return;
    const res = await getConsole(authContext.authData.val, id);
    if (res == null) return;
    if (res.status === "success") {
      setConsoleLog(res.log);
    }
  };

  const sendCmd = async (cmd) => {
    if (status.power_level === "off") return;
    await sendCommand(authContext.authData.val, id, cmd);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const server_data_internal = servers.servers.filter((srv) => {
        return srv.server_id === parseInt(id);
      });
      getServerStatus(server_data_internal);
      getConsoleLog(server_data_internal);
    }, 1500);
    return () => clearInterval(interval);
  });

  if (servers === null) return <LoadingScreen />;

  const server_data =
    servers === null
      ? null
      : servers.servers.filter((srv) => {
          return srv.server_id === parseInt(id);
        });

  if (server_data.length === 0) {
    return <Redirect to="/dashboard" />;
  }

  const disablePowerButtons = () => {
    setPowerClasses({
      start: "hidden",
      stop: "hidden",
    });
    setPowerCycling(true);
    setLastPowerStatus(status.power_level);
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
            Managing {server_data[0].server_name}
          </h3>
        </div>
      </div>
      <div class="md:flex md:flex-row h-screen w-full">
        <div className="p-8 bg-gray-200 w-full md:w-1/5">
          <h1 className="text-2xl">
            Server status:{" "}
            {status != null &&
              (status.power_level === "on" ? (
                <span className="text-green-400">Online</span>
              ) : (
                <span className="text-red-400">Offline</span>
              ))}
            {status == null && <span className="text-gray-500">(...)</span>}
          </h1>
          <div className="pt-4" />
          <p className="uppercase">
            Memory usage:{" "}
            {status != null &&
              status.memory_usage + "MB of " + server_data[0].max_ram + "MB"}
            {status == null && (
              <span className="text-gray-500">(Loading...)</span>
            )}
          </p>
          {/* Need to abstract progress bar, should move to another component */}
          {/* Need to find loading gif to display */}
          <div className="relative pt-1 mb-4">
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-pink-200">
              <div
                style={{
                  width: memoryWidth,
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-pink-500 transition-all duration-500"
              ></div>
            </div>
          </div>
          <div id="power_controls" class="inline-block mt-4">
            <p className={status != null && !powerCycling && "hidden"}>
              Power controls are loading...
            </p>
            <button
              onClick={() => {
                disablePowerButtons();
                startServer(authContext.authData.val, id);
              }}
              className={`bg-green-600 text-white px-4 py-2 rounded-md mr-2 ${powerClasses.start}`}
            >
              Start server
            </button>
            <button
              onClick={() => {
                disablePowerButtons();
                stopServer(authContext.authData.val, id);
              }}
              className={`bg-red-400 text-white px-4 py-2 rounded-md mr-2 ${powerClasses.stop}`}
            >
              Stop server
            </button>
            <button
              onClick={() => {
                disablePowerButtons();
                killServer(authContext.authData.val, id);
              }}
              className={`bg-red-600 text-white px-4 py-2 rounded-md ${powerClasses.stop}`}
            >
              Kill server
            </button>
          </div>
          <div
            id="cmd_area"
            className={`flex flex-row gap-2 mt-4 ${
              status != null && status.power_level === "off" ? "hidden" : ""
            }`}
          >
            <input
              placeholder="Command..."
              ref={cmdRef}
              type="text"
              onChange={(e) => {
                setCurrentCommand(e.target.value);
              }}
              onKeyUp={(event) => {
                console.log(event);
                if (event.keyCode === 13) {
                  sendCmd(currentCommand);
                  setCurrentCommand("");
                  cmdRef.current.value = "";
                }
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full"
            />
            <button
              onClick={() => {
                sendCmd(currentCommand);
                setCurrentCommand("");
                cmdRef.current.value = "";
              }}
              className="rounded-md bg-blue-500 text-white py-2 px-4"
            >
              Send
            </button>
          </div>
        </div>
        <div className="w-full md:w-4/5 h-full bg-black text-white flex flex-col">
          <div className="h-1/7 bg-gray-400 p-8 text-black">
            <h1 className="text-2xl">Console</h1>
          </div>
          <div className="px-4 py-2 overflow-y-scroll">
            {consoleLog
              .split("\n")
              .reverse()
              .map((line, idx) => {
                return <p>{line}</p>;
              })}
          </div>
        </div>
      </div>
    </>
  );
}
