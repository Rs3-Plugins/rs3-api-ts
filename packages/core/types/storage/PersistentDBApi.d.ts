/** @noSelfInFile */

interface PersistentDBApi {
    Get(key: string): unknown;
    GetInt(key: string): number | undefined;
    GetBool(key: string): boolean | undefined;
    GetFloat(key: string): number | undefined;
    GetString(key: string): string | undefined;
    GetStructuredData(key: string): unknown;
    Set(key: string, value: number | boolean | string): void;
    SetInt(key: string, value: number): void;
    SetBool(key: string, value: boolean): void;
    SetFloat(key: string, value: number): void;
    SetString(key: string, value: string): void;
    SetStructuredData(key: string, value: unknown): void;
    CheckExists(key: string): boolean;
    CheckExistsTyped(key: string, type: PersistentDBType): boolean;
    Delete(key: string): void;
    Clear(): void;
    IterateEntries(callback: (this: void, key: string, type: PersistentDBType) => void): void;
}
