import asyncio
import base64
import datetime
import json
import os
import logging

import aiohttp

logger = logging.getLogger(os.path.basename(__file__))


BOT = dict(
    name="yetanother-archivebot[bot]",
    email="90119549+yetanother-archivebot[bot]@users.noreply.github.com",
)

OWNER = "yetanothercheer"
REPO = "Archive"


def token():
    if "MY_GITHUB_TOKEN" in os.environ:
        return os.environ["MY_GITHUB_TOKEN"]
    else:
        print("! MY_GITHUB_TOKEN is not set, will not commit")
        return None


TOKEN = token()

MAIN = "main"
STAGING = "staging"

VERSION = "wb.beta"

# Timezone: UTC+08:00
utc8 = datetime.timezone(datetime.timedelta(hours=8))
now = datetime.datetime.now(utc8)
TIME = (
    f'{(now).strftime("%Y/%m/%d %H:%M UTC+08:00")}'
)
MESSAGE = f"记录于 {TIME}"
# this path should nerver be existed until now
ISO_TIME = f"{now.isoformat()}"
PATH = f"{now.year}.{now.month:0>2}.{VERSION}/{ISO_TIME}.json"

# Create or update file contents
# https://docs.github.com/en/rest/reference/repos#create-or-update-file-contents
# PUT /repos/{owner}/{repo}/contents/{path}
HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "Authorization": f"token {TOKEN}",
}


async def commit(content, path=PATH, branch=STAGING, update=False):
    if TOKEN == None:
        return
    async with aiohttp.ClientSession() as session:
        url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}"
        if type(content) == dict:
            content = json.dumps(content)
        assert type(content) == str
        content = content.encode("utf-8")
        base64content = base64.b64encode(content).decode()
        payload = {
            "message": MESSAGE,
            "content": base64content,
            "sha": "",
            "branch": branch,
            "committer": BOT,
        }

        if update:
            get_url = f"https://api.github.com/repos/{OWNER}/{REPO}/contents/{path}?ref={branch}"
            async with session.get(get_url, headers=HEADERS) as r:
                json_body = await r.json()
                payload["sha"] = json_body["sha"]

        async with session.put(url, json=payload, headers=HEADERS) as r:
            json_body = None
            if r.status in [200, 201]:
                json_body = await r.json()
                print(json_body["commit"]["sha"])
            else:
                text = await r.text()
                print(f"\n{r.status}\n{text}")
            return dict(status=r.status, data=json_body, url=url)
