import { Octokit } from "@octokit/rest";

const octokit = new Octokit();
window.octokit = octokit;

// Compare: https://docs.github.com/en/rest/reference/repos/#list-organization-repositories
export const getData = async () => {
    // if (window.location.href.startsWith("http://localhost")) {
    //     return Array(1000).fill(0).map((_, i) => ({
    //         download_url: "/Archive/2023-03-01T00:07:20.365082+08:00.json",
    //         name: new Date((new Date()).getTime() - i * 24 * 60 * 60 * 1000).toString(),
    //     }))
    // }

    let isStaging = window.location.href.endsWith("/staging");
    const getPath = async (path) => {
      let response = await octokit.rest.repos.getContent({
        owner: "yetanothercheer",
        repo: "Archive",
        path,
        ref: isStaging ? "staging" : "main",
      });
      return response.data;
    };

    let list = (
      await Promise.all(
        (
          await getPath("")
        )
          .filter((d) => d.type === "dir")
          .sort((a, b) => {
            const toNumber = (name) => {
              let parts = name.split(".");
              return parseInt(parts[0]) * 1000 + parseInt(parts[1]);
            };
            return toNumber(a.name) - toNumber(b.name);
          })
          .reverse()
          .map((d) => d.path)
          .map(async (path) => {
            let data = await getPath(path);
  
            data.sort((a, b) => {
              const toNumber = (item) => {
                //  strip ".json"
                let isotime = item.name.split(".")[0];
                return new Date(isotime).getTime();
              };
              return toNumber(a) - toNumber(b);
            });
            return data;
          })
      )
    ).reduce((a, v) => [...v, ...a], []);
  
    return list;
  };

import useSWR from "swr";

const fetcher = (...args) => fetch(...args).then((res) => res.json());

export const useLinkGetData = (link) => {
    return useSWR(link, fetcher);
}