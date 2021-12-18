import Background from "../../images/background.jpg";
import { useState, useContext } from "react";
import { Redirect } from "react-router-dom";
import AuthenticationContext from "../../contexts/AuthenticationContext";
import { createServer } from "../../utils/server_helpers";

export default function CreateServer() {
  const [fields, setFields] = useState({
    server_host: "",
    server_name: "",
    server_token: "",
    min_ram: "",
    max_ram: "",
  });

  const setFieldHelper = (fieldName, value) => {
    setFields({
      server_name: (fieldName === "server_name") ? value : fields.server_name,
      server_host: (fieldName === "server_host") ? value : fields.server_host,
      server_token: (fieldName === "server_token") ? value : fields.server_token,
      min_ram: (fieldName === "min_ram") ? value : fields.min_ram,
      max_ram: (fieldName === "max_ram") ? value : fields.max_ram,
    })
  }

  const auth = useContext(AuthenticationContext);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [errorText, setErrorText] = useState({
    text: "",
    className: "hidden",
  });

  const createServerFcn = async (e) => {
    e.preventDefault();
    const res = await createServer(auth.authData.val, fields.server_name, fields.server_host, fields.server_token, fields.min_ram, fields.max_ram);
    if (res.status === "error") {
      setErrorText({
        "text": res.msg,
        "className": "text-red-500 font-bold"
      })
    } else {
      setShouldRedirect(true);
    }
  };

  if (shouldRedirect) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <>
      <div
        className="bg-fixed w-full bg-no-repeat bg-cover flex mb-4"
        style={{
          backgroundImage: "url(" + Background + ")",
          height: "50vh",
        }}
      >
        <div className="my-auto mx-auto text-white text-center px-4">
          <h1 className="text-5xl">MCP</h1>
          <h3 className="text-2xl mt-4">
            Please input your server details to add the server to MCP.
          </h3>
        </div>
      </div>
      <div className="py-4 px-8">
        <h3 className="text-2xl">
          Please enter your host (IP addresses only), server name, server token
          and RAM values.
        </h3>
        <p className={errorText.className}>{errorText.text}</p>
        <div className="mt-4">
          <form onSubmit={createServerFcn} method="POST">
            <p>Server host (IP address)</p>
            <input
              placeholder="Server host..."
              name="server_token"
              type="text"
              onChange={(e) => {
                setFieldHelper("server_host", e.target.value)
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-4"
            />
            <p>Server token</p>
            <input
              placeholder="Server token..."
              name="server_token"
              type="password"
              onChange={(e) => {
                setFieldHelper("server_token", e.target.value)
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-4"
            />
            <p>Server name (alphanumeric)</p>
            <input
              placeholder="Server name..."
              name="server_name"
              type="text"
              onChange={(e) => {
                setFieldHelper("server_name", e.target.value)
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-4"
            />
            <p>Minimum RAM allocated</p>
            <input
              placeholder="Minimum RAM (in MB)..."
              name="min_ram"
              type="number"
              onChange={(e) => {
                setFieldHelper("min_ram", e.target.value)
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-4"
            />
            <p>Maximum RAM allocated</p>
            <input
              placeholder="Maximum RAM (in MB)..."
              name="max_ram"
              type="number"
              onChange={(e) => {
                setFieldHelper("max_ram", e.target.value)
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-4"
            />

            <button className="rounded-md bg-green-400 w-full py-2 text-white mb-4">
              Add server
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
