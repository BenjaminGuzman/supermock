#!/bin/bash

function __ask_binary {
	while true; do
		read -p " (Y/n)? " -r ans
		if [[ "$ans" == "Y" ]]; then
			return 0
		elif [[ "$ans" == "n" || "$ans" == "N" ]]; then
			return 1
		else
			echo -ne "\"$ans\" was not understood. Please enter \033[97mY\033[0m or \033[97mn\033[0m"
		fi
	done
}

function __check_dep {
	DEP_NAME="$1"
	DEP_CHECK_CMD="$2"
	DEP_INSTALLATION_CMD="$3"

	echo -n "Checking $DEP_NAME is installed... "

	$DEP_CHECK_CMD > /dev/null 2>&1
	if [[ "$?" -eq "0" ]]; then
		echo "✅" # dependency is indeed installed
	else
		echo -ne "❌\n\t$DEP_NAME is not installed. Would you like to install it"
		__ask_binary
		if [[ "$?" -eq "0" ]]; then
			echo -e "Installing $DEP_NAME with command \033[97m$DEP_INSTALLATION_CMD\033[0m"
			sh -c "$DEP_INSTALLATION_CMD"
		else
			echo "Won't install dependency $DEP_NAME"
		fi
	fi
}

function help {
	echo Deploy web mock app for testing
	echo
	echo Syntax: $0 -d domain [-w directory] [-g]
	echo Options:
	echo " -h		Display this help message and exit"
	echo " -d domain	Domain name, e.g. test.benjaminguzman.dev"
	echo " -w directory	Working directory. This directory will store the git repo"
	echo "                  Default: $HOME"
	echo " -g		Use git instead of downloading files with curl or wget"
}

DOMAIN=""
WORKING_DIR="$HOME"
USE_GIT="f"
while getopts ":hd:w:g" opt; do
	case $opt in
		h)
			help
			exit;;
		d)
			DOMAIN="$OPTARG"
			;;
		w)
			WORKING_DIR="$OPTARG"
			;;
		g)
			USE_GIT="t"
			;;
		?)
			echo "Invalid option $opt"
			exit;;
	esac
done

# Check required arguments
if [[ -z "$DOMAIN" ]]; then
	echo -e "\033[91mYou must provide a domain name\033[0m"
	help
	exit 1
elif [[ -z "$WORKING_DIR" ]]; then
	echo -e "\033[91mYou must provide a working directory\033[0m"
	help
	exit 1
fi

echo
echo "*** Detecting distribution ***"
DISTROS=(gentoo ubuntu debian fedora centos rocky)
DISTRO=""

which lsb-release > /dev/null 2>&1
if [[ "$?" -eq "0" ]]; then # detect distro with lsb-release
	LSB_RELEASE_OUT=$(lsb-release --id --short)
	for distro in "${DISTROS[@]}"; do
		occurrences=$(grep --ignore-case "$distro" --count <<< "$LSB_RELEASE_OUT")
		if [[ "$occurrences" -ne "0" ]]; then
			DISTRO="$distro"
			break
		fi
	done
else # detect distro with release files
	if [[ -f "/etc/redhat-release" ]]; then
		# /etc/redhat-release does contain the distribution name
		# e.g. "Rocky Linux release 8.6 (Green Obsidian)", "CentOS Stream release 9", ...
		for distro in fedora centos rocky; do
			occurrences=$(more /etc/redhat-release | grep --ignore-case "$distro" --count)
			if [[ "$occurrences" -ne "0" ]]; then
				DISTRO="$distro"
				break
			fi
		done
	elif [[ -f "/etc/debian_version" ]]; then
		# /etc/debian_version only contains information about the version
		# e.g. 11, sid, ...
		# So, to differentiate we use uname
		for distro in debian ubuntu; do
			occurrences=$(uname -a | grep --ignore-case "$distro" --count)
			if [[ "$occurrences" -ne "0" ]]; then
				DISTRO="$distro"
			fi
		done
	elif [[ -f "/etc/gentoo-release" ]]; then
		DISTRO="gentoo"
	fi
fi

echo "Distribution detected: $DISTRO"

echo
echo "*** Checking dependencies ***"
if [[ "$DISTRO" == "gentoo" ]]; then
	# Gentoo system could be running openrc instead of systemd
	# In which case proceeding with installation would be useless as it'll fail
	echo "Detected that you're on Gentoo Linux"
	echo "Because of that it is recommended to execute the steps manually"
	echo "so you have granular control of the deploy."
	echo -n "Would you like to proceed anyway? "
	__ask_binary
	if [[ "$?" -ne "0" ]]; then
		exit 0
	fi

	__check_dep nginx "systemctl cat nginx" "sudo emerge www-servers/nginx"
	__check_dep docker "systemctl cat docker" "sudo emerge app-containers/docker app-containers/docker-cli"
elif [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" ]]; then
	__check_dep nginx "systemctl cat nginx" "sudo apt-get install -y nginx"
	__check_dep docker "systemctl cat docker" "sudo apt-get update; sudo apt-get install -y ca-certificates curl gnupg lsb-release; sudo mkdir -p /etc/apt/keyrings; curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg; echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO  $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null; sudo apt-get update; sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
elif [[ "$DISTRO" == "fedora" ]]; then
	__check_dep nginx "systemctl cat nginx" "sudo dnf install -y nginx"
	__check_dep docker "systemctl cat docker" "sudo dnf install -y dnf-plugins-core; sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo; sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
elif [[ "$DISTRO" == "centos" || "$DISTRO" == "rocky" ]]; then
	__check_dep nginx "systemctl cat nginx" "sudo yum install -y nginx"
	__check_dep docker "systemctl cat docker" "sudo yum install -y yum-utils; sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo; sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
fi

echo -e "\n*** Downloading configuration files ***"
MICROSERVICES=(auth cart content users)
cd "$WORKING_DIR"
if [[ "$USE_GIT" == "t" ]]; then
	echo Cloning repository using git

	# First, verify git is installed
	if [[ "$DISTRO" == "gentoo" ]]; then
		__check_dep git "git --help" "sudo emerge dev-vcs/git"
	elif [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" ]]; then
		__check_dep git "git --help" "sudo apt-get install -y git"
	elif [[ "$DISTRO" == "fedora" ]]; then
		__check_dep git "git --help" "sudo dnf install -y git"
	elif [[ "$DISTRO" == "centos" || "$DISTRO" == "rocky" ]]; then
		__check_dep git "git --help" "sudo yum install -y git"
	fi

	git clone git@github.com:BenjaminGuzman/webmock.git
	cd webmock
else
	# if using git, webmock directory is created inside working directory
	# keep that directory structure for consistency
	mkdir webmock > /dev/null 2>&1
	cd webmock

	tool=wget
	for possible_tool in wget curl; do
		which $possible_tool > /dev/null
		if [[ "$?" -eq "0" ]]; then
			tool=$possible_tool
			break
		fi
	done

	echo Obtaining files via $tool
	mkdir -p backend/{users,content,auth,cart} frontend > /dev/null 2>&1
	
	docker_compose_url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/docker-compose.yml"
	random_secret_url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/backend/auth/random-secret.sh"
	if [[ "$tool" == "curl" ]]; then
		for microservice in "${MICROSERVICES[@]}"; do
			url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/backend/$microservice/.env.example"
			
			echo "backend/$microservice/.env.prod"
			curl --progress-bar --output "backend/$microservice/.env.prod" "$url"
		done

		echo "docker-compose.yml"
		curl --progress-bar --output docker-compose.yml "$docker_compose_url"

		echo "backend/auth/random-secret.sh"
		curl --progress-bar --output "backend/auth/random-secret.sh" "$random_secret_url"
	elif [[ "$tool" == "wget" ]]; then
		for microservice in "${MICROSERVICES[@]}"; do
			url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/backend/$microservice/.env.example"
			wget --quiet --show-progress --output-document "backend/$microservice/.env.prod" "$url"
		done

		wget --quiet --show-progress --output-document docker-compose.yml "$docker_compose_url"
		wget --quiet --show-progress --output-document "backend/auth/random-secret.sh" "$random_secret_url"
	fi
fi

echo
echo "*** Creating random secret for auth microservice ***"
echo "Executing script backend/auth/random-secret.sh..."
curr_work_dir=$(pwd)
cd backend/auth
chmod u+x random-secret.sh
./random-secret.sh > /dev/null 2>&1
cd "$curr_work_dir"

echo -e "\n*** Changing domain name to $DOMAIN ***"
for microservice in "${MICROSERVICES[@]}"; do
	sed -i "s|test.benjaminguzman.dev|$DOMAIN|g" "backend/$microservice/.env.prod"
	echo backend/$microservice/.env.prod
done

echo
echo "*** Configuring nginx ***"
NGINX_CONFIG_FILE="/etc/nginx/conf.d/$DOMAIN.conf"
if [[ -f "$NGINX_CONFIG_FILE" ]]; then
	echo -n "$NGINX_CONFIG_FILE already exists. Overwrite (.bak file will be created)"
	__ask_binary
	if [[ "$?" -eq "0" ]]; then # Answer was "Y"
		sudo cp "$NGINX_CONFIG_FILE" "$NGINX_CONFIG_FILE.bak"
	else
		exit 0
	fi
else
	echo "Creating configuration file $NGINX_CONFIG_FILE..."
	sudo touch "$NGINX_CONFIG_FILE"
	sudo chmod 0600 "$NGINX_CONFIG_FILE"
fi

sudo sh -c "cat > \"$NGINX_CONFIG_FILE\" <<EOF
server {
	listen 80 default_server;
	listen [::]:80 default_server;
	server_name $DOMAIN;

	error_page 404 /; # let angular handle 404
	root $WORKING_DIR/webmock/frontend/dist/webmock;

	location /v2/cart {
		proxy_pass		http://127.0.0.1:3000;
		proxy_set_header	X-Forwarded-For \$proxy_add_x_forwarded_for;
	}

	location /v2/users {
		proxy_pass		http://127.0.0.1:4000;
		proxy_set_header	X-Forwarded-For \$proxy_add_x_forwarded_for;
	}

	location /v2/content {
		proxy_pass		http://127.0.0.1:5000;
		proxy_set_header	X-Forwarded-For \$proxy_add_x_forwarded_for;
	}
}
EOF"

if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
	echo Deleting default HTTP server config...
	sudo rm /etc/nginx/sites-enabled/default
fi

echo Reloading nginx...
sudo systemctl reload nginx

echo Done.
echo
echo "*** Next steps ***"
echo "1. Build frontend on local machine and copy dist files to server"
echo -e "\033[94m"
echo "     cd frontend && npm run build && scp -r dist/ $(whoami)@$DOMAIN:$WORKING_DIR/webmock/frontend"
echo -e "\033[0m"
echo "     (👆 run on local machine)"
echo 
echo "2. (Optional) Add TLS certificate using certbot and Let's Encrypt"
echo "   Useful links:"
echo "    https://certbot.eff.org/"
echo
echo "3. Start backend containers"
echo -e "\033[94m"
echo "     sudo docker compose up -d"
echo -e "\033[0m"

echo -n "Would you like to execute step 3 now"
__ask_binary
if [[ "$?" -eq "0" ]]; then
	echo
	echo "*** Starting containers ***"
	sudo docker compose up -d
fi
