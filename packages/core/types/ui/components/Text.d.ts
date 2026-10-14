/** @noSelfInFile */

interface Text extends Component {
    content: string | undefined;
    font: number;
    rgba: number;
    isShadowed: boolean;
    alignHorizontal: ui.AlignMode;
    alignVertical: ui.AlignMode;
    maxLines: number;
    lineSpacing: number;
}
