/** @noSelfInFile */

interface LocAnimationEvent extends LocEvent {
    readonly animation: SeqTypeProxy;
    readonly animationDelay: number;
}
