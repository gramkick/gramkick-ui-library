# Changesets

This folder holds pending [changesets](https://github.com/changesets/changesets).

- Run `npm run changeset` to describe a change and pick the semver bump.
- On merge to `main`, the release workflow opens (or updates) a "Version Packages"
  PR. Merging that PR versions `@gramkick/ui`, writes `CHANGELOG.md`, and publishes
  to npm.

npm run changeset
patch
commit and pushed
merged this branch `changeset-release/main` into `main`;
pull main branch and pushed (if merged on github)

Automatically publishes to npm

Now in project npm install @gramkick/ui
