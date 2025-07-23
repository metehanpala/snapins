## Textual Viewer SnapIn - Layout Configuration Specification

The Textual Viewer snapin supports specific configuration capabilities via the `config` property of the `snapInType` or the `config` property of the `snapInReference`.

## Content
+ [avoidPreselectOnSecondarySelection](#avoidPreselectOnSecondarySelection-config-parameters)
+ [Example](#example)

## avoidPreselectOnSecondarySelection Config Parameters
> Specifies that selections sent by the Textual Viewer should specify "no preselection" as to not change the foreground snapin in the targeted pane. The default behavior is false.

### Example
> Example configuration to specify preselection on secondary selection behavior.
```json
  "config": {
    "avoidPreselectOnSecondarySelection": true
  }
```


--------------

Back to [Layout Definition](https://code.siemens.com/gms-flex/gms-flex/-/blob/master/docs/hldl/layout-definition-creation.md).
