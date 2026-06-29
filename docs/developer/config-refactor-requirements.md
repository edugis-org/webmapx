# WebMapX Configuration And Project Requirements

## Purpose

This document lists requirements for a refactored configuration model for WebMapX.

The goal is to define a generic map project model for a configurable map viewer that can support multiple rendering engines, including MapLibre, OpenLayers, Leaflet, and Cesium. The model must support reusable authored definitions, mutable runtime map state, saving and restoring full projects, saving individual layers, and packaging ordered sets of layers.

This document is not constrained by compatibility with the current EduGIS viewer. It may guide migration from existing EduGIS configurations, but the target model is defined independently.

## Scope

The refactored model should cover:

- project definitions
- project state
- reusable source definitions
- reusable single-layer and composite-layer definitions
- reusable layer definitions
- layer instances in a running map
- local and remote catalog definitions
- saving and loading full projects
- saving and loading single layers
- saving and loading ordered sets of layers
- validation and tooling

## What the Model Represents

The configuration models the following map rendering concepts:

- **Source**: a definition of the data to be rendered. A source describes where the data comes from — a tile service, a WMS endpoint, a vector file, or inline GeoJSON. In the case of a GeoJSON source, the source may also contain the data itself.

- **Project layer**: a selectable, orderable WebMapX layer in the project. Project layers appear in catalog trees, layer lists, and project state. A project layer may expand to one render layer or to multiple render layers.

- **Render layer**: an engine-level visual layer, for example one MapLibre layer object using `type`, `paint`, and `layout` properties. A render layer references a source, either by naming a source defined elsewhere or by embedding a source definition inline where supported.

- **Single layer definition**: a reusable project-layer definition with `kind: "single"` that expands to one render layer. For example, a simple WMS or XYZ raster layer is a single project layer referencing one source.

- **Composite layer definition**: a reusable project-layer definition with `kind: "composite"` that expands to multiple render layers. For example, an OSM Bright basemap may define a vector source and many render layers that draw different source layers or geometry classes.

Composite layers may reuse MapLibre-compatible conventions for `sources`, `glyphs`, `sprite`, `paint`, `layout`, filters, and source-layer names where useful, but they are not MapLibre style documents. A composite layer must not require a top-level MapLibre `version: 8` marker and must not be applied by replacing the whole map with `map.setStyle()`. It is expanded into the current project as one ordered WebMapX project layer containing an ordered block of render layers.

## Core Concepts

The model should distinguish at least the following concepts:

- `ProjectDefinition`: a reusable authored map/project configuration
- `ProjectState`: the mutable runtime state of a map
- `LayerDefinition`: a reusable definition for a layer
- `LayerInstance`: a concrete layer in a project, with current visibility, order, styling, and state
- `LayerPackage`: a portable saved layer or saved ordered set of layers

## Must

### General

- The configuration model must include an explicit version identifier for the configuration format.
- The configuration model must be engine-neutral at the canonical level.
- The configuration model must provide enough information for the viewer to configure any supported rendering engine, including MapLibre, OpenLayers, Leaflet, and Cesium.
- Where render-layer properties use MapLibre-compatible structures, the model must stay as close as reasonably possible to the relevant MapLibre style specification properties without treating composite layers as full MapLibre style documents.
- The authored input format must be human-editable and suitable for version control.
- The supported configuration structure must be documented in a machine-readable form.
- The configuration structure must have a typed schema, for example via JSON Schema or TypeScript/Zod-derived schema.
- The schema must document required properties, optional properties, defaults, and allowed value types.

### Separation of concerns

- The model must separate reusable definitions from per-project configuration.
- The model must separate project definition from project state.
- The model must separate catalog structure from project state.
- The model must separate project state from rendering definitions.
- The model must separate datasource metadata from layer instances that consume the datasource.
- The model must distinguish catalog node types from render layer types.
- The model must distinguish reusable layer definitions from mutable layer instances.

### Reuse

- Shared datasources must be definable once and reusable from multiple projects.
- Shared layer definitions must be definable once and reusable from multiple projects.
- Shared composite layer definitions must be definable once and reusable from multiple projects.
- Shared basemap or preset definitions must be definable once and reusable from multiple projects.
- A composite layer or preset must be able to expand to multiple render layers.

### Projects, layers, and packages

- The system must support saving and loading a full project independently from saving and loading one or more layers.
- The system must support saving a single layer as a portable document.
- The system must support saving multiple layers as an ordered portable package.
- A saved project must support viewport and map settings.
- A saved project must support map spatial reference configuration.
- A saved project must support active layer instances and their order.
- A saved project must support basemap or background selection.
- A saved project must support imported remote layers.
- A saved project must support user-created layers.
- A saved project must support per-layer state such as visibility and styling overrides.
- A saved layer must support both embedded data and referenced external services.
- A saved layer package must preserve layer order.

### Project state

- The model must support representation of the current map state, not just an initial startup state.
- The project state must be serializable so that a saved configuration can reflect user changes.
- The project state must explicitly represent which base/background layer is active.
- The project state must explicitly represent which non-background layers are active.
- The layer order in project state is defined by the order of the active layer list.
- Exclusive layer usage, such as the active background, must be modeled structurally rather than through conventions such as `checked = true` or reusable layer-level role flags.
- The model must support per-instance visibility state.
- The model must support per-instance styling overrides.
- The model must support persistence of user modifications to imported or predefined layers.
- Layer instances in project state that originate from reusable library objects must be able to reference their source library definition.
- The project state must support both library-backed layer instances and fully local layer instances with no library reference.
- A layer instance in `state.activeLayers` must support either a `ref` to a reusable `library.layers` definition or an inline `layer` definition.
- Inline layer definitions in project state must use the same layer-definition structure as reusable `library.layers` entries.
- References are preferred when a layer definition is reused; inline layer definitions are preferred for one-off imported, user-created, or project-local layers.

### Map settings

- The map configuration must support an `srs` or equivalent spatial reference property.
- If no `srs` is specified, the effective SRS may default to the engine default or to `EPSG:3857`, but the default behavior must be documented explicitly.

### Base/background behavior

- The model must support a base/background concept with exclusive selection behavior.
- The model must allow a map to have no active background layer.
- Base/background layers must always be rendered at the bottom of the stack.
- A layer used as a base/background must be able to include a background render layer of type `background`.
- A layer used as a base/background must be able to define its own background color and/or background pattern.
- The map must always have a defined background color, either explicitly in the configuration or via a documented default when omitted.
- Background selection metadata and fallback behavior must be representable outside render-layer definitions.
- Reusable layer definitions must not declare themselves as background or overlay layers. Project state, background sets, catalog structure, and tool placement determine how a layer is used in a specific project.

### Catalogs and tools

- The model must support grouping items in a tree-like catalog structure.
- A catalog item must be able to reference a reusable definition rather than duplicating its full render configuration inline.
- The model must support showing the same selectable item in multiple tool contexts, such as a catalog tree and a background-oriented selector when such a tool exists.
- The model must support local catalogs authored in the project.
- The model must support remote catalogs or remote layer sources that can be queried from tools.
- The model must support adding layers from the internet or from remote catalogs into the current project state.
- Tool-specific metadata such as title, icon, thumbnail, and visibility in specific tools must be representable without affecting render semantics.

### Tool configuration

- The model must support a top-level `tools` configuration section for viewer tools and controls.
- The model must support enabling or disabling individual tools with an explicit boolean property.
- The model must support positioning tools in named viewer layout regions, such as `top-left`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, and `middle-center`.
- The model must support deterministic ordering of multiple tools within the same layout region.
- The model must support container tools, such as a toolbar, that own ordered child tools.
- The model must support toolbar child tools that open or render content in an associated panel.
- A catalog or layer-tree tool must reference a catalog definition by id rather than embedding the catalog structure in the tool configuration.
- Tool configuration must remain separate from reusable catalog, source, and layer definitions.

### Styling and editing

- The model must support persisted styling for raster and vector layers.
- The model must support persisted transparency or opacity settings for raster and vector layers.
- The model must support persisted render property changes for vector layers.
- The model must support persisted styling for user-drawn point, line, and polygon layers.
- The model must support persistence of attribute metadata such as field definitions, translations, and value maps.
- The model must support saving and restoring layer visibility as part of layer state or project state.

### User-created layers and provenance

- The model must support user-drawn point, line, and polygon layers.
- The model must support saving both the layer configuration and the layer data for user-created vector layers.
- Layers created from existing layers, such as filtered layers, buffered layers, or otherwise transformed layers, must be representable as normal layer instances in project state.
- The model must support optional provenance metadata for layers created from other layers, describing source layer references, operations, and operation parameters where applicable.

### Vector data storage

- The model must support vector layer data embedded directly in the saved layer or project when appropriate.
- The model must support vector layer data stored externally alongside the saved layer, layer package, or project.
- A saved layer must be able to reference an external vector data file using a relative path.
- The model must support MapLibre-compatible GeoJSON source conventions:
  - when `source.type` is `geojson` and `source.data` is an object, it is treated as inline GeoJSON
  - when `source.type` is `geojson` and `source.data` is a string, it is treated as a URI or path
- Loading performance must not depend on embedding large vector datasets inside the main project file.

### Service and format support

- The model must support special layer services and formats through typed source definitions.
- The source model must be able to describe at least the kinds of layers currently needed, including WMS, WFS, WMTS, WMST, COG, Geobuf, GeoPackage, Allmaps, vector tiles, and GeoJSON.
- Service-specific required properties must be expressible in the schema.
- Service-specific metadata and capabilities must be expressible in the schema.
- Source and layer definitions must be able to declare a source- or request-level CRS independently from the project display SRS where relevant.
- Render-layer `source` properties must support either a string reference to a source in the applicable source scope or an inline source definition object.
- Inline source definitions must use the same typed source-definition structure as reusable `library.sources` entries.
- Source references are preferred when a source is reused; inline source definitions are preferred for one-off or project-local sources.
- The model must support temporal layers and temporal services where time is part of the source or layer definition.
- The model must support persisted temporal state where relevant, such as selected time value, selected interval, or active animation range.

### Authentication and secrets

- The model must support authenticated remote services.
- The project configuration must support references to API keys or similar credentials needed for remote services.
- Secrets such as API keys or tokens must not be stored directly in portable project files.
- Secrets such as API keys or tokens must be stored in a separate viewer-global configuration, such as a local non-portable viewer settings file, deployment-time environment-based configuration, or another documented viewer-managed secrets store.
- The structure and lookup behavior for credential references must be documented explicitly.
- The model must make it possible to keep reusable credential references separate from layer and source definitions.

### Engine capability handling

- The model must support engine-specific capability information where needed.
- The system must define how unsupported layer types, render-layer features, or service capabilities are handled for each engine.
- The system must be able to validate whether a project or layer is fully supported, partially supported, or unsupported for a chosen engine.
- The system must support viewer-level fallback policy for background selections.
- A viewer-level fallback policy must be able to define preferred background alternatives for engines that cannot render the preferred composite background directly.
- Background fallback policy must be definable globally or by named group, so that alternatives do not need to be repeated for every background selection entry.

### Validation

- Each id-bearing object type must use string ids, and the schema or accompanying specification must define the uniqueness scope for each such id.
- A validator must detect duplicate ids according to the documented uniqueness scope.
- A validator must detect missing references to sources, presets, layers, or catalog items.
- A validator must detect unsupported or unknown configuration properties.
- A validator must detect invalid combinations of properties.
- A validator must detect references from render layers to missing sources in the applicable source scope.
- A validator must detect invalid project state, including references to non-existent items.
- A validator must detect invalid service-specific source definitions.
- Validation must run independently from rendering.

### Naming and metadata

- Project-level property names and metadata property names must use `camelCase`.
- MapLibre-defined property names inside MapLibre-compatible render-layer objects must keep the naming required by the relevant MapLibre style specification properties.
- WebMapX-specific keys within `metadata` objects must use the `webmapx:` namespace prefix to avoid conflicts with MapLibre or other tooling that reads the same `metadata` field.
- The system must define a canonical metadata vocabulary for supported metadata fields.
- Legacy naming differences must either be rejected or normalized in a documented way.

## Should

### Model design

- The model should use explicit references such as ids or symbolic refs instead of implicit name matching.
- The model should reserve `type` for a single conceptual level where possible, and use separate fields such as `kind` for other levels.
- The model should minimize inline duplication in per-project files.
- The model should make common basemap usage concise.
- The model should support local per-project overrides of shared definitions in a controlled way.

### Projects and layers

- The project format should embed or reference saved layer documents in a consistent way.
- The model should support both snapshot and live-reference saving modes for external layers.
- The model should support deterministic ordering of non-background layers.
- The model should support deterministic ordering of render layers within a composite layer definition.
- The model should support deterministic ordering of layers within a saved layer package.

### Catalogs and tools

- The model should support selection rules on groups, such as single-select or multi-select behavior.
- The model should support separate tool placement metadata, for example whether an item appears in the catalog tree, a future background picker, or both.
- The model should support localized display titles and descriptions if needed.
- The model should support dedicated user workspaces or groups for imported and user-created layers.
- Background selector entries should be able to reference composite layers without requiring viewer-only properties to be embedded inside render-layer definitions.

### Vector data storage

- Small user-created vector layers should be allowed to remain embedded for portability and simplicity.
- Larger vector datasets should be written to external files rather than embedded in the main project or layer file.
- The save process should support `embedded`, `external`, and `auto` behavior for GeoJSON source data.
- The `auto` behavior should take into account feature count, serialized size, and possibly geometry complexity.

### Validation and tooling

- The validator should produce error messages that identify the file and path of the problem.
- The validator should support warnings in addition to hard errors.
- The toolchain should support a validate-only mode.
- The toolchain should support project, layer, and layer-package export and import.
- The build or export output should be deterministic.
- The migration process should support authored legacy configs and new project configs coexisting during transition.

### Compatibility and migration

- The refactor should allow incremental migration of existing EduGIS configuration content.
- The system should provide a documented mapping from legacy concepts such as `checked` to the new project state model.
- The system should provide a documented mapping from existing saved EduGIS layer formats to the new layer model.
- The versioning scheme should support future schema evolution and migration between configuration versions.

## Can

### Authoring conveniences

- The model can support shorthand preset references for common basemaps and data layers.
- The model can support composition helpers for common render-layer fragments.
- The model can support inheritance or templating if it remains explicit and debuggable.
- The model can support generated defaults for repeated UI metadata.

### Tooling extensions

- The validator can offer autofixes for simple naming or normalization problems.
- The export tool can emit normalized and prettified JSON.
- The tooling can emit additional debug output showing how references were resolved.
- The tooling can include commands to list unused sources or layer definitions.
- The tooling can report duplication hotspots to guide further refactoring.

### Packaging

- A layer package can be represented as an archive with a manifest and one or more layer files.
- A package can contain external data files such as GeoJSON, Geobuf, or GeoPackage alongside layer definitions.
- A package can distinguish between embedded data and referenced data for each layer.

### UI-specific extensions

- A selectable item can appear in more than one presentation surface.
- Base/background items can define preview thumbnails for a background selector UI.
- The model can support optional UI hints such as preferred grouping, expanded state, or sort order.
- The viewer can support named background fallback groups that map preferred composite backgrounds to engine-appropriate alternatives.

## Open Questions

- Should remote imports be saved as live references, local snapshots, or either?
- Which metadata fields are canonical and supported long-term?
- Which render-layer properties are guaranteed to be engine-neutral, and which require engine-specific extensions?
- Which layer-creation and transformation operations must be supported in the first iteration?

## Suggested Minimal First Iteration

- Define a typed schema for project definitions, project state, layer definitions, and layer instances.
- Introduce explicit project state instead of `checked`.
- Introduce reusable source definitions for repeated basemaps and common services.
- Introduce reusable layer definitions for repeated catalog items.
- Support both library-backed layer instances and fully local layer instances in project state.
- Represent layers created from other layers as normal layer instances, with optional provenance metadata.
- Define a save format for a single layer.
- Define a save format for a full project.
- Define at least the credential reference structure needed to resolve authenticated remote services via viewer-global configuration.
- Implement validation for duplicate ids, missing references, invalid project state, and invalid service definitions.
- Support GeoJSON source data both inline and via relative-path references.
- Support at least minimal temporal modeling for time-aware sources and layers, including time-related source or layer properties and persisted selected time state.
