function help {
	echo Utility script to build and push docker images
	echo 
	echo "Syntax: $0 <build version> [<microservice>]"
	echo
	echo "build version must start with \"v2\""
	echo "Examples: v2.0-alpha, v2.1"
}

function docker_build_and_push {
	WORKING_DIR="$1"
	TAG="$2"
	CWD=$(pwd)

	echo
	echo -e "*** \033[94m$TAG\033[0m ***"
	
	cd "$WORKING_DIR" || exit 1

	echo -e "\tBuilding image \033[94m$TAG\033[0m..."
	sudo docker build --tag "$TAG" .

	echo -e "\tPushing image \033[94m$TAG\033[0m..."
	sudo docker push "$TAG"
	
	cd "$CWD"
}

VER="$1"

if [[ -z "$VER" ]]; then
	echo -e "\033[91mYou must provide a build version\033[0m"
	help
	exit 1
elif [[ "$VER" != v2* ]]; then
	echo -e "\033[91mVersion must start with \"v2\"\033[0m"
	help
	exit 1
fi

systemctl status docker > /dev/null 2>&1
if [[ "$?" -eq "3" ]]; then
	echo "Docker service is not running"
	echo "Trying to initiate docker service"
	sudo systemctl start docker
fi

if [[ ! -z "$2" ]]; then # build and push specific microservice
	MICROSERVICE="$2"
	case "$MICROSERVICE" in
		users|cart|auth|content|captcha)
			docker_build_and_push backend/$MICROSERVICE guzmanbenjamin/webmock-$MICROSERVICE:$VER
			;;
		gateway)
			docker_build_and_push frontend guzmanbenjamin/webmock-$MICROSERVICE:$VER
			;;
		*)
			echo "Invalid microservice $MICROSERVICE"
			;;
	esac
else # build and push all microservices
	# Build and push backend images
	MICROSERVICES=(auth users content cart)
	for microservice in "${MICROSERVICES[@]}"; do
		docker_build_and_push backend/$microservice guzmanbenjamin/webmock-$microservice:$VER
	done

	# Build and push frontend and gateway image
	docker_build_and_push frontend guzmanbenjamin/webmock-gateway:$VER
fi
