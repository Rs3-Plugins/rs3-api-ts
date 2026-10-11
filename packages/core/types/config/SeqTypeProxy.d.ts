/** @noSelfInFile */

interface SeqTypeProxy extends ConfigTypeProxy, ParamHolder {
    readonly length: number;
    readonly loop: number;
    readonly maxLoop: number;
    readonly priority: number;
    readonly preAnimMove: PreAnimMove;
    readonly postAnimMove: PostAnimMove;
    readonly animDuplicateBehaviour: AnimationDuplicateBehaviour;
    readonly replaceHeldLeft: number;
    readonly replaceHeldRight: number;
}
