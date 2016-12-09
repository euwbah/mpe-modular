Array.prototype.removeObject = function(obj) {
  var index = this.indexOf(obj);
  if(index !== -1) {
    this.splice(index, 1);
  }
}
