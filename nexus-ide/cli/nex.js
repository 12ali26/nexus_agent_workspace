#!/usr/bin/env node
/* global process */

// NEXUS IDE CLI — nex command
// Power user interface for the NEXUS workspace
// Usage: nex [resource] [action] [--options]

const args = process.argv.slice(2)
const NEXUS_API = process.env.NEXUS_API || 'http://localhost:8080'

function parseArgs(commandArgs) {
  const result = { resource: null, action: null, options: {} }
  const positional = []

  for (let index = 0; index < commandArgs.length; index += 1) {
    if (commandArgs[index].startsWith('--')) {
      const key = commandArgs[index].slice(2)
      const values = []

      while (
        commandArgs[index + 1] &&
        !commandArgs[index + 1].startsWith('--')
      ) {
        values.push(commandArgs[index + 1])
        index += 1
      }

      const value =
        values.length === 0 ? true : values.length === 1 ? values[0] : values

      if (result.options[key]) {
        result.options[key] = [].concat(result.options[key], value)
      } else {
        result.options[key] = value
      }
    } else {
      positional.push(commandArgs[index])
    }
  }

  result.resource = positional[0]
  result.action = positional[1]

  return result
}

async function sendToCanvas(renderInstructions) {
  try {
    const response = await fetch(`${NEXUS_API}/api/nex`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions: renderInstructions }),
    })

    if (response.ok) {
      console.log('✓ NEXUS canvas updated')
    } else {
      console.error('✗ Failed to reach NEXUS canvas')
    }
  } catch {
    console.error('✗ NEXUS not reachable. Is it running?')
  }
}

function showHelp() {
  console.log(`
NEXUS IDE CLI — nex

Usage: nex [resource] [action] [--options]

Resources & Commands:

  Data
    nex data list                          List loaded datasets
    nex data load <filename>               Load a file into workspace

  Primitives
    nex add table                          Add a Table block
    nex add chart [--x col] [--y col]      Add a Chart block
    nex add stats [--col column]           Add a Stats block
    nex add equation [--formula latex]     Add an Equation block
    nex add notebook [--title name]        Add a Notebook block
    nex add prose                          Add a Prose/LaTeX block
    nex add params                         Add a Parameters block
    nex add regression                     Add a Regression block
    nex add annotation                     Add an Annotation block
    nex add flag                           Add an Assumption Flag block

  Analysis
    nex regression --y col --x col [col]   Run regression analysis
    nex stats --col column                 Show stats for a column
    nex plot --x col --y col [--type scatter|line|bar]  Plot data

  Workspace
    nex clear canvas                       Clear all canvas blocks
    nex clear outputs                      Clear all output blocks
    nex list blocks                        List blocks on canvas
    nex export pdf                         Export canvas to PDF

  Help
    nex help                               Show this help
    nex version                            Show version

Examples:
  nex regression --y salary --x age years_exp
  nex plot --x age --y salary --type scatter
  nex stats --col age
  nex add notebook --title "Reserve Analysis"
  nex clear canvas
`)
}

async function main() {
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp()
    return
  }

  if (args[0] === 'version') {
    console.log('NEXUS IDE CLI v0.1.0')
    return
  }

  const { resource, action, options } = parseArgs(args)
  let instructions = []

  if (resource === 'add') {
    const primitiveMap = {
      annotation: { type: 'annotation', data: { annotations: [] } },
      chart: {
        type: 'chart',
        data: {
          chartType: options.type || 'line',
          data: [],
          xKey: options.x || 'x',
          yKey: options.y || 'y',
        },
      },
      equation: {
        type: 'equation',
        data: {
          formula: options.formula || String.raw`\hat{y} = mx + b`,
          resolved: '',
        },
      },
      flag: { type: 'assumption-flag', data: { assumptions: [] } },
      notebook: {
        type: 'notebook',
        data: { title: options.title || 'Notebook' },
      },
      params: { type: 'parameter-node', data: {} },
      prose: {
        type: 'prose-block',
        data: { content: '## New Document\n\nStart writing here...' },
      },
      regression: { type: 'regression', data: {} },
      stats: { type: 'stats', data: { column: options.col || null } },
      table: { type: 'table', data: {} },
    }

    if (primitiveMap[action]) {
      instructions = [primitiveMap[action]]
      console.log(`Adding ${action} block to canvas...`)
    } else {
      console.error(`Unknown primitive: ${action}`)
      console.log('Run nex help to see available primitives')
      return
    }
  } else if (resource === 'regression') {
    if (!options.y || !options.x) {
      console.error(
        'Usage: nex regression --y <dependent> --x <independent> [<independent2>]',
      )
      return
    }

    const xVars = [].concat(options.x)
    console.log(`Running regression: ${options.y} ~ ${xVars.join(' + ')}`)
    instructions = [
      {
        type: 'regression',
        data: {
          autoRun: true,
          dependentVar: options.y,
          independentVars: xVars,
        },
      },
    ]
  } else if (resource === 'plot') {
    if (!options.x || !options.y) {
      console.error('Usage: nex plot --x <column> --y <column> [--type scatter|line|bar]')
      return
    }

    console.log(`Plotting ${options.y} vs ${options.x}...`)
    instructions = [
      {
        type: 'chart',
        data: {
          chartType: options.type || 'scatter',
          title: `${options.y} by ${options.x}`,
          xKey: options.x,
          yKey: options.y,
        },
      },
    ]
  } else if (resource === 'stats') {
    console.log(`Opening stats for column: ${options.col || 'all'}`)
    instructions = [
      {
        type: 'stats',
        data: { column: options.col || null },
      },
    ]
  } else if (resource === 'clear') {
    if (action === 'canvas') {
      console.log('Clearing canvas...')
      instructions = [{ type: 'clear-canvas', data: {} }]
    } else if (action === 'outputs') {
      console.log('Clearing outputs...')
      instructions = [{ type: 'clear-outputs', data: {} }]
    }
  } else if (resource === 'list') {
    instructions = [{ type: 'list-blocks', data: {} }]
  } else if (resource === 'export') {
    console.log('Export coming soon...')
    instructions = [{ type: 'export', data: { format: action || 'pdf' } }]
  } else {
    console.error(`Unknown command: ${resource}`)
    console.log('Run nex help to see available commands')
    return
  }

  if (instructions.length > 0) {
    await sendToCanvas(instructions)
  }
}

main()
