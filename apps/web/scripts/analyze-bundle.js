#!/usr/bin/env node

/**
 * Bundle Analysis Script
 *
 * This script helps identify large dependencies and optimization opportunities
 *
 * Usage: node scripts/analyze-bundle.js
 */

const fs = require('fs')
const path = require('path')

// Read package.json
const packageJsonPath = path.join(__dirname, '../package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

console.log('📦 Bundle Size Analysis\n')
console.log('=' .repeat(60))

// Dependencies
const dependencies = packageJson.dependencies || {}
const devDependencies = packageJson.devDependencies || {}

console.log('\n📊 Production Dependencies:')
console.log('-'.repeat(60))

const depsList = Object.entries(dependencies).map(([name, version]) => ({
  name,
  version,
}))

depsList.forEach(({ name, version }) => {
  console.log(`  ✓ ${name.padEnd(40)} ${version}`)
})

console.log(`\n  Total: ${depsList.length} packages`)

// Known large packages
console.log('\n⚠️  Large Packages to Monitor:')
console.log('-'.repeat(60))

const largePackages = [
  'framer-motion',
  '@tanstack/react-query',
  'axios',
  'react-hook-form',
  'zod',
]

largePackages.forEach((pkg) => {
  if (dependencies[pkg]) {
    console.log(`  🔍 ${pkg.padEnd(40)} ${dependencies[pkg]}`)
  }
})

// Tree-shaking friendly packages
console.log('\n✅ Tree-Shaking Optimized Packages:')
console.log('-'.repeat(60))

const treeShakeable = [
  'lucide-react',
  'clsx',
  'tailwind-merge',
  'class-variance-authority',
]

treeShakeable.forEach((pkg) => {
  if (dependencies[pkg]) {
    console.log(`  🌲 ${pkg.padEnd(40)} ${dependencies[pkg]}`)
  }
})

// Recommendations
console.log('\n💡 Optimization Recommendations:')
console.log('-'.repeat(60))

const recommendations = [
  {
    package: 'framer-motion',
    tip: 'Use dynamic imports for heavy animations',
    impact: 'High',
  },
  {
    package: '@tanstack/react-query',
    tip: 'Ensure tree-shaking is working properly',
    impact: 'Medium',
  },
  {
    package: 'lucide-react',
    tip: 'Import individual icons instead of the whole library',
    impact: 'High',
  },
  {
    package: 'axios',
    tip: 'Consider using fetch API for simple requests',
    impact: 'Low',
  },
]

recommendations.forEach(({ package: pkg, tip, impact }) => {
  if (dependencies[pkg]) {
    const impactColor = impact === 'High' ? '🔴' : impact === 'Medium' ? '🟡' : '🟢'
    console.log(`  ${impactColor} ${pkg}`)
    console.log(`     ${tip}`)
    console.log('')
  }
})

// Bundle size targets
console.log('\n🎯 Bundle Size Targets:')
console.log('-'.repeat(60))
console.log('  First Load JS:          < 100 KB (Target)')
console.log('  Total Bundle:           < 250 KB (Target)')
console.log('  LCP:                    < 2.5s')
console.log('  FID:                    < 100ms')
console.log('  CLS:                    < 0.1')

// Commands
console.log('\n🛠️  Useful Commands:')
console.log('-'.repeat(60))
console.log('  npm run build:analyze   - Analyze bundle with visualization')
console.log('  npm run build           - Build for production')
console.log('  npm run start           - Start production server')

console.log('\n' + '='.repeat(60))
console.log('✨ Analysis complete!\n')
