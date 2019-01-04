import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route } from "react-router-dom";
import { Async as AsyncSelect } from "react-select";
import { unstable_createResource } from "react-cache";
import Highlight, { defaultProps } from "prism-react-renderer";
/** @jsx jsx */
import { jsx } from "@emotion/core";
import FileTree from "./tree";
import "./styles.css";

let fileResource = unstable_createResource(file => {
  return fetch(`https://unpkg.com/${file}`).then(x => x.text());
});

let languages = {
  js: "jsx",
  jsx: "jsx",
  ts: "tsx",
  tsx: "tsx",
  md: "markdown",
  json: "json"
};

let fileExtensionRegex = /\.([a-z]+)$/;

function File({ pkg }) {
  let code = fileResource.read(pkg);
  let match = pkg.match(fileExtensionRegex);
  let language = "jsx";
  if (match != null) {
    language = languages[match[1]];
  }
  return (
    <Highlight {...defaultProps} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={className} css={{ margin: 8 }} style={style}>
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              {line.map((token, key) => (
                <span {...getTokenProps({ token, key })} />
              ))}
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
}

function Package({ pkg }) {
  return (
    <Suspense fallback="Loading...">
      <div css={{ display: "flex" }}>
        <div css={{ flex: 1, margin: 8 }}>
          <FileTree pkg={getStuff(pkg).name} />
        </div>
        <div css={{ flex: 3 }}>
          <Suspense fallback="Loading...">
            <File pkg={pkg} />
          </Suspense>
        </div>
      </div>
    </Suspense>
  );
}

function getStuff(match) {
  let isScoped = match.startsWith("@");

  let split = match.split("/");

  let pkgName = isScoped ? `${split.shift()}/${split.shift()}` : split.shift();
  return { name: pkgName, path: split.join("/") };
}

function App() {
  return (
    <div>
      <Route path="/package/:package*">
        {({ match, history }) => {
          return (
            <AsyncSelect
              value={
                match && {
                  value: getStuff(match.params.package).name,
                  label: getStuff(match.params.package).name
                }
              }
              onChange={val => {
                history.push(`/package/${val.value}`);
              }}
              placeholder="Search for a package"
              loadOptions={value => {
                return fetch(
                  `https://api.npms.io/v2/search/suggestions?q=${encodeURIComponent(
                    value
                  )}`
                )
                  .then(x => x.json())
                  .then(x => {
                    return x.map(x => ({
                      value: x.package.name,
                      label: x.package.name
                    }));
                  });
              }}
            />
          );
        }}
      </Route>
      <Route
        path="/package/:package*"
        render={({
          match: {
            params: { package: pkg }
          }
        }) => {
          return <Package pkg={pkg} />;
        }}
      />
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
