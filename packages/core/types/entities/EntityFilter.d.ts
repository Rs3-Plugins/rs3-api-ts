/** @noSelfInFile */

interface EntityFilter {
    configid?: number;
    config?: ConfigTypeProxy;
    parentconfig?: ConfigTypeProxy;
    parentconfigid?: number;
    name?: string;
    range?: number;
    samelevel?: boolean;
}
