import path from 'path'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import jsconfd from 'js.conf.d'
import { fileURLToPath } from 'url'

const { getEnabledFiles } = jsconfd

// `__dirname` equivalente en ESModules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
class JsconfdPlugin {

  constructor(opts) {
    this.opts = opts
    this.vmp = new VirtualModulesPlugin()
  }

  apply(compiler) {
    this.vmp.apply(compiler)

    compiler.hooks.afterResolvers.tap('jsconfd', () => {
      this.addVirtualIndex(compiler, getEnabledFiles(this.opts.folders, this.opts.sort))
    })

    compiler.resolverFactory.hooks.resolver
      .for('normal')
      .tap('jsconfd', resolver => {
        resolver.hooks.resolve.tapAsync('jsconfd', this.resolve.bind(this, compiler, resolver))
      })
  }

  addVirtualIndex(compiler, files) {
    const name = compiler.options.name || 'default'
    const modulePath = path.resolve(__dirname, '__virtual-conf-' + name + '.js')

    let contents = ''
    contents += 'const files = [\n'
    for (const file of files) {
      contents += `require('${file.replace(/\\/g, '\\\\')}'),\n`
    }
    contents += ']\n'
    contents += 'const merge = ' + (this.opts.merge ? this.opts.merge.toString() : 'Object.assign') + '\n'
    contents += 'const ret = files.reduce((acc, curr) => merge(acc, curr), {})\n'
    contents += 'export default ret\n'

    this.vmp.writeModule(modulePath, contents)
   }

  resolve(compiler, resolver, request, resolveContext, callback) {
    if (request.request === '#js.conf.d') {
      // Resolve to our previously-added virtual file
      const name = compiler.options.name || 'default'
      const obj = {
        context: request.context,
        path: __dirname,
        request: './__virtual-conf-' + name + '.js'
      }
      return resolver.doResolve(resolver.hooks.resolve, obj, '', resolveContext, callback)
    }
    callback()
  }

}

export default JsconfdPlugin
