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

if [[ ! -z "$2" ]]; then # build and push specific microservice
	MICROSERVICE="$2"
	case "$MICROSERVICE" in
		users|cart|auth|content)
			docker_build_and_push backend/$MICROSERVICE guzmanbenjamin/webmock-$MICROSERVICE:$VER
			;;
		frontend)
			docker_build_and_push frontend guzmanbenjamin/webmock-$MICROSERVICE:$VER
			;;
		*)
			echo "Invalid microservice $MICROSERVICE"
			;;
	esac
else # build and push all microservices
	# Build and push backend images
	docker_build_and_push backend/users guzmanbenjamin/webmock-users:$VER
	docker_build_and_push backend/auth guzmanbenjamin/webmock-auth:$VER
	docker_build_and_push backend/content guzmanbenjamin/webmock-content:$VER

	# Build and push frontend and gateway image
	docker_build_and_push frontend guzmanbenjamin/webmock-gateway:$VER
fi
