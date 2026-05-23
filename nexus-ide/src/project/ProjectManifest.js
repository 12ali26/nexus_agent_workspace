export function isProjectManifestFile(file, parsedJson) {
  return (
    file.name === 'nexus.project.json' ||
    (parsedJson &&
      typeof parsedJson === 'object' &&
      !Array.isArray(parsedJson) &&
      typeof parsedJson.projectName === 'string' &&
      Array.isArray(parsedJson.capabilities))
  )
}

export function parseProjectManifest(file, fileText) {
  const parsedJson = JSON.parse(fileText)

  if (!isProjectManifestFile(file, parsedJson)) {
    return null
  }

  if (
    typeof parsedJson.projectName !== 'string' ||
    !parsedJson.projectName.trim() ||
    !Array.isArray(parsedJson.capabilities)
  ) {
    throw new Error('Invalid project manifest')
  }

  return {
    canvasState: Array.isArray(parsedJson.canvasState)
      ? parsedJson.canvasState
      : null,
    capabilities: parsedJson.capabilities.filter(
      (capability) => typeof capability === 'string',
    ),
    projectName: parsedJson.projectName.trim(),
    version:
      typeof parsedJson.version === 'string' ? parsedJson.version : '1.0.0',
  }
}

export function createProjectManifest({
  canvasState = [],
  capabilities,
  projectName,
}) {
  return {
    projectName,
    version: '1.0.0',
    capabilities,
    canvasState: canvasState.map(({ data, position, size, type, zIndex }) => ({
      data,
      position,
      size,
      type,
      zIndex,
    })),
  }
}
