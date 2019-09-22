const fs = require('fs')
const path = require('path')

const { getEnabledFiles } = require('js.conf.d')

class JsconfdPlugin {

  constructor(opts) {
    this.opts = opts
  }

  apply(compiler) {
    this.addVirtualIndex(compiler, getEnabledFiles(this.opts.folders, this.opts.sort))

    compiler.resolverFactory.hooks.resolver
      .for('normal')
      .tap('jsconfd', resolver => {
        resolver.hooks.resolve.tapAsync('jsconfd', this.resolve.bind(this, resolver))
      });
  }

  addVirtualIndex(compiler, files) {
    const modulePath = path.resolve(__dirname, '__virtual-conf.js')
    const stats = { isFile: () => true }

    let contents = ''
    contents += 'const files = [\n'
    for (const file of files) {
      contents += `require('${file}'),\n`
    }
    contents += ']\n'
    contents += 'const merge = ' + (this.opts.merge ? this.opts.merge.toString() : 'Object.assign') + '\n'
    contents += 'const ret = files.reduce((acc, curr) => merge(acc, curr), {})\n'
    contents += 'export default ret\n'

    const addToFs = () => {
      compiler.inputFileSystem._statStorage.data.set(modulePath, [null, stats]);
      compiler.inputFileSystem._readFileStorage.data.set(modulePath, [null, contents]);
    }
    addToFs()

    const origPurge = compiler.inputFileSystem.purge
    compiler.inputFileSystem.purge = () => {
      origPurge.apply(compiler.inputFileSystem, arguments)
      addToFs()
    }
  }

  resolve(resolver, request, resolveContext, callback) {
    if (request.request === '#js.conf.d') {
      // Resolve to our previously-added virtual file
      const obj = {
        context: request.context,
        path: __dirname,
        request: './__virtual-conf.js'
      }
      return resolver.doResolve(resolver.hooks.resolve, obj, '', resolveContext, callback)
    }
    callback()
  }

}

module.exports = JsconfdPlugin
