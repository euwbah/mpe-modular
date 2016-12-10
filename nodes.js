
// XXX XXX Classes

class SynthNodeWrapper {
  // A wrapper for the WebAudioAPI synth node
  constructor(node, inputs) {
    this.node = node;
    this.inputs = inputs;
  }

  dispose() {
    this.node.disconnect();
    this.node = undefined;
    this.inputs = undefined;
  }
}

class Node {
  constructor(x, y, color, outlineColor, text, type) {
    let self = this;

    this.name = text;
    this.type = type;

    this.circle = new fabric.Circle({
      radius: 150,
      fill: color,
      stroke: outlineColor,
      strokeWidth: 2             // Border Outline width
    });
    this.text = new fabric.Text(text, {
        fontFamily: 'Raleway, sans-serif',
        fontSize: 48,
        fontWeight: 100,
        fill: 'rgba(255, 255, 255, 0.75)'
    });
    this.displayGroup = new fabric.Group([this.circle, this.text], {
      left: x,
      top: y
    });

    this.displayGroup.on('selected', function() {
      self.select();
      World.selectedNodes.forEach(node => node.deselect());
      World.selectedNodes = [self];
      World.selectedConnections.forEach(connection => connection.deselect());
      World.selectedConnections = [];
      World.doSelectionUpdate();
    })

    this.displayGroup.on('moving', function() {
      self.updatePositions();
    });

    this.displayGroup.on('modified', function() {
      self.updateBoundingBox();
    });

    // HACK: metadata to link to self
    this.displayGroup.synthNode = this;

    canvas.add(this.displayGroup);
    canvas.renderAll();

    // NOTE: hierarchy will be based on inputs.
    // outputConnections is just a reference to the Connections that are
    // connected to this object via it's output
    this.inputs = [];
    this.outputConnections = [];

    this.synthNodes = [];

    this.isPolyphonic = false;
    this.hasOutput = true;
  }

  changeName(newName) {
    let wrap9Chars = str => {
      let ret = '';
      let count = 0;
      str.split('').forEach(char => {
        ret += char;
        count ++;
        if (count === 9) {
          count = 0; ret += '\n';
        }
      });

      return ret.trim();
    };

    this.text.setText(wrap9Chars(newName));
    this.name = newName;
    canvas.renderAll();
  }

  select() {
    this.displayGroup.set({strokeWidth: 9});
  }

  deselect() {
    this.displayGroup.set({strokeWidth: 2});
  }

  getInput(inputName) {
    for(let input of this.inputs) {
      if (input.name === inputName) {
        return input;
      }
    }
  }

  delete() {
    canvas.remove(this.displayGroup);
    this.inputs.forEach(input => input.delete());
    // Can't use a forEach here, since array mutation is happening.
    while(this.outputConnections.length !== 0)
      this.outputConnections[0].delete(true);
    
    this.synthNodes.forEach(sn => sn.dispose());
    this.synthNodes = [];
    World.selectedNodes.removeObject(this);
    World.nodes.removeObject(this);
  }

  doubleClick() {
    if(this.hasOutput)
      World.enterConnectionMode(this);
  }

  generateHeaderHTML() {
    return '<input id="object-name" value="' + this.name + '"><h2>' + this.type + '</h2>';
  }

  generateCategorizedGroupHeaderHTML() {
    return '<input id="object-name" value="<Group>"><h2>' + this.type + 's</h2>';
  }

  generateGenericGroupHeaderHTML() {
    return '<input id="object-name" value="<Group>"><h2> Selection </h2>';
  }

  generateOptionsHTML() {
    return '<section class="center"><button id="remove">remove</button></section>';
  }

  scaleSynthNodes(numberOfMPEChannels) {
    let difference = numberOfMPEChannels - this.synthNodes.length;
    if (difference >= 1) {
      for(let c = 0; c < difference; c ++) {
        let toAdd = this.generateSynthNode();
        // TODO HERE: Scale the connections between this node and MPE Controller Nodes
        this.synthNodes.push(this.generateSynthNode());
      }
    } else if (difference <= -1) {
      for(let c = difference; c !== 0; c++) {
        this.synthNodes.pop();
      }
    }
  }

  generateSynthNode() {
    throw new Error('generateSynthNode() is not implemented');
  }

  // This whole thing is necessary as Inputs are connected directly to canvas, and
  // not the group. (Because FabricJS doesn't fully support per-object events).
  updatePositions(groupObject, dontUpdateConnections) {
    let left = this.displayGroup.getLeft();
    let top = this.displayGroup.getTop();

    this.inputs.forEach(input => input.updatePositions(left, top, groupObject));
    if (!dontUpdateConnections)
      this.outputConnections.forEach(connection =>
        connection.drawAndUpdateLine(connection.inputObject, this, groupObject));
  }

  updateBoundingBox() {
    // moving completed
    this.inputs.forEach(input => input.updateBoundingBox());
    this.outputConnections.forEach(connection => connection.updateBoundingBox());
  }
}

class OscillatorNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(255, 64, 64, 0.75)', 'rgb(250, 120, 120)', 'OSC', 'Oscillator');

    let self = this;

    this.paramConstants = {
      type: 'sine',   //sine, triangle, square, sawtooth
      frequency: 440, //Hertz
      detune: 0       //Cents
    };

    this.inputs.push(new Input({
      name: 'Frequency',
      displayName: 'freq',
      unit: 'Hz',
      parentNode: self,
      theta: 0,
      synthParamName: 'frequency'
    }));
    this.inputs.push(new Input({
      name: 'Detune',
      displayName: 'det',
      unit: 'semitones',
      parentNode: self,
      theta: 180,
      synthParamName: 'detune'
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
    $('#settings-panel #osc-type, #settings-panel #osc-detune, #settings-panel #osc-frequency').off();
  }

  //@Override
  // Multiple will be set to true if the changes made here have to affect all instances of
  // selected synth nodes
  generateOptionsHTML(multiple) {
    let self = this;
    let html = super.generateOptionsHTML();
    let sineSelected = '', triSelected = '', sawSelected = '', sqSelected = '';
    if (multiple === false) {
      sineSelected = this.paramConstants.type == 'sine'?' selected="selected"':'';
      triSelected = this.paramConstants.type == 'triangle'?' selected="selected"':'';
      sawSelected = this.paramConstants.type == 'sawtooth'?' selected="selected"':'';
      sqSelected = this.paramConstants.type == 'square'?' selected="selected"':'';
    }

    let placeholderOption = multiple?
      '<option value="" selected="selected" disabled>&lt;group&gt;</option>':'';
    let placeholder = multiple?'placeholder="<group>"':'';

    html += '<section><div>Waveform:</div>' +
            '<div><select id="osc-type">' + placeholderOption +
            '<option value="sine"' + sineSelected + '>Sine</option>' +
            '<option value="triangle"' + triSelected + '>Triangle</option>' +
            '<option value="sawtooth"' + sawSelected + '>Saw</option>' +
            '<option value="square"' + sqSelected + '>Square</option>' +
            '</select></div></section>' +

            '<section><div>Frequency (Hz)</div>' +
            '<div><input type="number" id="osc-frequency" ' + placeholder +
            'value="' + (multiple?'<group>':this.paramConstants.frequency) + '">' +
            '</div></section>' +

            '<section><div>Detune (Cents)</div>' +
            '<div><input type="number" id="osc-detune" ' + placeholder +
            'value="' + (multiple?'<group>':this.paramConstants.detune) + '">' +
            '</div></section>';
    return html;
  }

  applySingleSelectionEvents() {
    let self = this;
    $('#settings-panel #osc-type').change(function() {
      let val = $(this).val();
      self.setType($(this).find(':selected').val());
    });
    $('#settings-panel #osc-frequency').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setFrequency($(this).val());
      } else {
        $(this).val(self.paramConstants.frequency);
      }
    });
    $('#settings-panel #osc-detune').change(function() {
      let val = $(this).val();
      if(val !== '') {
        self.setDetune($(this).val());
      } else {
        $(this).val(self.paramConstants.detune);
      }
    });
  }

  applyGroupSelectionEvents() {
    $('#settings-panel #osc-type').change(function() {
      let val = $(this).val();
      // Empty val is the value attribute of the '<Group>' option
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setType($(this).find(':selected').val());
        });
      }
    });
    $('#settings-panel #osc-frequency').change(function() {
      let val = $(this).val();
      if(val !== '') {
        World.selectedNodes.forEach(node => {
          node.setFrequency($(this).val());
        });
      }
    });
    $('#settings-panel #osc-detune').change(function() {
      let val = $(this).val();
      if(val !=='') {
        World.selectedNodes.forEach(node => {
          node.setDetune($(this).val());
        });
      }
    });
  }

  generateSynthNode() {
    let osc = audioCtx.createOscillator();
    osc.type = this.paramConstants.type;
    osc.frequency.value = this.paramConstants.frequency;
    osc.detune.value = this.paramConstants.detune;
    return new SynthNodeWrapper(osc, {
      frequency: osc.frequency,
      detune: osc.detune
    });
  }

  setType(typeStr) {
    this.synthNodes.forEach(synthNode => synthNode.node.type = typeStr);
    this.paramConstants.type = typeStr;
  }

  setFrequency(freq) {
    this.synthNodes.forEach(synthNode => synthNode.node.frequency.value = freq);
    this.paramConstants.frequency = freq;
  }

  setDetune(detune) {
    this.synthNodes.forEach(synthNode => synthNode.node.detune.value = detune);
    this.paramConstants.detune = detune;
  }
}

class DestinationNode extends Node {

  constructor(x, y) {
    super(x, y, 'rgba(103, 103, 103, 0.75)', 'rgb(62, 62, 62)', 'OUT', 'Destination');

    // @Override
    this.hasOutput = false;
  }

  //@Override
  select() {
    super.select();
  }

  //@Override
  deselect() {
    super.deselect();
  }

  applySingleSelectionEvents() {

  }

  applyGroupSelectionEvents() {

  }
}
