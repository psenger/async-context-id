## Deployment Steps

These are notes for deploying to NPM. I used `npmrc` to manage my NPM identities
(`npm i npmrc -g` to install ). Then I created a new profile called `public` with
(`npmrc -c public`) and then switch to it with `npmrc public`.

* create an [issue](https://github.com/psenger/markdown-fences/issues)
* create a `feature/<number>` branch based of `main` name it as recommended by github.
* check our branch out, do the work.
* Once done, your choirs
  * `npm run build`
  * `npm run test:coverage`
  * `npm run test:lint`
  * `npm run build:readme`
  * commit to your `feature/<number>` branch to GitHub
* Optional - create a pull request from branch to `dev` - if you need integration tests.
* Optional - create a pull request from `dev` to `main`


* check out `main`
* `npm version patch -m "message here" or minor`
* `npm publish --access public`
* Then switch to `dev` branch
* And then merge `main` into `dev` and push `dev` to origin

## using `release` ( standard version )

### First Release

```shell
npm run release -- --first-release
```

This will tag a release without bumping the version in package.json.

When you are ready, push the git tag and npm publish your first release

### Cutting Releases

Rather than `npm version`, use `npm run release`

As long as your git commit messages are conventional and accurate, you no longer need to specify the semver type - and you get CHANGELOG generation for free!

After you cut a release, you can **push the new git tag** and `npm publish` (or `npm publish --tag next`) when you're ready.
