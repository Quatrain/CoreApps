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
# Environment: REGISTRY (default qtrn.io), REGISTRY_USER, REGISTRY_TOKEN, GITHUB_REF_NAME, GITHUB_SHA.
set -euo pipefail

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

echo "${REGISTRY_TOKEN}" | docker login "${REGISTRY}" -u "${REGISTRY_USER}" --password-stdin

BUILD_ARGS=()
for t in "${TAGS[@]}"; do BUILD_ARGS+=(--tag "${IMAGE}:${t}"); done
docker build --file "${DIR}/ContainerFile" "${BUILD_ARGS[@]}" "${DIR}"
for t in "${TAGS[@]}"; do docker push "${IMAGE}:${t}"; done

if [ "${BRANCH}" = "main" ]; then
  git add "${DIR}/package.json"
  git commit --no-verify -m "chore(release): publish v${VERSION} of ${PKG_NAME} [skip ci]"
  # Another container workflow may have pushed its own release commit meanwhile.
  git pull --rebase origin main
  git tag -a "${NAME}-v${VERSION}" -m "Release ${PKG_NAME} v${VERSION} [skip ci]"
  git push --no-verify origin "HEAD:main"
  git push --no-verify origin "${NAME}-v${VERSION}"
fi
