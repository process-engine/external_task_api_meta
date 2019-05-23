# remove "node_modules"
echo "Purging node_modules..."
find . -name "node_modules" -exec rm -rf '{}' +
echo "Done. Starting setup..."

echo "Clearing npm cache"
npm cache clean --force

# install all necessary dependencies
echo "Running npm install"
npm install --no-package-lock

if [[ "$?" -ne "0" ]]; then
  printf "\e[1;31mNPM install failed! Aborting...\e[0m\n";
  exit 1;
fi

# build all packages
echo "Building .TS packages"
meta exec "npm run build" --exclude external_task_api_meta,external_task_api_contracts,external_task_api_client


function install_and_build_package {
  cd typescript
  npm install --no-package-lock
  cd ..

  if [ -x "$(command -v dotnet)" ]; then
    cd dotnet/src
    dotnet restore && dotnet build
    cd ../..
  else
    echo ""
    echo "WARNING: skipping dotnet (since it is not installed)."
    echo ""
  fi
}

echo "-------------------------------------------------"
echo "Installing ExternalTask API Contracts"
echo "-------------------------------------------------"
cd external_task_api_contracts
install_and_build_package
cd ..

echo "-------------------------------------------------"
echo "Installing ExternalTask API Client"
echo "-------------------------------------------------"
cd external_task_api_client
install_and_build_package
cd ..

echo "done"
