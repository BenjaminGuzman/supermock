#!/bin/bash

function __ask_yesno {
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

	if $DEP_CHECK_CMD > /dev/null 2>&1; then
		echo "✅" # dependency is indeed installed
	else
		echo -ne "❌\n\t$DEP_NAME is not installed. Would you like to install it"
		if __ask_yesno; then
			echo -e "Installing $DEP_NAME with command \033[97m$DEP_INSTALLATION_CMD\033[0m"
			sh -c "$DEP_INSTALLATION_CMD"
		else
			echo "Won't install dependency $DEP_NAME"
		fi
	fi
}

function __download {
	TOOL="$1"
	REMOTE_FILE="$2"
	LOCAL_FILE="$3" # optional, default = REMOTE_FILE
	if [[ -z "$LOCAL_FILE" ]]; then
		LOCAL_FILE="$REMOTE_FILE"
	fi

	if [[ "$TOOL" == "curl" ]]; then
		echo "$LOCAL_FILE"
		curl --progress-bar --output "$LOCAL_FILE" "$ROOT_DOWNLOAD_URL/$REMOTE_FILE"
	elif [[ "$TOOL" == "wget" ]]; then
		wget --quiet --show-progress --output-document "$LOCAL_FILE" "$ROOT_DOWNLOAD_URL/$REMOTE_FILE"
	else
		echo "Sorry can't handle tool $TOOL"
		echo "This is likely to be a programming error. Sorry!"
		exit 1
	fi
}

function help {
	echo Deploy web mock app for testing
	echo
	echo "Syntax: $0 -d domain [-w directory] [-g] [-t]"
	echo Options:
	echo " -h               Display this help message and exit"
	echo " -d domain        Domain name, e.g. test.benjaminguzman.dev"
	echo " -w directory     Working directory. This directory will store the git repo"
	echo "                    Default: $HOME"
	echo " -t               You plan to add TLS (https)"
	echo "                    Providing this flag will bind nginx server to 127.0.0.1:8080"
	echo "                    instead of [::]:80 and 0.0.0.0:80, and"
	echo "                    frontend will use https protocol instead of http."
	echo "                    Notice however, you should configure TLS on your own."
	echo " -g               Use git instead of downloading files with curl or wget"
}

ROOT_DOWNLOAD_URL="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2"

DOMAIN=""
WORKING_DIR="$HOME"
USE_GIT="f"
USE_TLS="f"
while getopts ":hd:w:gt" opt; do
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
		t)
			USE_TLS="t"
			;;
		\?)
			echo "Invalid option '$opt'"
			exit;;
	esac
done

# Check required arguments
if [[ -z "$DOMAIN" ]]; then
	echo -e "\033[91mYou must provide a domain name\033[0m"
	help
	exit 1
fi

echo
echo "*** Detecting distribution ***"
DISTROS=(gentoo ubuntu debian fedora centos rocky)
DISTRO=""

if which lsb-release > /dev/null 2>&1; then # detect distro with lsb-release
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
	echo -n "Would you like to proceed anyway"
	if ! __ask_yesno; then
		exit 0
	fi

	__check_dep docker "systemctl cat docker" "sudo emerge app-containers/docker app-containers/docker-cli"
elif [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" ]]; then
	__check_dep docker "systemctl cat docker" "sudo apt-get update; sudo apt-get install -y ca-certificates curl gnupg lsb-release; sudo mkdir -p /etc/apt/keyrings; curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg; echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO  $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null; sudo apt-get update; sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
elif [[ "$DISTRO" == "fedora" ]]; then
	__check_dep docker "systemctl cat docker" "sudo dnf install -y dnf-plugins-core; sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo; sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
elif [[ "$DISTRO" == "centos" || "$DISTRO" == "rocky" ]]; then
	__check_dep docker "systemctl cat docker" "sudo yum install -y yum-utils; sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo; sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
fi

echo -e "\n*** Downloading configuration files ***"
MICROSERVICES=(auth cart content users)
cd "$WORKING_DIR" || exit 1
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
	cd webmock || exit 1
else
	# if using git, webmock directory is created inside working directory
	# keep that directory structure for consistency
	mkdir webmock > /dev/null 2>&1
	cd webmock || exit 1

	tool=wget
	for possible_tool in wget curl; do
		if which $possible_tool > /dev/null 2>&1; then
			tool=$possible_tool
			break
		fi
	done

	echo Downloading files using $tool
	mkdir -p backend/{users,content,auth,cart} frontend mongo postgres > /dev/null 2>&1

	# .env files
	for microservice in "${MICROSERVICES[@]}"; do
		__download "$tool" "backend/$microservice/.env.example" "backend/$microservice/.env.prod"
	done

	# Other files
	FILES=("mongo/001-users.js" "postgres/001-db-init.sh" "postgres/002-ddl.sql" "docker-compose.yml" "backend/auth/random-secret.sh")
	for file in "${FILES[@]}"; do
		__download "$tool" "$file"
	done
fi

echo
echo "*** Creating random secret for auth microservice ***"
echo "Executing script backend/auth/random-secret.sh..."
curr_work_dir=$(pwd)
cd backend/auth || exit 1
chmod u+x random-secret.sh
./random-secret.sh > /dev/null 2>&1
cd "$curr_work_dir" || exit 1

echo
echo "*** Changing domain name to $DOMAIN ***"

PROTOCOL="http"
if [[ "$USE_TLS" == "t" ]]; then
	PROTOCOL="https"
fi

for microservice in "${MICROSERVICES[@]}"; do
	sed -i "s|https://test.benjaminguzman.dev|$PROTOCOL://$DOMAIN|g" "backend/$microservice/.env.prod"
	echo "backend/$microservice/.env.prod"
done

sed -i "s|https://test.benjaminguzman.dev|$PROTOCOL://$DOMAIN|g" docker-compose.yml

echo
echo "*** Configuring nginx ***"

if [[ "$USE_TLS" == "t" ]]; then
	echo "TLS is intended to be used. Nginx HTTP server will bind to port 8080"
	sed -i 's|"80:80"|"8080:80"|g' docker-compose.yml

	# check nginx is installed
	# TODO: check certbot is installed?
	if [[ "$DISTRO" == "gentoo" ]]; then
		__check_dep nginx "systemctl cat nginx" "sudo emerge www-servers/nginx"
	elif [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" ]]; then
		__check_dep nginx "systemctl cat nginx" "sudo apt-get install -y nginx"
	elif [[ "$DISTRO" == "fedora" ]]; then
		__check_dep nginx "systemctl cat nginx" "sudo dnf install -y nginx"
	elif [[ "$DISTRO" == "centos" || "$DISTRO" == "rocky" ]]; then
		__check_dep nginx "systemctl cat nginx" "sudo yum install -y nginx"
	fi
else
	echo "TLS is not intended to be used. Nginx HTTP server will bind to port 80"
fi

echo
echo "*** Next steps ***"
echo " * (Optional) Add TLS certificate using certbot and Let's Encrypt"
echo "     Useful links:"
echo "       https://certbot.eff.org/"
echo
echo " * Start containers"
echo -en "\033[94m"
echo "     sudo docker compose up -d"
echo -en "\033[0m"
echo

echo -n "Would you like to start the containers now"
if __ask_yesno; then
	echo
	echo "*** Starting containers ***"
	sudo docker compose up -d
fi
