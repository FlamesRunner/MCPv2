import React from "react";
import {useState, useContext} from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import AuthenticationContext from "./contexts/AuthenticationContext";
import useAuthentication from "./utils/useAuthentication";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import ManageServer from "./pages/ManageServer";


const SignOut = () => {
  const authContext = useContext(AuthenticationContext);
  localStorage.removeItem('token');
  authContext.setAuthData(useAuthentication());
  return <Redirect to="/signin" />;
}

export default function App() {
  const auth = useAuthentication();
  const [authData, setAuthData] = useState(auth);

  return (
    <Router>
      <AuthenticationContext.Provider value={{"authData": authData, "setAuthData": setAuthData}}>
        <div>
          <Navbar />
          {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/signin">
              <SignIn />
            </Route>
            <Route path="/dashboard">
              <Dashboard />
            </Route>
            <Route path="/sign-out">
              <SignOut />
            </Route>
            <Route path="/server/:id" component={ManageServer} />
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </AuthenticationContext.Provider>
    </Router>
  );
}
