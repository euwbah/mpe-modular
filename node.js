/*
  IMPORTANT NOTE:
  Node has the following flags:
    Node.isPolyphonic: represents whether the Node has one synthNode instance per MPE channel
                       This flag affects the connecting logic of the connection.

    Node.hasOutput:    represents whether or not should the connection mode be triggered
                       on double click of this node
*/
// XXX XXX Classes

class SynthNodeWrapper {
  // A wrapper for the WebAudioAPI synth node
  constructor(outputtingNode, inputs) {
    this.outputtingNode = outputtingNode;
    this.inputs = inputs;
  }

  dispose() {
    this.outputtingNode.disconnect();
    this.outputtingNode = undefined;
    this.inputs = undefined;
  }
}

class Node {
  constructor(x, y, color, outlineColor, text, type) {

    this.isPolyphonic = false;
    this.hasOutput = true;

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
