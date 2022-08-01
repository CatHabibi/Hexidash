/* eslint-disable camelcase */
module.exports = {
  async doRedirect (req, res, redirect, extra) {
    if (typeof redirect === 'string') return res.redirect(redirect)

    if (redirect.error || redirect.success) {
      if (!req.session.variables) req.session.variables = {}

      req.session.variables.error = redirect.error
      req.session.variables.success = redirect.success
    }

    return res.redirect(redirect.path + (extra || ''))
  },

  async parseNumber (number) {
    switch (typeof number) {
      case 'string':
        if (number.length === 0) return null

        number = parseFloat(number)
        if (isNaN(number)) return undefined

        return Math.round(number)
      case 'number':
        return Math.round(number)
      default:
        return undefined
    }
  },

  async getUserResource (req) {
    let pkg = req.session.data.dbinfo.package || process.env.packages.default
    if (!process.env.packages.list[pkg]) pkg = process.env.packages.default

    const packageinfo = process.env.packages.list[pkg]
    packageinfo.id = pkg

    req.session.data.dbinfo = await process.db.fetchAccountPterodactylID(req.session.data.panelinfo.id)

    const extra = {
      memory: req.session.data.dbinfo.memory || 0,
      disk: req.session.data.dbinfo.disk || 0,
      cpu: req.session.data.dbinfo.cpu || 0,
      servers: req.session.data.dbinfo.servers || 0
    }

    const total = {
      memory: packageinfo.memory + extra.memory,
      disk: packageinfo.disk + extra.disk,
      cpu: packageinfo.cpu + extra.cpu,
      servers: packageinfo.servers + extra.servers
    }

    const user_servers = req.session.data.panelinfo.relationships.servers.data

    const current = {
      memory: 0,
      disk: 0,
      cpu: 0,
      servers: user_servers.length
    }

    for (const server of user_servers) {
      current.memory += server.attributes.limits.memory
      current.disk += server.attributes.limits.disk
      current.cpu += server.attributes.limits.cpu
    }

    return {
      packageinfo: packageinfo,
      extra: extra,
      total: total,
      current: current
    }
  }
}
