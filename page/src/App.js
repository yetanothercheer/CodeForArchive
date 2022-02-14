import React, { useEffect, useState } from "react";
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

      {selectedBlogs.map((blog) => (
        <div
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
            blog.comments.map((c) => (
              <Text
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

  if (error) return <pre>failed to load</pre>;
  if (!data) return <pre>Get Page From: {link}.</pre>;

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
        <details style={{ marginTop: ".5em" }}>
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

const useStoredTheme = (defaultTheme) => {
  const ID = "StoredTheme";
  let [t, setT] = useState(defaultTheme);

  let storedTheme = localStorage.getItem(ID);
  if (storedTheme !== null) {
    // setT(JSON.parse(storedTheme));
    t = JSON.parse(storedTheme);
  }

  console.log(storedTheme);

  return [
    t,
    (newTheme) => {
      localStorage.setItem(ID, JSON.stringify(newTheme));
      setT(newTheme);
    },
  ];
};

const Theme = ({ storedTheme, setStoredTheme }) => {
  const [clicked, setClicked] = useState(false);
  const theme = useTheme();

  console.log(storedTheme.name);
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
          {[
            { name: "Light", theme: lightTheme },
            { name: "Dark", theme: darkTheme },
            { name: "High Contrast", theme: highContrastTheme },
          ].map((t) => (
            <DefaultButton
              className={t.name === storedTheme.name ? "" : "border-just-wiper"}
              onClick={() => {
                setStoredTheme(t);
              }}
              style={{
                textAlign: "right",
              }}
            >
              {t.name}
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

function App() {
  const [link, setLink] = useState();
  const [full, setFull] = useState();

  const [storedTheme, setStoredTheme] = useStoredTheme({
    name: "Light",
    theme: lightTheme,
  });

  console.log(storedTheme);

  useEffect(async () => {
    let data = await getData();
    data.reverse();
    setFull(data);
    setLink(data[0].download_url);
  }, []);

  if (!link || !full)
    return (
      <ThemeProvider
        theme={createTheme({
          palette: storedTheme.theme,
        })}
      >
        <div id="app-root" style={{ padding: ".5em .5em", minHeight: "100vh" }}>
          <pre>Get Links...</pre>
        </div>
      </ThemeProvider>
    );

  const dropdownStyles = {
    dropdown: { width: 300 },
  };

  const stackStyles = {
    root: {
      background: DefaultPalette.themeTertiary,
    },
  };
  const stackItemStyles = {
    root: {
      alignItems: "center",
      background: DefaultPalette.themePrimary,
      color: DefaultPalette.white,
      display: "flex",
      height: 50,
      justifyContent: "center",
    },
  };
  // Tokens definition
  const stackTokens = {
    childrenGap: 5,
    padding: 10,
  };

  // console.log(storedTheme);

  // render data
  return (
    <ThemeProvider
      theme={createTheme({
        palette: storedTheme.theme,
      })}
    >
      <div id="app-root" style={{ padding: ".5em .5em", minHeight: "100vh" }}>
        {/* <Stack horizontal styles={stackStyles} tokens={stackTokens}>
        <Stack.Item grow={1} styles={stackItemStyles} />
        <Stack.Item grow={2} styles={stackItemStyles}>
          Grow is 2
        </Stack.Item>
        <Stack.Item grow styles={stackItemStyles}>
          Grow is 1
        </Stack.Item>
      </Stack> */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <Dropdown
            // placeholder="Select an option"
            // label="Time Picker"
            onChange={(e, o, i) => setLink(full[i].download_url)}
            options={full.map((f) => {
              let v = filename2locale(f.name);
              return { key: f.download_url, text: v };
            })}
            defaultSelectedKey={link}
            styles={dropdownStyles}
          />
          <div style={{ flexBasis: "100%" }}></div>
          <Theme storedTheme={storedTheme} setStoredTheme={setStoredTheme} />
        </div>
        <Text variant="small">
          <span style={{ marginRight: ".2em" }}>Source:</span>
          <Link target="_blank" href={link} underline>
            {decodeURIComponent(link)}
          </Link>
        </Text>
        <Page link={link} full={full} />
      </div>
    </ThemeProvider>
  );
}

import wip from "./work-in-progress-woman_at_work-o-f-daisy.png";

export default function () {
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
