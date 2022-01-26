import asyncio
import json
from crawler import get_all
from github import commit, MAIN, STAGING, ISO_TIME
import argparse
import logging

LOG_FILE = f"log@{ISO_TIME}.txt".replace(":", "_")
import os
logger = logging.getLogger(os.path.basename(__file__))


async def main():
    logging.basicConfig(
        filename=LOG_FILE,
        filemode="a",
        format="[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] %(message)s",
        datefmt="%d/%b/%Y %H:%M:%S",
        level=logging.INFO,
    )

    logger.info("main()")

    parser = argparse.ArgumentParser()
    parser.add_argument("--prod", dest="prod", action="store_true")
    parser.set_defaults(prod=False)
    args = parser.parse_args()

    data = await get_all()
    archive = dict(archive=data)
    if args.prod:
        response = await commit(archive, branch=MAIN)
    else:
        response = await commit(archive, branch=STAGING)


if __name__ == "__main__":
    asyncio.run(main(), debug=True)
    # loop = asyncio.get_event_loop()
    # loop.run_until_complete(asyncio.sleep(0.250))
    # loop.close()
