import { useEffect, useState, useContext } from "react";
import AuthenticationContext from "../contexts/AuthenticationContext";

export const useServers = () => {
  const authContext = useContext(AuthenticationContext);
  const [servers, setServers] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch("/api/server/list", {
        method: "GET",
        cache: "no-cache",
        headers: {
          TOKEN: authContext.authData != null ? authContext.authData.val : null,
        },
      });
      try {
        const data = await response.json();
        setServers(data);
      } catch (e) {
        console.error(e);
        setServers({
          "status": "success",
          "servers": []
        });
      }
    };
    if (servers == null) fetchData();
  });

  return servers;
};
