# make sure meta and gulp are installed
npm install -g meta gulp

# checkout all repos in the correct branch
meta git update
meta exec "git checkout develop" --exclude external_task_api_meta,external_task_api_contracts

# retrieve latest versions
meta git pull

# install all necessary dependencies
npm install --no-package-lock

if [[ "$?" -ne "0" ]]; then
  printf "\e[1;31mNPM install failed! Aborting...\e[0m\n";
  exit 1;
fi

# build all packages and schemas
meta exec "npm run build" --exclude external_task_api_meta,external_task_api_contracts
