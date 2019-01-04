import { Suspense } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Redirect } from "react-router-dom";
import Select, { Async as AsyncSelect } from "react-select";
import { unstable_createResource } from "react-cache";
import Highlight, { defaultProps } from "prism-react-renderer";
import npa from "npm-package-arg";
/** @jsx jsx */
import { jsx } from "@emotion/core";
import { maxSatisfying } from "semver";
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
  match = decodeURIComponent(match);
  let isScoped = match.startsWith("@");

  let split = match.split("/");

  let arg = isScoped ? `${split.shift()}/${split.shift()}` : split.shift();
  let stuff = npa(arg);

  return {
    name: stuff.name,
    type: stuff.type,
    spec: stuff.rawSpec,
    path: split.join("/")
  };
}

let versionsResource = unstable_createResource(pkg => {
  return fetch(`/.netlify/functions/versions/${pkg}`).then(x => x.json());
});
let tagsResource = unstable_createResource(pkg => {
  return fetch(`/.netlify/functions/tags/${pkg}`).then(x => x.json());
});

function makeLink({ name, version, path }) {
  return `/${name}@${version}/${path}`;
}

function VersionSelect({ pkg }) {
  let { type, spec, name, path } = getStuff(pkg);
  if (type === "tag") {
    let tags = tagsResource.read(name);
    if (spec === "") {
      spec = "latest";
    }
    if (spec in tags) {
      return <Redirect to={makeLink({ name, version: tags[spec], path })} />;
    }
    throw new ReadableError("Unknown tag: " + spec);
  } else if (type === "range") {
    let versions = versionsResource.read(name);
    let version = maxSatisfying(versions, spec);

    return <Redirect to={makeLink({ name, version, path })} />;
  } else if (type !== "version") {
    throw new ReadableError("Cannot handle spec type of " + type);
  }
  let versions = pkg ? versionsResource.read(name) : [];
  return (
    <Route>
      {({ history }) => (
        <Select
          css={{ flex: 2 }}
          onChange={({ value }) => {
            history.push(`/${name}@${value}/${path}`);
          }}
          value={{ value: spec, label: spec }}
          options={versions.map(version => ({
            label: version,
            value: version
          }))}
        />
      )}
    </Route>
  );
}

class ReadableError extends Error {}

function App() {
  return (
    <div>
      <Route path="/:package*">
        {({ match, history }) => {
          return (
            <div css={{ display: "flex", width: "100%" }}>
              <AsyncSelect
                css={{ flex: 3 }}
                value={
                  match && {
                    value: getStuff(match.params.package).name,
                    label: getStuff(match.params.package).name
                  }
                }
                onChange={val => {
                  history.push(`/${val.value}`);
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
              <Suspense
                fallback={
                  <Select css={{ flex: 2 }} options={[]} isDisabled isLoading />
                }
              >
                <VersionSelect pkg={match.params.package} />
              </Suspense>
            </div>
          );
        }}
      </Route>
      <Route
        path="/:package*"
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
