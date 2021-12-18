import Background from "../../images/background.jpg";
import { useState, useContext } from "react";
import { Redirect } from "react-router-dom";
import AuthenticationContext from "../../contexts/AuthenticationContext";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const auth = useContext(AuthenticationContext);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [errorText, setErrorText] = useState({
    text: "",
    className: "hidden"
  });

  const signIn = (e) => {
    e.preventDefault();
    let formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    fetch("/api/authenticate/", {
      method: "POST",
      body: new URLSearchParams(formData),
    })
      .then((res) => {
        console.log();
        if (res.status === 401) {
          setErrorText({
            text: "Username/password combination is invalid.",
            className: "block text-red-500 font-bold"
          });
          throw new Error("Bad username/password combo");
        } else {
          return res;
        }
      })
      .then((res) => res.json())
      .then((json) => {
        if (json.status === "success") {
          localStorage.setItem('token', JSON.stringify({
            "val": json.token,
            "expires": json.expires,
            "username": json.username
          }));
          auth.setAuthData({
            "val": json.token,
            "expires": json.expires,
            "username": json.username
          })
          setShouldRedirect(true);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  if (shouldRedirect) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <>
      <div
        className="bg-fixed w-screen bg-no-repeat bg-cover flex mb-4"
        style={{
          backgroundImage: "url(" + Background + ")",
          height: "50vh",
        }}
      >
        <div className="my-auto mx-auto text-white text-center px-4">
          <h1 className="text-5xl">MCP</h1>
          <h3 className="text-2xl mt-4">Sign in and access your servers.</h3>
        </div>
      </div>
      <div className="py-4 px-8">
        <h3 className="text-2xl">Please enter your username and password.</h3>
        <p className={errorText.className}>{errorText.text}</p>
        <div className="mt-4">
          <form onSubmit={signIn} method="POST">
            <p>Username</p>
            <input
              placeholder="Username..."
              name="username"
              type="text"
              onChange={(e) => {
                setUsername(e.target.value);
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-4"
            />
            <p>Password</p>
            <input
              placeholder="Password..."
              name="password"
              type="password"
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              className="rounded-md border-2 border-gray-300 p-2 w-full mb-8"
            />
            <button className="rounded-md bg-green-400 w-full py-2 text-white mb-4">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
