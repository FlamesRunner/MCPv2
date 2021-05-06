import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import Home from "./pages/Home";

export default function App() {
  const toggleMenu = (event) => {
    const navToggle = document.getElementsByClassName("toggle");
    for (let i = 0; i < navToggle.length; i++) {
      navToggle.item(i).classList.toggle("hidden");
    }
    event.currentTarget.blur();
  };
  return (
    <Router>
      <div>
        <nav class="flex flex-wrap items-center justify-between p-5 bg-blue-200">
          <div>
            <svg className="fill-current h-8 w-8 mr-2 inline-block" width="54" height="54" viewBox="0 0 54 54" xmlns="http://www.w3.org/2000/svg"><path d="M13.5 22.1c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05zM0 38.3c1.8-7.2 6.3-10.8 13.5-10.8 10.8 0 12.15 8.1 17.55 9.45 3.6.9 6.75-.45 9.45-4.05-1.8 7.2-6.3 10.8-13.5 10.8-10.8 0-12.15-8.1-17.55-9.45-3.6-.9-6.75.45-9.45 4.05z" /></svg>
            <span className="text-xl">MCP</span>
          </div>
          <div class="flex md:hidden">
            <button id="hamburger" onClick={toggleMenu}>
              <svg
                id="prefix__Icons"
                xmlns="http://www.w3.org/2000/svg"
                x={0}
                y={0}
                viewBox="0 0 32 32"
                xmlSpace="preserve"
                className="toggle block"
                width="40"
              >
                <style>
                  {
                    ".prefix__st0{fill:none;stroke:#000;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10}"
                  }
                </style>
                <path
                  className="prefix__st0"
                  d="M24 28H8c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4h16c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4zM10 16h12M10 12h12M10 20h12"
                />
              </svg>
              <svg className="toggle hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="40">
                <defs>
                  <style>{".prefix__cls-1{fill:#35353d}"}</style>
                </defs>
                <title>{"Asset 56"}</title>
                <g id="prefix__Layer_2" data-name="Layer 2">
                  <g id="prefix__Layer_1-2" data-name="Layer 1">
                    <path
                      className="prefix__cls-1"
                      d="M56 0H8a8 8 0 00-8 8v48a8 8 0 008 8h48a8 8 0 008-8V8a8 8 0 00-8-8zm2.67 56A2.68 2.68 0 0156 58.67H8A2.68 2.68 0 015.33 56V8A2.68 2.68 0 018 5.33h48A2.68 2.68 0 0158.67 8z"
                    />
                    <path
                      className="prefix__cls-1"
                      d="M47.08 43.31L35.77 32l11.31-11.31a2.67 2.67 0 10-3.77-3.77L32 28.23 20.69 16.92a2.67 2.67 0 10-3.77 3.77L28.23 32 16.92 43.31a2.67 2.67 0 103.77 3.77L32 35.77l11.31 11.31a2.67 2.67 0 003.77-3.77z"
                    />
                  </g>
                </g>
              </svg>
            </button>
          </div>
          <div class="toggle hidden md:flex w-full md:w-auto text-right text-bold mt-5 md:mt-0 border-t-2 border-blue-900 md:border-none">
            <Link to="/" class="block md:inline-block text-blue-900 hover:text-blue-500 px-3 py-3 border-b-2 border-blue-900 md:border-none">Home</Link>
            <Link to="/signin" class="block md:inline-block text-blue-900 hover:text-blue-500 px-3 py-3 border-b-2 border-blue-900 md:border-none">Sign in</Link>
          </div>
        </nav>

        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/signin">
            <About />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

function About() {
  return <h2>About</h2>;
}