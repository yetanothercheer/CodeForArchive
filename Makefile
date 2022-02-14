.PHONY: staging prod dev test install page
staging:
	SENTRY_ENVIRONMENT=staging python main.py

prod:
	SENTRY_ENVIRONMENT=production python main.py --prod

dev:
	ipython --pdb main.py

test:
	python -m unittest

# In Makefile: $$ => $
# Also, pyenv is not always necessary. Default Python 3.8 works fine.
# if [ $(command -v pyenv) ]; then pyenv install --skip-existing; fi
install:
	pip config set global.disable-pip-version-check true
	pip install -q -r requirements.txt

page:
	cd page && sh deploy_page.sh
