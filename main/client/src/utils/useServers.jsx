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
          TOKEN: authContext.authData.val,
        },
      });
      try {
        const data = await response.json();
        setServers(data);
      } catch (e) {
        console.error(e);
      }
    };
    if (servers == null) fetchData();
  });

  return servers;
};
