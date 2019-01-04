import React, { useLayoutEffect, useState } from "react";
import AKTree, { mutateTree } from "@atlaskit/tree";
import { Link } from "react-router-dom";
import { unstable_createResource } from "react-cache";
import * as path from "path";

console.log(path);

function setItems(items, data) {
  items[data.path] = {
    id: data.path,
    isExpanded: data.path === "/",
    hasChildren: data.type === "directory",
    children: data.type === "directory" ? data.files.map(file => file.path) : []
  };
  if (Array.isArray(data.files)) {
    data.files.forEach(file => {
      setItems(items, file);
    });
  }
}

let filesResource = unstable_createResource(pkg => {
  return fetch(`https://unpkg.com/${pkg}/?meta`)
    .then(x => x.json())
    .then(data => {
      let root = { rootId: "/", items: {} };
      setItems(root.items, data);
      return root;
    });
});

let Tree = ({ pkg }) => {
  let filesTree = filesResource.read(pkg);
  let [tree, setTree] = useState(filesTree);

  useLayoutEffect(
    () => {
      if (tree !== filesTree) {
        setTree(filesTree);
      }
    },
    [filesTree]
  );

  return (
    <AKTree
      tree={tree}
      renderItem={({ item, provided, onCollapse, onExpand }) => {
        if (item.hasChildren) {
          return (
            <div ref={provided.innerRef} {...provided.draggableProps}>
              <button
                onClick={() => {
                  if (item.isExpanded) {
                    onCollapse(item.id);
                  } else {
                    onExpand(item.id);
                  }
                }}
              >
                {path.basename(item.id)}
              </button>
            </div>
          );
        }
        console.log(provided);
        return (
          <div ref={provided.innerRef} {...provided.draggableProps}>
            <Link to={`/package/${pkg}${item.id}`}>
              {path.basename(item.id)}
            </Link>
          </div>
        );
      }}
      onExpand={itemId => {
        setTree(mutateTree(tree, itemId, { isExpanded: true }));
      }}
      onCollapse={itemId => {
        setTree(mutateTree(tree, itemId, { isExpanded: false }));
      }}
      isNestingEnabled
      offsetPerLevel={8}
    />
  );
};

export default Tree;
