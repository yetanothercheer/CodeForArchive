import React, { useEffect, useState, useMemo } from "react";
import "./styles.css";

// : < This is frustrating...
// import { ThemeProvider } from "@fluentui/react-theme-provider";
import { ThemeProvider } from "@fluentui/react";
import { createTheme } from "@fluentui/theme";

import { lightTheme, darkTheme, highContrastTheme } from "./theme";

import { getData, useLinkGetData } from './api';

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
                // <Images
                //   images={blog.pic_ids.map(
                //     (id) =>
                //       // `https://sandy-special-gem.glitch.me/api?url=https://wx1.sinaimg.cn/large/${id}.jpg`
                //       `https://wx1.sinaimg.cn/large/${id}.jpg`
                //   )}
                // />
                // blog.pic_ids.map(id => <Text variant={"small"}>https://wx1.sinaimg.cn/large/${id}.jpg</Text>)
                <></>
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
  const { data, error } = useLinkGetData(link);

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
import {
  DatePicker,
  DayOfWeek,
  mergeStyles,
  defaultDatePickerStrings,
} from '@fluentui/react';


const days = [
  { text: 'Sunday', key: DayOfWeek.Sunday },
  { text: 'Monday', key: DayOfWeek.Monday },
  { text: 'Tuesday', key: DayOfWeek.Tuesday },
  { text: 'Wednesday', key: DayOfWeek.Wednesday },
  { text: 'Thursday', key: DayOfWeek.Thursday },
  { text: 'Friday', key: DayOfWeek.Friday },
  { text: 'Saturday', key: DayOfWeek.Saturday },
];

const rootClass = mergeStyles({
  maxWidth: 300,
  marginRight: 15,
  marginTop: 6,
  selectors: { '> *': { marginBottom: 15 } }
});

const MyDatePicker = ({ onDatePicked, defaultValue }) => {
  return (
    <div className={rootClass}>
      <DatePicker
        placeholder="Select a date..."
        ariaLabel="Select a date"
        strings={defaultDatePickerStrings}
        maxDate={new Date()}
        minDate={new Date("2021/09/04")}
        onSelectDate={onDatePicked}
        value={defaultValue}
      />
    </div>
  );
}


const comboBoxStyles = { root: { maxWidth: "300px" } };

function App({ storedTheme, setStoredTheme }) {
  const [link, setLink] = useState();
  const [full, setFull] = useState();
  const [error, setError] = useState();
  const [pick, setpick] = useState(new Date());

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
    let ret = (
      full &&
      full.filter((f) => {
        if (pick) {
          let date1 = new Date(new Date(f.name.slice(0, -5)));
          if (date1.getDate() == pick.getDate() && date1.getMonth() == pick.getMonth() && date1.getFullYear() == pick.getFullYear()) {
            return true;
          }
        }
        return false;
      }).map((f) => {
        let v = filename2locale(f.name);
        return { key: v, text: v, url: f.download_url };
      })
    );

    if (ret && ret[0]) {
      setLink(ret[0].url);
    }
    return ret;
  }, [full, pick]);

  if (error) {
    return (
      <React.Fragment>
        <Text variant="xLarge">Error</Text>
        <Text variant="small" style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(error, null, "\t")}
        </Text>
      </React.Fragment>
    );
  }

  if (!link || !full)
    return (
      <Loading message="Getting data from https://github.com/yetanothercheer/Archive" />
    );

  // render data
  return (

    <React.Fragment
    >

      <div style={{ display: "flex", alignItems: "center" }}>
        <MyDatePicker onDatePicked={setpick} defaultValue={pick} />

        <div style={{ flexBasis: "100%" }}>
          {/* // https://github.com/microsoft/fluentui/issues/7561 */}
          <VirtualizedComboBox
            defaultSelectedKey={memorizedOptions[0] && memorizedOptions[0].key}
            onChange={(e, o, i) => {
              setLink(memorizedOptions[i].url);
            }}
            allowFreeform={false}
            // autoComplete="on"
            options={memorizedOptions}
            // persistMenu={true}
            // scrollSelectedToTop={true}
            dropdownMaxWidth={300}
            useComboBoxAsMenuWidth
            styles={comboBoxStyles}
          // selectedKey={link}
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
      {/* <Link href="search">
        <Text className="try_search" variant="mediumPlus" block nowrap>TRY SEARCH HERE</Text>
      </Link> */}

      <Page link={link} full={full} />
    </React.Fragment>
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
    <div style={{ paddingTop: 5 }}>

      <TextField className="CHANGE_ME" style={{ caretColor: "auto" }} placeholder="Input and press Enter to search" onKeyPress={onKeyPress} />

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
        <DefaultButton style={{ marginTop: "1em" }} text="LOAD MORE" onClick={onLoadMore} />
      }

    </div>
  );


}

import { Icon, IStyleSet, Label, ILabelStyles, Pivot, IPivotItemProps, PivotItem } from '@fluentui/react';

const labelStyles = {
  root: { marginTop: 10 },
};

export default function () {
  const [storedTheme, setStoredTheme] = useStoredTheme("Light");

  return (
    <React.Fragment>
      <ThemeProvider
        style={{ height: "100%" }}
        theme={createTheme({
          palette: storedTheme.theme,
        })}
      >
        <div id="wip">
          {/* <!-- image source: https://publicdomainvectors.org/photos/work-in-progress-woman_at_work-o-f-daisy.png --> */}
          <img src={wip} />
        </div>

        <div
          id="app-root"
          style={{
            padding: ".5em .5em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Pivot>
            <PivotItem headerText="History" itemIcon="History">
              <App storedTheme={storedTheme} setStoredTheme={setStoredTheme} />
            </PivotItem>
            {/* <PivotItem headerText="Search" itemIcon="Search">
              <SearchPage />
            </PivotItem> */}
          </Pivot>

        </div>

      </ThemeProvider>
    </React.Fragment>
  );
}
