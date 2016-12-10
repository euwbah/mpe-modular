class DestinationNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(103, 103, 103, 0.75)', 'rgb(62, 62, 62)', 'OUT', 'Destination');
    this.hasOutput = false;

    let self = this;

    // has no paramConstants

    this.inputs.push(new Input({
      name: 'Input',
      displayName: 'in',
      unit: '',
      parentNode: self,
      theta: 180,
      synthParamName: 'input'
    }));

    // Synth Nodes represents an array with index being the MIDI channel if
    // this Node is directly connected to an MPE Controller Node
    this.synthNodes[0] = this.generateSynthNode();
  }

  //@Override
  select() {
    super.select();
  }

  //@Override
  deselect() {
    super.deselect();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    // There aren't any options.
    return '';
  }

  applySingleSelectionEvents() { }

  applyGroupSelectionEvents() { }

  generateSynthNode() {
    let dest = audioCtx.destination;
    return new SynthNodeWrapper(dest, {});
  }
}
