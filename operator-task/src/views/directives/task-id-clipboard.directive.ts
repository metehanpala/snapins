import { Directive, EventEmitter, HostListener, Input, Output } from "@angular/core";

@Directive({
  selector: '[gmsTaskIdToClipboard]',
  standalone: false
})
export class TaskIdToClipboardDirective {

  @Input("gmsTaskIdToClipboard")
  public payload: string;

  @Output()
  public readonly copied: EventEmitter<string> = new EventEmitter<string>();

  @HostListener("click", ["$event"])
  public onClick(event: MouseEvent): void {

    event.preventDefault();
    if (!this.payload) { return; }

    const listener = (e: ClipboardEvent): void => {
      const win = window as any;
      const clipboard = e.clipboardData || win.clipboardData;
      clipboard.setData("text", this.payload.toString());
      e.preventDefault();

      this.copied.emit(this.payload);
    };

    document.addEventListener("copy", listener, false)
    document.execCommand("copy");
    document.removeEventListener("copy", listener, false);
  }
}
