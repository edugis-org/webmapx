# 🛠️ Developer Experience (DX) Guide: Creating New Modules

This guide outlines the standard procedure for adding a new UI feature (e.g., a Buffer Tool or Location Finder) to maintain architectural consistency and robustness.

## I. Unidirectional Data Flow

The system operates on a strict **Unidirectional Data Flow**. A UI component **NEVER** directly calls a map function that changes state without first updating the Central Store.



* **UI Component:** Dispatches intent (calls Adapter).
* **Adapter Service:** Translates intent into Map API call.
* **Map API:** Performs action and fires event.
* **Adapter Service:** Captures Map event and pushes resulting data to the **Central State Store**.
* **Central State Store:** Notifies all subscribed UI components.

## II. The Low Complexity Rule

**Rule:** All code for logic, calculations, and state manipulation **MUST** be offloaded from the UI Web Component.

| Task | Where it Belongs | File Path |
| :--- | :--- | :--- |
| **GIS Buffering** | Geoprocessing Adapter Service | [`../src/map/maplibre-services/GeoprocessingAdapterService.ts`](../src/map/maplibre-services/GeoprocessingAdapterService.ts) |
| **Opacity Throttling** | Style Adapter Service | [`../src/map/maplibre-services/StyleAdapterService.ts`](../src/map/maplibre-services/StyleAdapterService.ts) |
| **Calculating New State** | Central State Store (actions/reducers) | [`../src/store/central-state.ts`](../src/store/central-state.ts) |

## III. Building a New Module (The 3-Step Process)

To create a new feature (e.g., `gis-new-tool`), follow this process:

### 1. Define the Contract (The Interface)

If your feature requires a new capability, define it in the map interfaces file first.

* **File:** [`../src/map/IMapInterfaces.ts`](../src/map/IMapInterfaces.ts)
* **Action:** Create a new interface (e.g., `INewTool`) defining the methods your UI will call (`INewTool.toggle()`).

### 2. Implement the Service (The Adapter)

Create the concrete implementation that adheres to the new contract and handles robustness.

* **File:** Create a new file in `/src/map/maplibre-services/NewToolAdapterService.ts`.
* **Robustness Check:**
    * **Expensive Call?** If yes, wrap the internal map API call using `throttle()` from [`../src/utils/throttle.ts`](../src/utils/throttle.ts).
    * **Updates State?** If yes, ensure the final state update uses `store.dispatch(newState, 'MAP')` to declare the **source**.

### 3. Build the Component (The UI)

Copy the template and hook it up to the store and adapter.

* **Template:** Start by copying and renaming [`../src/components/modules/gis-new-tool-template.ts`](../src/components/modules/gis-new-tool-template.ts).
* **Subscription:** Ensure the component subscribes to the store and implements the **Temporary Muting** logic (checking `this.isSettingValue` flag) to prevent feedback loops.
* **Styling:** Use only Atomic Components and reference CSS variables (e.g., `var(--color-primary)`) for styling, never hardcoded values.