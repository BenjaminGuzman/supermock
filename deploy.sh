function __ask_binary {
	while ; do
		read -p " (Y/n)? " -r ans
		if [[ "$ans" == "Y" ]]; then
			return 0
		elif [[ "$ans" == "n" || "$ans" == "N" ]]; then
			return 1
		else
			echo -e "\"$ans\" was not understood. Please enter \033[97mY\033[0m or \033[97mn\033[0m"
		fi
	done
}

function __check_dep {
	DEP_NAME="$0"
	DEP_CHECK_CMD="$1"
	DEP_INSTALLATION_CMD="$2"

	echo -n "Checking $DEP_NAME is installed... "

	$($DEP_CHECK_CMD >/dev/null 2>&1)
	if [[ "$?" -eq "0" ]]; then
		echo "✅" # dependency is indeed installed
	else
		echo -ne "❌\n\t$DEP_NAME is not installed. Would you like to install it?"
		__ask_binary
		if [[ "$?" -eq "0" ]]; then
			echo -e "Installing $DEP_NAME with command \033[97m$DEP_INSTALLATION_CMD\033[0m..."
			$($DEP_INSTALLATION_CMD)
		else
			echo "Won't install dependency $DEP_NAME"
		fi
	fi
}

function __get_distro {
	LSB_RELEASE_OUT=$(lsb-release --id --short)
	DISTROS=(gentoo ubuntu debian fedora centos rocky)
	for distro in "${DISTROS[@]}"; do
		occurrences=$(grep --ignore-case "$distro" --count <<< "$LSB_RELEASE_OUT")
		if [[ "$occurrences" -ne "0" ]]; then
			echo "$distro"
			return
		fi
	done

	# TODO try another method to detect distribution	
}

function check_deps {
	if [[ "$DISTRO" == "gentoo" ]]; then
		# Gentoo system could be running openrc instead of systemd
		# In which case proceeding with installation would be useless as it'll fail
		echo "Detected that you're on Gentoo Linux"
		echo "Because of that it is adviced to execute the steps manually"
		echo "so you have granular control of the deploy."
		echo -n "Would you like to proceed anyway? "
		__ask_binary
		if [[ "$?" -ne "0" ]]; then
			return
		fi

		__check_dep nginx "systemctl status nginx" "sudo emerge www-servers/nginx"
		__check_dep docker "systemctl status docker" "sudo emerge app-containers/docker app-containers/docker-cli"
	elif [[ "$DISTRO" == "ubuntu" || "$DISTRO" == "debian" ]]; then
		__check_dep nginx "systemctl status nginx" "sudo apt-get install -y nginx"
		__check_dep docker "systemctl status docker" "sudo apt-get update; sudo apt-get install ca-certificates curl gnupg lsb-release; sudo mkdir -p /etc/apt/keyrings curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg; echo \"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO  $(lsb_release -cs) stable\" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null; sudo apt-get update; sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
	elif [[ "$DISTRO" == "fedora" ]]; then
		__check_dep nginx "systemctl status nginx" "sudo dnf install -y nginx"
		__check_dep docker "systemctl status docker" "sudo dnf install -y dnf-plugins-core; sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo; sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
	elif [[ "$DISTRO" == "centos" || "$DISTRO" == "rocky" ]]; then
		__check_dep nginx "systemctl status nginx" "sudo yum install -y nginx"
		__check_dep docker "systemctl status docker" "sudo yum install -y yum-utils; sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo; sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin"
	fi
	
}

function help {
	echo Deploy web mock app for testing
	echo
	echo Syntax: $1 -d domain [-w directory] [-t] [-g]
	echo Options:
	echo " -h		Display this help message and exit"
	echo " -d domain	Domain name, e.g. test.benjaminguzman.dev"
	echo " -w directory	Working directory. This directory will store the git repo"
	echo "			Default: $HOME"
	echo " -t		Request and activate a TLS certificate using certbot"
	echo " -g		Use git instead of downloading files with curl or wget"
}

DISTRO=$(__get_distro)

DOMAIN=""
WORKING_DIR="$HOME"
USE_GIT="f"
while getopts ":hd:r:t" opt; do
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
for arg in DOMAIN WORKING_DIR; do
	if [[ -z "$arg" ]]; then
		echo "Argument $arg must not be empty"
		exit 1
	fi
done

echo *** Checking dependencies ***
check_deps

echo *** Download configuration files ***
cd "$WORKING_DIR"
if [[ "$USE_GIT" == "t" ]]; then
	echo Cloning repository using git

	# verify git is installed first
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
	mkdir webmock
	cd webmock

	tool=curl
	for possible_tool in curl wget; do
		which $possible_tool
		if [[ "$?" -eq "0" ]]; then
			tool=$possible_tool
		fi
	done

	echo Obtaining files via $tool
	mkdir -p backend/{users,content,auth,cart} frontend
	
	docker_compose_url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/docker-compose.yml"
	if [[ "$tool" == "curl" ]]; then
		for microservice in auth cart content users; do
			url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/backend/$microservice/.env.example"
			curl --progress-bar --output "backend/$microservice/.env.prod" "$url"
			
			echo -e "\tbackend/$microservice/.env.prod"
		done

		curl --progress-bar --output docker-compose.yml "$docker_compose_url"
		echo -e "\tdocker-compose.yml"
	elif [[ "$tool" == "wget" ]]; then
		for microservice in auth cart content users; do
			url="https://raw.githubusercontent.com/BenjaminGuzman/webmock/v2/backend/$microservice/.env.example"
			wget --quiet --show-progress --directory-prefix "backend/$microservice" --output-document .env.prod "$url"

			echo -e "\tbackend/$microservice/.env.prod"
		done

		wget --quiet --show-progress --output-document docker-compose.yml "$docker_compose_url"
		echo -e "\tdocker-compose.yml"
	fi
fi

echo *** Changing domain name to $DOMAIN ***
# TODO
echo WIP

echo *** Configuring nginx ***
# TODO
echo WIP

echo *** Configuring certbot ***
# TODO
echo WIP. Take into account -t flag!
