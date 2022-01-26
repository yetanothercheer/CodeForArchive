import asyncio
import json
import logging
import sys
from time import time
from typing import Any
from urllib import parse

import aiohttp
from bs4 import BeautifulSoup

logger = logging.getLogger(__file__)

# Proxy http requests, avoid rate limit of server.
PROXIES = [
    "https://for-good-001.glitch.me/api?url=",
    "https://for-good-002.glitch.me/api?url=",
    "https://for-good-003.glitch.me/api?url=",
    "https://for-good-004.glitch.me/api?url=",
]

# NOTE: Proxy Source Code
"""
const fetch = require("node-fetch");

fastify.get("/api", async function(request, reply) {
  if (request.query.url) {
    try {
      console.log(request.query.url)
      let result = await fetch(encodeURI(request.query.url));
      let buffer = await result.buffer();
      reply
        .code(200)
        // .header("Cache-Control", "max-age=3600")
        .header("content-type", result.headers.get("content-type"))
        .send(buffer);
    } catch (e) {
      reply.send({sorry: JSON.stringify(e)});
    }
  } else {
    reply.send({sorry: "URL Please."});
  }
});
"""

counter = 0
rate_limit = []
CONN_PER_SECOND = 10

from dataclasses import dataclass


@dataclass
class Response:
    status: int
    data: Any
    url: str


async def get(url):
    global counter
    global rate_limit
    while len(rate_limit) >= CONN_PER_SECOND:
        await asyncio.sleep(0.01)
        rate_limit = list(filter(lambda t: time() - t < 1, rate_limit))
    rate_limit.append(time())

    counter += 1
    async with aiohttp.ClientSession() as session:
        url = PROXIES[counter % len(PROXIES)] + parse.quote(url)
        async with session.get(url) as resp:
            status = resp.status
            if status != 200:
                logger.error(f"NOT_OK_ERROR {status}: {url}")
            json_body = None
            try:
                json_body = await resp.json()
            except:
                text = await resp.text()
                logger.error(f"NOT_JSON_EEROR {url}\n{text}")
                status = -1
            return Response(status=status, data=json_body, url=url)
