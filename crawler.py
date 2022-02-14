import asyncio
import logging
import sys
from typing import Any, Sequence

import aiohttp
from bs4 import BeautifulSoup

from get import get
import os

from report import report

# CONSIDER: serialize json with type hints
# https://github.com/samuelcolvin/pydantic

logger = logging.getLogger(os.path.basename(__file__))

# API
url_main_realtime = r"https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&title=%E5%BE%AE%E5%8D%9A%E7%83%AD%E6%90%9C&extparam=seat%3D1%26pos%3D0_0%26dgr%3D0%26mi_cid%3D100103%26cate%3D10103%26filter_type%3Drealtimehot%26c_type%3D30%26display_time%3D1642858758%26pre_seqid%3D234361947&luicode=10000011&lfid=231583"
url_hot = (
    lambda title: fr"https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D60%26q%3D%23{title}%23%26t%3D10&isnewpage=1&extparam=seat%3D1%26filter_type%3Drealtimehot%26dgr%3D0%26cate%3D0%26pos%3D1%26realpos%3D2%26flag%3D2%26c_type%3D31%26display_time%3D1642858915%26pre_seqid%3D1642858915014031711308&luicode=10000011&lfid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&page_type=searchall"
)
url_realtime = (
    lambda title: fr"https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D61%26q%3D%23{title}%23%26t%3D10&isnewpage=1&extparam=seat%3D1%26filter_type%3Drealtimehot%26dgr%3D0%26cate%3D0%26pos%3D1%26realpos%3D2%26flag%3D2%26c_type%3D31%26display_time%3D1642858915%26pre_seqid%3D1642858915014031711308&luicode=10000011&lfid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&page_type=searchall"
)
url_comments = (
    lambda id, mid: fr"https://m.weibo.cn/comments/hotflow?id={id}&mid={mid}&max_id_type=0"
)


def extract_text_from_html(html):
    # logger.info(f"{html}")
    soup = BeautifulSoup(html, features="html.parser")
    return soup.text.strip()


def err():
    import sys

    sys.stdout.write("x")
    sys.stdout.flush()


# Copied From: https://gist.github.com/jcayzac/1485005?permalink_comment_id=3587627#gistcomment-3587627
WIDE_MAP = {i: i + 0xFEE0 for i in range(0x21, 0x7F)}
WIDE_MAP[0x20] = 0x3000


def widen(s):
    return s.translate(WIDE_MAP)


# Consider: https://dev.to/0xbf/use-dot-syntax-to-access-dictionary-key-python-tips-10ec
async def get_under(url, title):
    response = await get(url)
    if response.status != 200:
        err()
        return []
    response = response.data
    cards = response["data"]["cards"]
    cards = filter(lambda c: c["card_type"] == 9, cards)
    info: Sequence[Any] = list(
        map(
            lambda c: dict(
                text=extract_text_from_html(c["mblog"]["text"]),
                attitudes_count=c["mblog"]["attitudes_count"],
                comments_count=c["mblog"]["comments_count"],
                reposts_count=c["mblog"]["reposts_count"],
                created_at=c["mblog"]["created_at"],
                isLongText=c["mblog"]["isLongText"],
                id=c["mblog"]["id"],
                mid=c["mblog"]["mid"],
                user=c["mblog"]["user"]["screen_name"],
                pic_ids=c["mblog"]["pic_ids"],
            ),
            list(cards),
        )
    )

    mblogs = []
    for i in info:
        if i["isLongText"]:
            url = f"https://m.weibo.cn/statuses/extend?id={i['id']}"
            result = await get(url)
            if result.status != 200:
                i.pop("isLongText")
                err()
                continue
            response = result.data
            i["text"] = extract_text_from_html(response["data"]["longTextContent"])
        i.pop("isLongText")

        if i["comments_count"] > 0:
            url = url_comments(i["id"], i["mid"])
            result = await get(url)
            if result.status != 200:
                err()
                continue
            result = result.data
            if "data" in result:
                comments = result["data"]["data"]
                comments = map(
                    lambda c: dict(
                        # created_at=c["created_at"],
                        like_count=c["like_count"],
                        text=extract_text_from_html(c["text"]),
                        user=c["user"]["screen_name"],
                    ),
                    comments,
                )
                i["comments"] = list(comments)

        i.pop("id")
        i.pop("mid")

        logger.info(
            widen(
                f"#{title[0:16] + '#':<17} {i['text'][0:32]:<32} +{i['comments_count']}"
            )
        )
        import sys

        sys.stdout.write(".")
        sys.stdout.flush()
        mblogs.append(i)

    return mblogs


async def get_title(title):
    hot = await get_under(url_hot(title), title)
    realtime = await get_under(url_realtime(title), title)
    return dict(title=title, hot=hot, realtime=realtime)


async def get_all():
    response = await get(url_main_realtime)
    if response.status != 200:
        report.message("Cannot get main page", "fatal")
        sys.exit(1)
    r = response.data["data"]["cards"][0]["card_group"]
    titles = list(map(lambda i: i["desc"], r))
    for i, v in enumerate(titles):
        logger.info(f"{i + 1:>2} {v}")
    # output = [await get_title(title) for title in list(titles)]
    output = await asyncio.gather(*[get_title(title) for title in titles])
    print("")
    return output
