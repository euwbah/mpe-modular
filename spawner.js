function instantiate(type) {
  switch(type) {
    case 'oscillator':
      World.spawn(new OscillatorNode(pointer.x, pointer.y));
      break;
    case 'gain':
      World.spawn(new GainNode(pointer.x, pointer.y));
      break;
  }
}
