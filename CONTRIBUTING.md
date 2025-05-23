# Contributing

Contributions welcome, please raise a pull request.

## Requirements

You will need a recent version of Node and npm installed. Check the `.nvmrc` for a recommended version:

```bash
$ node -v
v20.16.0
$ npm -v
v10.8.1
```

To install Node (with npm) locally on macOS, we recommend [brew](https://brew.sh) with
[nvm](https://github.com/nvm-sh/nvm):

```bash
brew install nvm
nvm install
```

## Project structure

```
$ ls
dist/        # The compiled and ready to distribute build artefacts.
screenshots/ # Gets outputted by the end to end tests when something goes wrong.
examples/    # GitHub pages examples of using the autocomplete.
scripts/     # Build scripts that don't fit in `package.json`.
src/         # The source code for the library.
test/        # The tests for the library.
```

## Build tasks

To develop locally:

```bash
npm install
npm run dev
```

Contributions will need to pass the linter and tests. To run everything once:

```bash
npm test
```

To run the linter on its own:

```bash
npm run standard
```

To run the functional tests in dev mode (automatically reruns when a file changes):

```bash
npm run karma:dev
```

To run the integration tests locally with Chrome (specified in [wdio.config.js](test/wdio.config.js)):

```bash
npm run wdio
```

To run the integration tests on [Sauce Labs](https://saucelabs.com/), create a `.env` file with the following:

```bash
SAUCE_ENABLED="true"
SAUCE_USERNAME="XXXXXXXX"
SAUCE_ACCESS_KEY="YYYYYYYY"
```

And run the same command:

```bash
npm run wdio
```

Failed integration tests should output screenshots to the `./screenshots/` folder.

To build the project for distribution:

```bash
npm run build
```

You should do this and commit it before you attempt to `git push`, otherwise the prepush checks will prevent you from pushing.

## Prepush checks

When you push to a branch, git will run a `npm run prepush` [script](scripts/check-staged.mjs) that will compile the build on your behalf to the `dist/` folder. If it then finds unstaged files in `dist/`, it will fail your push.

The solution is to commit the files, preferably as part of a separate commit:

```bash
npm run build
git add dist/
git commit -m "Rebuild dist"
git push
```

If you want to ignore the checks and push regardless:

```bash
git push --no-verify
```

## PR nice to haves

- Tests for your feature or fix
- Updates to the README.md when necessary
- A 1 line update in CHANGELOG.md describing your changes

## Cutting a new release

`git pull --rebase` and then run:

```bash
git checkout -b "v1.2.3"
vim CHANGELOG.md # Update CHANGELOG, put all unreleased changes under new heading.
git commit -am "Update CHANGELOG"
npm version <major|minor|patch> -m "## 1.2.3 - 2017-01-13

- Change included in this release
- Another change included in this release"
```

Then run:
```bash
git push --tags --set-upstream origin refs/heads/v1.2.3:refs/heads/v1.2.3
```

Create a pull request for the release and merge once it has been approved, then run:

```bash
git checkout main
git pull --rebase
```
