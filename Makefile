.PHONY: staging prod dev test install page
staging:
	python main.py

prod:
	echo 👻👻👻
	echo python main.py --prod

dev:
	ipython --pdb main.py

test:
	python -m unittest

# In Makefile: $$ => $
install:
	if [ $$(command -v pyenv) ]; then pyenv install --skip-existing; fi
	pip config set global.disable-pip-version-check true
	pip install -q -r requirements.txt

page:
	cd page && sh deploy_page.sh
