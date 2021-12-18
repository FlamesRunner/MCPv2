async function helperFunction(
  action,
  server_id,
  token,
  method = "POST",
  fields = []
) {
  let formData = new FormData();
  formData.append("server_id", server_id);
  fields.forEach((item) => {
    formData.append(item.name, item.value);
  });
  const response =
    method === "POST"
      ? await post_response(action, token, formData)
      : await get_response(action, token, formData);
  try {
    const data = await response.json();
    return data;
  } catch (e) {
    // 401
    return { status: "error", msg: "Unauthorized." };
  }
}

function post_response(action, token, formData) {
  return fetch("/api/server/" + action, {
    method: "POST",
    cache: "no-cache",
    headers: {
      TOKEN: token,
    },
    body: new URLSearchParams(formData),
  });
}

function get_response(action, token, formData) {
  return fetch("/api/server/" + action + "?" + new URLSearchParams(formData), {
    method: "GET",
    cache: "no-cache",
    headers: {
      TOKEN: token,
    },
  });
}

async function startServer(token, server_id) {
  return await helperFunction("start", server_id, token);
}

async function stopServer(token, server_id) {
  return await helperFunction("stop", server_id, token);
}

async function killServer(token, server_id) {
  return await helperFunction("kill", server_id, token);
}

async function getConsole(token, server_id) {
  return await helperFunction("console/log", server_id, token, "GET");
}

async function sendCommand(token, server_id, cmd) {
  return await helperFunction("console/send", server_id, token, "POST", [
    { name: "cmd", value: cmd },
  ]);
}

async function createServer(token, name, host, server_token, min_ram, max_ram) {
  return await helperFunction("new", 0, token, "POST", [
    { name: "server_name", value: name },
    { name: "server_host", value: host },
    { name: "server_ram_min", value: min_ram },
    { name: "server_ram_max", value: max_ram },
    { name: "server_token", value: server_token },
  ]);
}

async function deleteServer(token, server_id) {
  return await helperFunction("delete", server_id, token);
}

export {
  startServer,
  stopServer,
  killServer,
  getConsole,
  sendCommand,
  createServer,
  deleteServer
};
