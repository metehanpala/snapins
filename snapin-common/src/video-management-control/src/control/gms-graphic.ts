/**
 * GmsGraphic
 *
 * @export
 * @class GmsGraphic
 */
export class GmsGraphic {

  // zoom related constants
  public readonly zoomIncrement = 1.25;
  public readonly zoomDecrement = 0.8;
  public readonly maxZoomValue = 10.0; // 200.0;
  public readonly minZoomValue = 0.01;

  // graphic properties
  public hasCoverageArea: boolean;
  public coverageAreaMode: boolean;
  public isPermScaleToFit: boolean;

  // zoom properties
  public zoomFactor: number;
  public oldZoomFactor: number;

  // zoom buttons properties
  public initialBottom: number = undefined;

  /**
   * Creates an instance of GmsGraphic.
   *
   * @memberof GmsGraphic
   */
  public constructor() {
    this.resetZoomToPermScaleToFit();
  }

  /**
   * resetZoomToPermScaleToFit
   *
   * @memberof GmsGraphic
   */
  public resetZoomToPermScaleToFit(): void {
    this.hasCoverageArea = false;
    this.coverageAreaMode = false;
    this.isPermScaleToFit = true;
    this.zoomFactor = 1.0;
    this.oldZoomFactor = 1.0;
  }
}
