Array.prototype.removeObject = function(obj) {
  var index = this.indexOf(obj);
  if(index !== -1) {
    this.splice(index, 1);
  }
}

Array.prototype.containsObject = function(obj) {
  return this.filter(item => item === obj).length !== 0;
}
