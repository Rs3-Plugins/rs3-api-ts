/** @noSelfInFile */

interface ModelGroup extends Component {
    SetModel(model: number): void;
    SetRecolour(index: number, colour: number): void;
    SetRematerial(index: number, material: number): void;
    SetLighting(ambient: number, contrast: number): void;
    AddCamera(info: unknown): number;
    UpdateCamera(cameraId: number, info: unknown): void;
    DeleteCamera(cameraId: number): void;
    SwitchCamera(cameraId: number, transition: ui.ModelCameraTransition): void;
    IsValidCameraID(cameraId: number): boolean;
}
