from sys import exc_info
import sentry_sdk


class Report:
    def __init__(self) -> None:
        sentry_sdk.init(
            "https://6500e1fc3c524e3aaf55989037afd8c0@o1142473.ingest.sentry.io/6202289",
            attach_stacktrace=True,
            release="dark-age",
            traces_sample_rate=1.0,
        )

    def exception(self, err):
        sentry_sdk.capture_exception(err)

    def message(self, msg, level="info"):
        print(f"Report:{level}:{msg}")
        sentry_sdk.capture_message(msg, level)


report = Report()
