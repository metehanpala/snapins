Observables returned by ObjectManagerCoreIfc API should never produce errors... that is, they should ALWAYS complete.  Errors should be consumed in core, logged, and mapped to a default response (undefined, empty array, etc...)

Separate view-model and its data so that data read from server can be shared among multiple view models.
