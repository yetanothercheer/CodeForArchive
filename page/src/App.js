import React, { useEffect, useState, useMemo } from "react";
import "./styles.css";

import { Octokit } from "@octokit/rest";
import useSWR from "swr";

// : < This is frustrating...
// import { ThemeProvider } from "@fluentui/react-theme-provider";
import { ThemeProvider } from "@fluentui/react";
import { createTheme } from "@fluentui/theme";

import { lightTheme, darkTheme, highContrastTheme } from "./theme";
const octokit = new Octokit();
window.octokit = octokit;

// Compare: https://docs.github.com/en/rest/reference/repos/#list-organization-repositories
const getData = async () => {
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

const fetcher = (...args) => fetch(...args).then((res) => res.json());

import { Link, Text } from "@fluentui/react";

import { getTheme } from "@fluentui/react";

const theme = getTheme();

import { DefaultButton, PrimaryButton } from "@fluentui/react/lib/Button";
import { Image, IImageProps } from "@fluentui/react/lib/Image";

const getImageURL = (id) =>
  `https://mesquite-dusty-dirt.glitch.me/api?url=https://wx1.sinaimg.cn/large/${id}.jpg`;

const Indicator = ({ num1, num2 }) => {
  return (
    <div>
      {/* <DefaultButton text="Standard" onClick={} allowDisabledFocus disabled={disabled} checked={checked} /> */}
    </div>
  );
};

import { LazyLoadImage } from "react-lazy-load-image-component";

const Images = ({ images }) => {
  let [index, setIndex] = useState(0);

  return (
    <div>
      {images[0] && (
        <div style={{ padding: ".5em 0em" }}>
          <LazyLoadImage
            onClick={() => setIndex(index + 1)}
            width={300}
            effect="opacity"
            src={images[index % images.length]}
          />
        </div>
      )}
    </div>
  );
};

const SubSection = ({ blogs }) => {
  const [hot, realtime] = blogs.map((i) => (Array.isArray(i) ? i : []));

  let [selectedBlogs, setSelectedBlogs] = useState(hot);

  return (
    <div style={{ marginTop: ".5em" }}>
      <PrimaryButton
        text={`热门(${hot.length})`}
        onClick={(_) => setSelectedBlogs(hot)}
        allowDisabledFocus
        disabled={selectedBlogs == hot}
      />
      <PrimaryButton
        text={`实时(${realtime.length})`}
        onClick={(_) => setSelectedBlogs(realtime)}
        allowDisabledFocus
        disabled={selectedBlogs == realtime}
      />

      {selectedBlogs.map((blog, i) => (
        <div
          key={i}
          style={{
            boxShadow: theme.effects.elevation8,
            padding: "0.5em 1em",
            marginTop: ".5em",
          }}
        >
          <Text variant={"small"} block>
            <b>{blog.user}</b>: {blog.text} {blog.reposts_count}🔁{" "}
            {blog.comments_count}
            💬 {blog.attitudes_count}👍
          </Text>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              // width: '100000px'
            }}
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {
              blog.pic_ids && (
                <Images
                  images={blog.pic_ids.map(
                    (id) =>
                      `https://sandy-special-gem.glitch.me/api?url=https://wx1.sinaimg.cn/large/${id}.jpg`
                  )}
                />
              )
              // blog.pic_ids.map(id => (
              //   <div>
              //     <Text
              //       style={{ fontFamily: 'Cascadia Code' }}
              //       variant={'small'}
              //     >{`https://wx1.sinaimg.cn/large/${id}.jpg`}</Text>
              //     {/* <img
              //       style={{ height: 300 }}
              //       loading="lazy"
              //       src={`https://google.com/${id}`}
              //     /> */}
              //     {/* <img
              //       style={{ height: 300 }}
              //       loading="lazy"
              //       src={getImageURL(id)}
              //     /> */}
              //   </div>
              //   // TODO: lazy loading issue

              //   // <Image
              //   //   loading={'lazy'}
              //   //   // src="https://i.ytimg.com/an_webp/msdymgkhePo/mqdefault_6s.webp?du=3000&sqp=CKS91YkG&rs=AOn4CLCvs7_vq0b49gunzaMeT8d6D5_F2w"
              //   //   // src={getImageURL(id)}
              //   //   alt={'...'}
              //   //   height={300}
              //   // />
              // ))}
            }
          </div>
          {blog.comments &&
            blog.comments.map((c, i) => (
              <Text
                key={i}
                style={{ marginTop: ".5em", marginLeft: "1em" }}
                variant={"small"}
                block
              >
                <b>{c.user}</b>: {c.text} {c.like_count}👍
              </Text>
            ))}
        </div>
      ))}
    </div>
  );
};

const Page = ({ link, full }) => {
  const { data, error } = useSWR(link, fetcher);

  if (error) return <pre>Failed to load.</pre>;
  if (!data)
    return (
      <React.Fragment>
        <Loading message={`Downloading data...`} />
      </React.Fragment>
    );

  if (!data.archive) {
    return <p>Data is not recognizable.</p>;
  }

  return (
    <div>
      {/* <p style={{ color: 'red' }}>
        {data.archiveTime}{' '}
        {link == full[full.length - 1].download_url && '(Lastet)'}
      </p> */}
      {data.archive.map((i, index) => (
        <details key={index} style={{ marginTop: ".5em" }}>
          <summary>
            <Text variant={"xLarge"}>
              {index + 1} {i.title}
            </Text>
          </summary>
          <SubSection blogs={[i.hot, i.realtime]} />
        </details>
      ))}
    </div>
  );
};

const filename2locale = (filename) => {
  filename = filename.slice(0, -5);
  // filename already contains timezone.
  return new Date(new Date(filename)).toLocaleString();
};

import {
  Dropdown,
  DropdownMenuItemType,
  IDropdownStyles,
  IDropdownOption,
} from "@fluentui/react/lib/Dropdown";
import {
  DefaultPalette,
  Stack,
  IStackStyles,
  IStackTokens,
  IStackItemStyles,
} from "@fluentui/react";

// import { Card } from "@fluentui/react-cards";

import { useTheme } from "@fluentui/react";

const ThemeMap = {
  Light: lightTheme,
  Dark: darkTheme,
  "High Contrast": highContrastTheme,
};

const useStoredTheme = (defaultTheme) => {
  const ID = "StoredTheme";
  let [t, setT] = useState(defaultTheme);

  let storedTheme = localStorage.getItem(ID);
  if (storedTheme !== null) {
    // setT(JSON.parse(storedTheme));
    // t = JSON.parse(storedTheme);
    if (Object.keys(ThemeMap).includes(storedTheme)) {
      t = storedTheme;
    }
  }

  // console.log(storedTheme);

  return [
    {
      name: t,
      theme: ThemeMap[t],
    },
    (newTheme) => {
      localStorage.setItem(ID, newTheme);
      setT(newTheme);
    },
  ];
};

const Theme = ({ storedTheme, setStoredTheme }) => {
  const [clicked, setClicked] = useState(false);
  const theme = useTheme();

  // console.log(storedTheme.name);
  return (
    <div style={{ position: "relative" }}>
      <DefaultButton
        className="border-wiper"
        style={{ "--border-color": theme.palette.themeDark }}
        onClick={() => setClicked(!clicked)}
      >
        Theme
      </DefaultButton>
      {clicked && (
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            right: 0,
            padding: "7px 7px",
            minWidth: "150px",
            boxShadow: "0 6.4px 14.4px 0 #333,0 1.2px 3.6px 0 #aaa",
          }}
        >
          {Object.keys(ThemeMap).map((t, i) => (
            <DefaultButton
              key={i}
              className={t === storedTheme ? "" : "border-just-wiper"}
              onClick={() => {
                setStoredTheme(t);
              }}
              style={{
                textAlign: "right",
              }}
            >
              {t}
            </DefaultButton>
          ))}
        </div>
      )}
    </div>
  );
};

const appTheme = createTheme({
  palette: lightTheme,
});

import { VirtualizedComboBox } from "@fluentui/react";

const comboBoxStyles = { root: { maxWidth: "300px" } };

function App() {
  const [link, setLink] = useState();
  const [full, setFull] = useState();
  const [error, setError] = useState();

  const [storedTheme, setStoredTheme] = useStoredTheme("Light");

  useEffect(async () => {
    try {
      let data = await getData();
      data.reverse();
      setFull(data);
      setLink(data[0].download_url);

      /* Let VirtualizedComboBox looks not like an input. */
      const _ = setInterval(() => {
        const i = document.querySelector("input");
        if (i) {
          i.setAttribute("inputmode", "none");
          clearInterval(_);
        }
      }, 20);
    } catch (e) {
      setError(e);
    }
  }, []);

  const memorizedOptions = useMemo(() => {
    return (
      full &&
      full.map((f) => {
        let v = filename2locale(f.name);
        return { key: f.download_url, text: v };
      })
    );
  }, [full]);

  if (error) {
    return (
      <ThemeProvider
        style={{ height: "100%" }}
        theme={createTheme({
          palette: storedTheme.theme,
        })}
      >
        <div
          id="app-root"
          style={{
            padding: ".5em .5em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Text variant="xLarge">Error</Text>
          <Text variant="small" style={{ whiteSpace: "pre-wrap" }}>
            {JSON.stringify(error, null, "\t")}
          </Text>
        </div>
      </ThemeProvider>
    );
  }

  if (!link || !full)
    return (
      <ThemeProvider
        style={{ height: "100%" }}
        theme={createTheme({
          palette: storedTheme.theme,
        })}
      >
        <div id="app-root" style={{ padding: ".5em .5em", display: "flex" }}>
          <Loading message="Getting data from https://github.com/yetanothercheer/Archive" />
        </div>
      </ThemeProvider>
    );

  // render data
  return (
    <ThemeProvider
      style={{ minHeight: "100%" }}
      theme={createTheme({
        palette: storedTheme.theme,
      })}
    >
      <div
        id="app-root"
        style={{
          padding: ".5em .5em",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flexBasis: "100%" }}>
            {/* // https://github.com/microsoft/fluentui/issues/7561 */}
            <VirtualizedComboBox
              // defaultSelectedKey={link}
              onChange={(e, o, i) => {
                setLink(full[i].download_url);
              }}
              allowFreeform={false}
              // autoComplete="on"
              options={memorizedOptions}
              // persistMenu={true}
              // scrollSelectedToTop={true}
              dropdownMaxWidth={300}
              useComboBoxAsMenuWidth
              styles={comboBoxStyles}
              selectedKey={link}
              onClick={() => {
                // `scrollSelectedToTop` seems not working. A dirty workaround:
                window.__workaround = setInterval(() => {
                  const list = document.querySelector(".ms-Callout-main");
                  if (list) {
                    if (list.scrollTop == 0 && window.__workaround_saved != 0) {
                      list.scrollTop = window.__workaround_saved;
                    } else {
                      window.__workaround_saved = list.scrollTop;
                    }
                  }
                }, 100);
              }}
            />
          </div>
          <Theme storedTheme={storedTheme} setStoredTheme={setStoredTheme} />
        </div>
        <Text variant="small" block nowrap>
          <span style={{ marginRight: ".2em" }}>Source:</span>
          <Link target="_blank" href={link} underline>
            {decodeURIComponent(link)}
          </Link>
        </Text>
        <Link href="search">
          <Text className="try_search" variant="mediumPlus" block nowrap>TRY SEARCH HERE</Text>
        </Link>

        <Page link={link} full={full} />
      </div>
    </ThemeProvider>
  );
}

import wip from "./work-in-progress-woman_at_work-o-f-daisy.png";
import Loading from "./Loading";

import { Search } from './search'
import { TextField } from '@fluentui/react/lib/TextField';

function SearchPage() {

  const [t, setT] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPage] = useState(0);

  useEffect(async () => {
    if (t) {
      let page = 0;
      let { hits, totalPages } = await (new Search()).search(t, page + 1);
      setData(hits);
      setPage(page + 1);
      setTotalPage(totalPages);
    }
  }, [t]);

  const onKeyPress = (event) => {
    if (event.key == "Enter") {
      event.preventDefault();
      setT(event.target.value);
    }
  }

  const onLoadMore = async () => {
    if (page < totalPages) {
      let { hits, totalPages } = await (new Search()).search(t, page + 1);
      setData([...data, ...hits]);
      setPage(page + 1);
      setTotalPage(totalPages);
    }
  }

  const [storedTheme, setStoredTheme] = useStoredTheme("Light");

  return (
    <div>
      <ThemeProvider
        style={{ height: "100%" }}
        theme={createTheme({
          palette: storedTheme.theme,
        })}
      >
        <div
          id="app-root"
          style={{
            padding: ".5em .5em",
            display: "flex",
            flexDirection: "column",
          }}
        >

          <Link href=".">
            <Text style={{ fontWeight: 350 }} variant={"small"}>
              &lt; Go Back
            </Text>
          </Link>
          <TextField className="CHANGE_ME" style={{ caretColor: "auto" }} label="Input and press Enter to search" onKeyPress={onKeyPress} />

          {data && data.map((i, index) => (
            <details key={index + i.filename} style={{ marginTop: ".5em" }}>
              <summary>
                <Text variant={"xLarge"}>
                  {index + 1} {i.title}
                </Text>
                <Text style={{ float: "right" }} variant={"small"}>
                  {

                    new Date(
                      Date.parse(i.filename.match(/(((?!\/).)*)\.json/)[1])
                    ).toLocaleDateString()

                  }
                </Text>
              </summary>
              <SubSection blogs={[i.hot, i.realtime]} />
            </details>
          ))}

          {(page < totalPages) &&
            <DefaultButton style={{marginTop: "1em"}} text="LOAD MORE" onClick={onLoadMore} />
          }
        </div>
      </ThemeProvider>
    </div>
  );


}

export default function () {
  if (location.href.endsWith("/search")) {
    return (<SearchPage />);
  }

  return (
    <React.Fragment>
      <div id="wip">
        {/* <!-- image source: https://publicdomainvectors.org/photos/work-in-progress-woman_at_work-o-f-daisy.png --> */}
        <img src={wip} />
      </div>
      <App />
    </React.Fragment>
  );
}
