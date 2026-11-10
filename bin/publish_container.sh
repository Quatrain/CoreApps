#!/usr/bin/env bash
# Builds a container under containers/<name> and pushes it to the sovereign registry.
#
# Usage: bin/publish_container.sh <name>
#
# - develop: pushes :develop and :sha-<short>
# - main:    bumps the patch version in containers/<name>/package.json, pushes
#            :<version>, :latest and :sha-<short>, commits the bump with [skip ci]
#            and creates the git tag <name>-v<version>.
#
# Images are multi-arch (PLATFORMS, default linux/amd64,linux/arm64). Layers for the runner's
# own architecture build natively; the others build under QEMU emulation through docker buildx
# (installed on demand). The qtrn.io runners are arm64, so amd64 is the emulated one.
#
# Environment: REGISTRY (default qtrn.io), REGISTRY_USER, REGISTRY_TOKEN, GITHUB_REF_NAME, GITHUB_SHA,
#              PLATFORMS.
set -euo pipefail

BINFMT_IMAGE="tonistiigi/binfmt:qemu-v10.2.3-68"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

# Installs the Docker CLI with the buildx plugin from Docker's official apt repository
# (signed by Docker's key). Debian's docker.io client does not pick up a standalone
# buildx plugin, so it is not used here.
ensure_buildx() {
  if docker buildx version >/dev/null 2>&1; then
    return 0
  fi
  # Read os-release in a subshell: sourcing it here would overwrite NAME, VERSION and ID.
  local distro codename
  distro="$(. /etc/os-release && echo "${ID}")"
  codename="$(. /etc/os-release && echo "${VERSION_CODENAME}")"
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL "https://download.docker.com/linux/${distro}/gpg" -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/${distro} ${codename} stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq
  apt-get install -y -qq docker-ce-cli docker-buildx-plugin
  docker version
  docker buildx version
}

NAME="${1:?usage: publish_container.sh <container-name>}"
DIR="containers/${NAME}"
REGISTRY="${REGISTRY:-qtrn.io}"
IMAGE="${REGISTRY}/quatrain/${NAME}"
BRANCH="${GITHUB_REF_NAME:?GITHUB_REF_NAME is required}"
SHORT_SHA="$(git rev-parse --short=7 "${GITHUB_SHA:-HEAD}")"

if [ ! -f "${DIR}/ContainerFile" ]; then
  echo "No ContainerFile in ${DIR}" >&2
  exit 1
fi
if [ -z "${REGISTRY_USER:-}" ] || [ -z "${REGISTRY_TOKEN:-}" ]; then
  echo "Repository secrets REGISTRY_USER and REGISTRY_TOKEN are required (Settings > Actions > Secrets)." >&2
  exit 1
fi

TAGS=("sha-${SHORT_SHA}")
case "${BRANCH}" in
  main)
    git config --global user.name "forgejo-actions"
    git config --global user.email "forgejo-actions@git.qtrn.io"
    git pull --rebase origin main --autostash
    PKG_NAME="$(jq -r .name "${DIR}/package.json")"
    VERSION="$(jq -r .version "${DIR}/package.json" | awk -F. '{ printf "%d.%d.%d", $1, $2, $3 + 1 }')"
    jq --arg v "${VERSION}" '.version = $v' "${DIR}/package.json" > "${DIR}/package.json.tmp"
    mv "${DIR}/package.json.tmp" "${DIR}/package.json"
    TAGS+=("${VERSION}" "latest")
    ;;
  develop)
    TAGS+=("develop")
    ;;
  *)
    echo "Images are only published from develop or main (got ${BRANCH})." >&2
    exit 1
    ;;
esac


# The Docker CLI is installed here: it must precede any other docker command.
ensure_buildx
echo "${REGISTRY_TOKEN}" | docker login "${REGISTRY}" -u "${REGISTRY_USER}" --password-stdin
# Register QEMU only for the target platforms that differ from the daemon's architecture.
NATIVE_ARCH="$(docker version --format '{{.Server.Arch}}')"
FOREIGN_ARCHS="$(tr ',' '\n' <<<"${PLATFORMS}" | awk -F/ -v native="${NATIVE_ARCH}" '$2 != native { print $2 }' | paste -sd, -)"
echo "Native architecture: ${NATIVE_ARCH}; emulated: ${FOREIGN_ARCHS:-none}"
if [ -n "${FOREIGN_ARCHS}" ]; then
  docker run --privileged --rm "${BINFMT_IMAGE}" --install "${FOREIGN_ARCHS}"
fi
docker buildx create --name "publish-${NAME}" --driver docker-container --use >/dev/null

BUILD_ARGS=()
for t in "${TAGS[@]}"; do BUILD_ARGS+=(--tag "${IMAGE}:${t}"); done
docker buildx build \
  --platform "${PLATFORMS}" \
  --file "${DIR}/ContainerFile" \
  "${BUILD_ARGS[@]}" \
  --push \
  "${DIR}"
docker buildx imagetools inspect "${IMAGE}:sha-${SHORT_SHA}"

if [ "${BRANCH}" = "main" ]; then
  git add "${DIR}/package.json"
  git commit --no-verify -m "chore(release): publish v${VERSION} of ${PKG_NAME} [skip ci]"
  # Another container workflow may have pushed its own release commit meanwhile.
  git pull --rebase origin main
  git tag -a "${NAME}-v${VERSION}" -m "Release ${PKG_NAME} v${VERSION} [skip ci]"
  git push --no-verify origin "HEAD:main"
  git push --no-verify origin "${NAME}-v${VERSION}"
fi
