declare const __PLUGIN_ID__: string;
declare const __PLUGIN_VERSION__: string;

declare module "*?worker&inline" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
