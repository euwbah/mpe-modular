function instantiate(type) {
  switch(type) {
    case 'oscillator':
      World.spawn(new OscillatorNode(pointer.x, pointer.y));
      break;
    case 'noise':
      World.spawn(new NoiseNode(pointer.x, pointer.y));
      break;
    case 'gain':
      World.spawn(new GainNode(pointer.x, pointer.y));
      break;
    case 'filter':
      World.spawn(new FilterNode(pointer.x, pointer.y));
      break;
    case 'compressor':
      World.spawn(new CompressorNode(pointer.x, pointer.y));
      break;
    case 'key-gate':
      World.spawn(new KeyGateNode(pointer.x, pointer.y));
      break;
    case 'envelope':
      World.spawn(new EnvelopeNode(pointer.x, pointer.y));
      break;
  }
}
