// import { StrictMode } from "react";
// import ReactDOM from "react-dom";

// import App from "./App";

// const rootElement = document.getElementById("root");
// ReactDOM.render(
//   <StrictMode>
//     <App />
//   </StrictMode>,
//   rootElement
// );

// window.onerror = function (message, source, lineno, colno, error) {
//   alert(`${message}:${source}:${lineno}:${colno}:${error}`);
// };

import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

import { initializeIcons } from "@fluentui/react/lib/Icons";
initializeIcons();

ReactDOM.render(<App />, document.getElementById("root"));
